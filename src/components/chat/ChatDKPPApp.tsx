'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Grid, 
  Map as MapIcon, 
  MessageSquare, 
  User, 
  Shield, 
  LogIn, 
  LogOut,
  Sparkles,
  Layers,
  CheckCircle,
  X
} from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import { SplitMapPane } from './SplitMapPane';
import { ChatContainer } from './ChatContainer';
import { ChatInput } from './ChatInput';
import { AuthModal } from '@/components/auth/AuthModal';
import { NipClaimModal } from '@/components/auth/NipClaimModal';
import { LiveResultsCarousel } from '@/components/polling/LiveResultsCarousel';
import { ChatSession, ChatMessage, UserProfile, MapAction } from '@/types/dkpp';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type ViewMode = 'SPLIT' | 'PETA' | 'CHAT';

// Helper to get or create an isolated guest session ID scoped to this browser tab.
// NOTE: For authenticated (logged-in) users, the session is stored in localStorage
// and persists across browser restarts — exactly like ChatGPT and other professional apps.
// The session is only cleared on explicit logout.
const getBrowserSessionId = (): string => {
  if (typeof window === 'undefined') return 'guest_default';
  try {
    // Only remove legacy device ID (not user session — that's needed for persistence!)
    localStorage.removeItem('dkpp_browser_device_id');

    let id = sessionStorage.getItem('dkpp_browser_session_id');
    if (!id || id === 'guest' || id.startsWith('sess-')) {
      id = 'guest_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
      sessionStorage.setItem('dkpp_browser_session_id', id);
    }
    return id;
  } catch {
    return 'guest_' + Date.now();
  }
};

