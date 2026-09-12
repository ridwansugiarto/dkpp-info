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
  Layers
} from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import { SplitMapPane } from './SplitMapPane';
import { ChatContainer } from './ChatContainer';
import { ChatInput } from './ChatInput';
import { AuthModal } from '@/components/auth/AuthModal';
import { ChatSession, ChatMessage, UserProfile, MapAction } from '@/types/dkpp';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type ViewMode = 'SPLIT' | 'PETA' | 'CHAT';

// Helper to get or create a persistent, isolated client ID for this browser instance
const getBrowserDeviceId = (): string => {
  if (typeof window === 'undefined') return 'guest_default';
  try {
    let id = localStorage.getItem('dkpp_browser_device_id');
    if (!id || id === 'guest' || id.startsWith('sess-')) {
      id = 'guest_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
      localStorage.setItem('dkpp_browser_device_id', id);
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
  const mainScrollRef = useRef<HTMLElement | null>(null);

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

  // Load user session from browser storage (isolated per browser) & listen to Supabase Auth changes
  useEffect(() => {
    const browserId = getBrowserDeviceId();
    let initialUser: UserProfile = {
      ...GUEST_DEFAULT,
      id: browserId,
    };

    try {
      const saved = sessionStorage.getItem('dkpp_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || parsed.role)) {
          initialUser = parsed;
        }
      }
    } catch {}

    setCurrentUser(initialUser);
    fetchSessions(initialUser.id);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const email = session.user.email?.toLowerCase() || '';
        const isAdmin = email === 'ridwansugiarto.mail@gmail.com';
        const profile: UserProfile = {
          id: session.user.id,
          email: email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || (isAdmin ? 'Dr. Ir. Ridwan Sugiarto, M.Si' : email.split('@')[0]),
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          role: isAdmin ? 'ADMIN' : 'EMPLOYEE',
          is_verified_employee: isAdmin,
          can_access_sensitive: isAdmin,
          nip: isAdmin ? '197610182002121002' : undefined,
          department: isAdmin ? 'Pimpinan DKPP' : undefined,
          position: isAdmin ? 'Kepala Dinas DKPP (Super Admin)' : undefined,
        };
        setCurrentUser(profile);
        sessionStorage.setItem('dkpp_user_session', JSON.stringify(profile));
        fetchSessions(profile.id);
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
    setCurrentUser(user);
    sessionStorage.setItem('dkpp_user_session', JSON.stringify(user));
    fetchSessions(user.id);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('dkpp_user_session');
    // Rotate to a fresh browser device guest ID to ensure total memory isolation for subsequent visits
    const freshGuestId = 'guest_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
    try {
      localStorage.setItem('dkpp_browser_device_id', freshGuestId);
    } catch {}

    const freshGuest: UserProfile = {
      ...GUEST_DEFAULT,
      id: freshGuestId,
    };
    setCurrentUser(freshGuest);
    setSessions([]);
    setMessages([]);
    setActiveSessionId(null);
    try {
      await supabase.auth.signOut();
    } catch {}
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Ensure session exists or create on the fly strictly for this user/browser
    let currentSessId = activeSessionId;
    if (!currentSessId) {
      const autoTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
      try {
        const sRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, title: autoTitle }),
        });
        const sData = await sRes.json();
        if (sData.session) {
          currentSessId = sData.session.id;
          setActiveSessionId(sData.session.id);
          setSessions((prev) => [sData.session, ...prev.slice(0, 9)]);
        }
      } catch {
        currentSessId = `sess-${Date.now()}`;
        setActiveSessionId(currentSessId);
      }
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

      if (data.content) {
        const aiMsg: ChatMessage = {
          id: data.assistantMessageId || `ai-${Date.now()}`,
          session_id: currentSessId || 'default',
          role: 'assistant',
          content: data.content,
          sources: data.sources || [],
          tool_calls: data.tool_calls || [],
          map_actions: data.map_actions || [],
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Dispatch map action if any
        if (data.map_actions && data.map_actions.length > 0) {
          setLastMapAction({
            ...data.map_actions[0],
            _id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          });
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
        user={currentUser}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onLoginClick={() => handleOpenAuth('login')}
        onLogoutClick={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-14 px-3 sm:px-4 flex items-center justify-between border-b border-gray-200/90 bg-white/95 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm hidden sm:inline tracking-tight">
                DKPP-INFO
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold hidden md:inline">
                Kota Cilegon
              </span>
            </div>
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
          {currentUser.role === 'GUEST' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
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
            <div className="flex items-center gap-2">
              {currentUser.email?.toLowerCase() === 'ridwansugiarto.mail@gmail.com' && (
                <Link
                  href="/admin"
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3 text-amber-600" />
                  <span>Portal Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gray-100 text-xs font-medium border border-gray-200/80 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'DK'}
                </div>
                <span className="max-w-[120px] truncate hidden sm:inline font-semibold">
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
          className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 sm:p-3 gap-3"
        >
          {/* Chat Assistant Pane (Default Fullscreen di Mobile, atau di Kanan saat Desktop SPLIT) */}
          {((isMobile && viewMode === 'CHAT') || (!isMobile && (viewMode === 'SPLIT' || viewMode === 'CHAT'))) && (
            <div
              className={`flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden min-w-0 ${
                viewMode === 'CHAT' || isMobile
                  ? 'w-full h-full'
                  : 'w-full md:w-1/2 h-full shrink-0 order-2'
              }`}
            >
              <ChatContainer
                messages={messages}
                isLoading={isLoading}
                onSuggestionClick={handleSendMessage}
              />

              <div className="p-3 border-t border-gray-100 bg-white/90 backdrop-blur-sm shrink-0">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {/* GIS Map Pane (Fullscreen di Mobile saat mode PETA, atau di Kiri saat Desktop SPLIT) */}
          {((isMobile && viewMode === 'PETA') || (!isMobile && (viewMode === 'SPLIT' || viewMode === 'PETA'))) && (
            <div
              id="gis-map-section"
              className={`transition-all duration-200 ${
                viewMode === 'PETA' || isMobile
                  ? 'w-full h-full min-h-[350px]'
                  : 'w-full md:w-1/2 h-full shrink-0 order-1'
              }`}
            >
              <div className="w-full h-full">
                <SplitMapPane
                  lastAction={lastMapAction}
                  onSelectKelurahan={(kel) =>
                    handleSendMessage(`Tampilkan data dan status ketahanan pangan untuk ${kel}`)
                  }
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Autentikasi (Layer z-[99999] agar tidak pernah tertumpuk oleh Leaflet Map) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onContinueAsGuest={() => {
          handleLogout();
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
};