export const ChatDKPPApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('CHAT');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMapAction, setLastMapAction] = useState<MapAction | null>(null);
  const [highlightPins, setHighlightPins] = useState<any[]>([]);
  const [isCarouselOpen, setIsCarouselOpen] = useState<boolean>(false);
  const [carouselThemeCode, setCarouselThemeCode] = useState<string>('cantik');
  const [activeMapAnswer, setActiveMapAnswer] = useState<string | null>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const syncedUserIdRef = useRef<string | null>(null);

  const GUEST_DEFAULT: UserProfile = {
    id: 'guest_init',
    email: '',
    full_name: 'Pengunjung Tamu',
    role: 'GUEST',
    is_verified_employee: false,
    can_access_sensitive: false,
  };

  // User state (Default Guest with option to Login / Sign up)
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_DEFAULT);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [nipClaimModalOpen, setNipClaimModalOpen] = useState(false);

  // Guest message gate: after 2 messages, guest must log in or sign up
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [pendingGuestMessage, setPendingGuestMessage] = useState<string | null>(null);
  const GUEST_MESSAGE_LIMIT = 2;

  // Mobile detection & ViewMode guard (Mobile only allows CHAT or PETA, never SPLIT)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setViewMode((prev) => {
        if (mobile && prev === 'SPLIT') return 'CHAT';
        return prev;
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user session strictly scoped to this browser session & listen to Supabase Auth changes
  useEffect(() => {
    const sessionId = getBrowserSessionId();
    let initialUser: UserProfile = {
      ...GUEST_DEFAULT,
      id: sessionId,
    };

    try {
      // Read from localStorage first (persistent across sessions — like ChatGPT).
      // For guest/shared-device safety, users should logout explicitly.
      // Fallback to sessionStorage for backward compatibility.
      const saved = localStorage.getItem('dkpp_user_session') || sessionStorage.getItem('dkpp_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || parsed.role) && parsed.role !== 'GUEST') {
          initialUser = parsed;
          syncedUserIdRef.current = parsed.id;
          // Sync to sessionStorage as well for cross-tab consistency
          try { sessionStorage.setItem('dkpp_user_session', saved); } catch {}
        }
      }
    } catch {}

    setCurrentUser(initialUser);
    fetchSessions(initialUser.id);

    const syncUserFromSupabase = async (user: any) => {
      if (!user) return;
      const isSameUser = syncedUserIdRef.current === user.id;

      const email = user.email?.toLowerCase() || '';
      const isAdmin = email === 'ridwansugiarto.mail@gmail.com';
      const savedNip = user.user_metadata?.nip || '';
      let isVerified = isAdmin || !!savedNip;
      let finalFullName = user.user_metadata?.full_name || user.user_metadata?.name || (isAdmin ? 'Ridwan Sugiarto, S.Pi' : email.split('@')[0]);
      let finalDept = user.user_metadata?.department || (isAdmin ? 'Ketahanan Pangan' : undefined);
      let finalPosition = user.user_metadata?.position || (isAdmin ? 'Analis Ketahanan Pangan Ahli Muda' : undefined);

      if (!isAdmin && savedNip) {
        try {
          const vRes = await fetch('/api/auth/verify-nip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nip: savedNip }),
          });
          const vData = await vRes.json();
          if (vData.valid) {
            isVerified = true;
            finalFullName = vData.nama || finalFullName;
            finalDept = vData.bidang;
            finalPosition = vData.jabatan;
          }
        } catch {}
      }

      const profile: UserProfile = {
        id: user.id,
        email: email,
        full_name: finalFullName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        role: isAdmin ? 'ADMIN' : (isVerified ? 'EMPLOYEE' : 'GUEST'),
        is_verified_employee: isVerified,
        can_access_sensitive: isVerified,
        nip: savedNip || (isAdmin ? '197610182002121002' : undefined),
        department: finalDept,
        position: finalPosition,
      };

      setCurrentUser(profile);
      try {
        localStorage.setItem('dkpp_user_session', JSON.stringify(profile));
        sessionStorage.setItem('dkpp_user_session', JSON.stringify(profile));
      } catch {}

      // ONLY purge state and refetch sessions if this is a genuinely NEW/different user
      if (!isSameUser) {
        syncedUserIdRef.current = user.id;
        setSessions([]);
        setMessages([]);
        setActiveSessionId(null);
        fetchSessions(profile.id);
      }

      // Auto-prompt dialog klaim NIP jika user login Google dan belum memiliki NIP terverifikasi
      if (!isAdmin && !isVerified) {
        const promptedKey = 'dkpp_nip_prompted_' + user.id;
        const alreadyPrompted = sessionStorage.getItem(promptedKey);
        if (!alreadyPrompted) {
          try {
            sessionStorage.setItem(promptedKey, 'true');
          } catch {}
          setTimeout(() => {
            setNipClaimModalOpen(true);
          }, 700);
        }
      }

      // Bersihkan hash token atau query code dari URL setelah Supabase selesai membaca sesi
      if (typeof window !== 'undefined' && (window.location.hash.includes('access_token=') || window.location.search.includes('code='))) {
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 1500);
      }
    };

    // Bersihkan parameter eror URL pasca-OAuth (jika ada) agar tidak memicu kendala muat halaman
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('error=') || search.includes('error=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // 1. Cek sesi Supabase yang sudah tersimpan
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserFromSupabase(session.user);
      }
    });

    // 2. Dengarkan perubahan status otentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        syncUserFromSupabase(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    // Immediately isolate state
    syncedUserIdRef.current = user.id;
    setSessions([]);
    setMessages([]);
    setActiveSessionId(null);
    setCurrentUser(user);
    // Reset guest gate
    setGuestMessageCount(0);
    try {
      // Persist session to localStorage so it survives browser restarts
      localStorage.setItem('dkpp_user_session', JSON.stringify(user));
      sessionStorage.setItem('dkpp_user_session', JSON.stringify(user));
    } catch {}
    fetchSessions(user.id);

    // If there was a pending guest message, send it now after auth succeeds
    if (pendingGuestMessage) {
      const msgToSend = pendingGuestMessage;
      setPendingGuestMessage(null);
      // Small delay to let state settle
      setTimeout(() => handleSendMessage(msgToSend), 300);
    }
  };

  const handleLogout = async () => {
    syncedUserIdRef.current = null;
    try {
      // On explicit logout: clear ALL stored session data from both storages
      sessionStorage.removeItem('dkpp_user_session');
      sessionStorage.removeItem('dkpp_browser_session_id');
      localStorage.removeItem('dkpp_user_session');
      localStorage.removeItem('dkpp_browser_device_id');
      // Sign out from Supabase (also clears Supabase tokens from localStorage)
      await supabase.auth.signOut();
    } catch {}
    // Rotate to a fresh session-isolated guest ID
    const freshGuestId = 'guest_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
    try {
      sessionStorage.setItem('dkpp_browser_session_id', freshGuestId);
    } catch {}

    const freshGuest: UserProfile = {
      ...GUEST_DEFAULT,
      id: freshGuestId,
    };
    setCurrentUser(freshGuest);
    setSessions([]);
    setMessages([]);
    setActiveSessionId(null);
  };

  // Load chat sessions strictly scoped to the active user/browser
  const fetchSessions = async (targetId?: string) => {
    const userId = targetId || currentUser.id;
    if (!userId || userId === 'guest' || userId === 'guest_init') {
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
      return;
    }

    try {
      const res = await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        setActiveSessionId(data.sessions[0].id);
        loadMessages(data.sessions[0].id);
      } else {
        // Clean fresh state for this user/browser (no leakage from other users)
        setSessions([]);
        setMessages([]);
        setActiveSessionId(null);
      }
    } catch {
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/messages?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch {
      setMessages([]);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    loadMessages(id);
    setSidebarOpen(false);
  };

  const handleNewChat = async () => {
    const newTitle = 'Percakapan Baru';
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, title: newTitle }),
      });
      const data = await res.json();
      if (data.session) {
        setSessions((prev) => [data.session, ...prev.slice(0, 9)]);
        setActiveSessionId(data.session.id);
        setMessages([]);
      }
    } catch {
      const fallbackId = `sess-${Date.now()}`;
      const newSess: ChatSession = {
        id: fallbackId,
        user_id: currentUser.id,
        title: newTitle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSessions((prev) => [newSess, ...prev.slice(0, 9)]);
      setActiveSessionId(fallbackId);
      setMessages([]);
    }
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    try {
      await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: newTitle }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
      );
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          loadMessages(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handlePinSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, is_pinned: !s.is_pinned } : s));
      return [...updated].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      });
    });
  };

  const handleArchiveSession = async (id: string) => {
    try {
      await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_archived: true }),
      });
    } catch {}
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          loadMessages(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
      return remaining;
    });
  };

  const handleShareSession = (id: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}?session=${id}`);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // ── GUEST GATE ───────────────────────────────────────────────────────────
    // After GUEST_MESSAGE_LIMIT messages, require login/signup.
    // The pending message is saved and automatically sent after auth succeeds.
    const isCurrentlyGuest = currentUser.role === 'GUEST' || currentUser.id.startsWith('guest_');
    if (isCurrentlyGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      setPendingGuestMessage(text);
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      return;
    }

    // Ensure session exists or create on the fly strictly for this user/browser
    let currentSessId = activeSessionId;
    if (!currentSessId) {
      const autoTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
      const isGuest = currentUser.role === 'GUEST' || currentUser.id.startsWith('guest_');

      if (isGuest) {
        // Guest: use ephemeral in-memory session only (not persisted to DB)
        // This is cleared automatically when the browser session ends.
        currentSessId = `sess-${Date.now()}`;
        setActiveSessionId(currentSessId);
        const guestSess: ChatSession = {
          id: currentSessId,
          user_id: currentUser.id,
          title: autoTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSessions((prev) => [guestSess, ...prev.slice(0, 9)]);
      } else {
        try {
          const sRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, title: autoTitle }),
          });
          const sData = await sRes.json();
          if (sData?.session?.id) {
            currentSessId = sData.session.id;
            setActiveSessionId(sData.session.id);
            setSessions((prev) => [sData.session, ...prev.slice(0, 9)]);
          } else {
            currentSessId = `sess-${Date.now()}`;
            setActiveSessionId(currentSessId);
          }
        } catch {
          currentSessId = `sess-${Date.now()}`;
          setActiveSessionId(currentSessId);
        }
      }
    }

    if (!currentSessId) {
      currentSessId = `sess-${Date.now()}`;
      setActiveSessionId(currentSessId);
    }

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: currentSessId || 'default',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    // Increment guest message counter (only for actual guest users)
    if (isCurrentlyGuest) {
      setGuestMessageCount((prev) => prev + 1);
    }

    // Update session title if it's the first message
    if (messages.length === 0 && currentSessId) {
      const autoTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
      handleRenameSession(currentSessId, autoTitle);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessId,
          message: text,
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
        }),
      });

      const data = await res.json();

      const msgContent = data.content || data.message?.content || '';
      if (msgContent || data.poll_card || data.poll_catalog || data.poll_carousel || data.forecast_table || data.auth_prompt || data.message) {
        const aiMsg: ChatMessage = {
          id: data.assistantMessageId || data.message?.id || `ai-${Date.now()}`,
          session_id: currentSessId || 'default',
          role: 'assistant',
          content: msgContent,
          type: data.type || data.message?.type || 'text',
          poll_card: data.poll_card || data.message?.poll_card,
          poll_catalog: data.poll_catalog || data.message?.poll_catalog,
          poll_carousel: data.poll_carousel || data.message?.poll_carousel,
          forecast_table: data.forecast_table || data.message?.forecast_table,
          auth_prompt: data.auth_prompt || data.message?.auth_prompt,
          sources: data.sources || data.message?.sources || [],
          tool_calls: data.tool_calls || data.message?.tool_calls || [],
          map_actions: data.map_actions || data.message?.map_actions || [],
          created_at: data.message?.created_at || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Dispatch map action if any (simpan state peta tanpa otomatis berpindah mode)
        const mapActions = data.map_actions || data.message?.map_actions;
        if (mapActions && mapActions.length > 0) {
          const act = mapActions[0];
          setLastMapAction({
            ...act,
            _id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          });
          if (act.pins && act.pins.length > 0) {
            setHighlightPins(act.pins);
          } else if (act.pin) {
            setHighlightPins([act.pin]);
          }
        }
        if (data.matched_pins && data.matched_pins.length > 0) {
          setHighlightPins(data.matched_pins);
        }

        // Jika user sedang di tab PETA
        if (viewMode === 'PETA' && msgContent) {
          setActiveMapAnswer(msgContent);
        }
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        session_id: currentSessId || 'default',
        role: 'assistant',
        content: 'AI sedang tidak tersedia. Silakan coba kembali.',
        sources: [{ type: 'LOCAL DATA', title: 'DKPP Cilegon Offline Fallback' }],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Handshake untuk beralih ke mode Peta GIS secara instan tanpa dialog/popup berulang
  const handleOpenMap = (action?: any, answerContent?: string) => {
    if (action) {
      setLastMapAction({
        ...action,
        _id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      });
      if (action.pins && action.pins.length > 0) {
        setHighlightPins(action.pins);
      } else if (action.pin) {
        setHighlightPins([action.pin]);
      }
    }
    if (answerContent) {
      setActiveMapAnswer(answerContent);
    }
    setViewMode('PETA');
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onPinSession={handlePinSession}
        onArchiveSession={handleArchiveSession}
        onShareSession={handleShareSession}
        user={currentUser}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onLoginClick={() => handleOpenAuth('login')}
        onLogoutClick={handleLogout}
        onClaimNipClick={() => setNipClaimModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-14 px-3 sm:px-4 flex items-center justify-between border-b border-gray-200/90 bg-white/95 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 flex items-center justify-center text-gray-700 hover:text-gray-900 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile View Switcher: ONLY 2 View Modes (Chat & Peta GIS) - SPLIT Dihapus di Mobile */}
          <div className="flex md:hidden items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-xs text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('CHAT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'CHAT'
                  ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('PETA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'PETA'
                  ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta GIS</span>
            </button>
          </div>

          {/* Desktop View Switcher: 3 Modes [SPLIT] [PETA] [CHAT] */}
          <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80 shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('SPLIT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'SPLIT'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>SPLIT</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('PETA')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'PETA'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>PETA</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CHAT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'CHAT'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>CHAT</span>
            </button>
          </div>

          {/* Right Header: Log in & Sign up for free (Guests) / Profile (Logged in) */}
          {(!currentUser.email || currentUser.id === 'guest' || currentUser.id.startsWith('guest_')) ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth('signup')}
                className="bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-1.5 rounded-full border border-neutral-300 shadow-xs transition-all hidden sm:inline-flex cursor-pointer"
              >
                Sign up for free
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentUser.email?.toLowerCase() === 'ridwansugiarto.mail@gmail.com' ? (
                <Link
                  href="/admin"
                  className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">Portal Admin</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
              ) : currentUser.is_verified_employee ? (
                <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-semibold">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">ASN Terverifikasi</span>
                  <span className="sm:hidden">ASN</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setNipClaimModalOpen(true)}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-bold border border-emerald-300 shadow-xs transition-all cursor-pointer"
                  title="Klaim NIP Pegawai untuk membuka mode dokumen sensitif"
                >
                  <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Klaim NIP Pegawai</span>
                  <span className="sm:hidden">Klaim NIP</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 py-1 rounded-xl bg-gray-100 text-xs font-medium border border-gray-200/80 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'DK'
                  )}
                </div>
                <span className="max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline font-semibold">
                  {currentUser.full_name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar / Ganti Akun"
                  className="p-1 hover:text-red-500 rounded transition-colors text-gray-400 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Workspace Layout: Bersih, Terang, Responsif */}
        <main
          ref={mainScrollRef}
          className={`flex-1 flex flex-col md:flex-row overflow-hidden ${
            viewMode === 'CHAT'
              ? 'p-0 bg-white'
              : 'p-2 sm:p-3 gap-3'
          }`}
        >
          {/* Chat Assistant Pane (Default Fullscreen di Mobile & Desktop CHAT mode luas layaknya ChatGPT, atau di Kanan saat Desktop SPLIT) */}
          {((isMobile && viewMode === 'CHAT') || (!isMobile && (viewMode === 'SPLIT' || viewMode === 'CHAT'))) && (
            <div
              className={`flex flex-col overflow-hidden min-w-0 ${
                viewMode === 'CHAT' || isMobile
                  ? 'w-full h-full bg-white border-0 shadow-none rounded-none'
                  : 'w-full md:w-1/2 h-full shrink-0 order-2 bg-white rounded-2xl border border-gray-200 shadow-xs'
              }`}
            >
              <ChatContainer
                messages={messages}
                isLoading={isLoading}
                onSuggestionClick={handleSendMessage}
                onSendMessage={handleSendMessage}
                viewMode={viewMode}
                onOpenMap={handleOpenMap}
                onLoginClick={() => setAuthModalOpen(true)}
                onClaimNipClick={() => setNipClaimModalOpen(true)}
                onOpenCarousel={(code) => {
                  handleSendMessage(code ? `lihat live hasil ${code}` : 'lihat carousel live polling');
                }}
                currentUser={currentUser}
              />

              {/* Bottom Sticky ChatInput (Hanya muncul saat percakapan sudah berjalan - Capture 3) */}
              {messages.length > 0 && (
                <div
                  className={`shrink-0 ${
                    viewMode === 'CHAT'
                      ? 'px-2 sm:px-6 pb-2.5 sm:pb-3 pt-1 bg-white w-full'
                      : 'p-2 sm:p-3 border-t border-gray-100 bg-white/90 backdrop-blur-sm'
                  }`}
                >
                  <div className={viewMode === 'CHAT' ? 'max-w-3xl mx-auto' : ''}>
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                      isCentered={false}
                      placeholder="Ask anything"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GIS Map Pane (Fullscreen di Mobile saat mode PETA, atau di Kiri saat Desktop SPLIT) */}
          {((isMobile && viewMode === 'PETA') || (!isMobile && (viewMode === 'SPLIT' || viewMode === 'PETA'))) && (
            <div
              id="gis-map-section"
              className={`relative transition-all duration-200 ${
                viewMode === 'PETA' || isMobile
                  ? 'w-full h-full min-h-[350px]'
                  : 'w-full md:w-1/2 h-full shrink-0 order-1'
              }`}
            >
              <div className="w-full h-full">
                <SplitMapPane
                  lastAction={lastMapAction}
                  highlightPins={highlightPins}
                  onSelectKelurahan={(prompt) => {
                    handleSendMessage(prompt);
                    // Capture 6: jika user klik tombol bertanya ke AI untuk jawaban presisi di poligon sawah, otomatis menampilkan tab peta gis (hanya di versi mobile)
                    if (isMobile) {
                      setViewMode('PETA');
                    }
                  }}
                />
              </div>

              {/* Mobile Quick Return Button to Chat */}
              {isMobile && viewMode === 'PETA' && (
                <button
                  type="button"
                  onClick={() => setViewMode('CHAT')}
                  className="absolute top-3 left-3 z-[500] flex items-center gap-1.5 px-3.5 py-2 bg-white/95 backdrop-blur-md text-emerald-800 hover:bg-white text-xs font-bold rounded-xl border border-gray-200 shadow-md transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>← Kembali ke Chat</span>
                </button>
              )}

              {/* Floating AI Precision Answer Card on Map (Capture 6) */}
              {activeMapAnswer && (
                <div className="absolute bottom-6 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md bg-white/98 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-emerald-500/40 z-[600] animate-in fade-in slide-in-from-bottom-3">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Analisis Agronomi Presisi AI</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMapAnswer(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors cursor-pointer"
                      title="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-800 line-clamp-4 leading-relaxed whitespace-pre-line font-medium">
                    {activeMapAnswer.replace(/[*#`]/g, '')}
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-medium">ChatDKPP Geointelligence</span>
                    <button
                      type="button"
                      onClick={() => setViewMode('CHAT')}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Buka Chat Penuh</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Autentikasi (Layer z-[99999] agar tidak pernah tertumpuk oleh Leaflet Map) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        guestLimitReached={!!pendingGuestMessage}
        onClose={() => {
          setAuthModalOpen(false);
          // If closed without auth while gate is active, discard the pending message
          setPendingGuestMessage(null);
        }}
        onSuccess={handleAuthSuccess}
        onContinueAsGuest={() => {
          handleLogout();
          setAuthModalOpen(false);
        }}
      />

      {/* Modal Klaim NIP Pasca-Google OAuth */}
      <NipClaimModal
        isOpen={nipClaimModalOpen}
        user={currentUser}
        onClose={() => setNipClaimModalOpen(false)}
        onSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem('dkpp_user_session', JSON.stringify(updatedUser));
            sessionStorage.setItem('dkpp_user_session', JSON.stringify(updatedUser));
          } catch {}
        }}
      />
    </div>
  );
};
