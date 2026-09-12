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

export const ChatDKPPApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('SPLIT');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMapAction, setLastMapAction] = useState<MapAction | null>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const GUEST_DEFAULT: UserProfile = {
    id: 'guest',
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

  // Load session from storage and listen to Supabase Auth changes (including Google OAuth)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('dkpp_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || parsed.role)) {
          setCurrentUser(parsed);
        }
      }
    } catch {}

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
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('dkpp_user_session');
    setCurrentUser(GUEST_DEFAULT);
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [currentUser.id]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/sessions?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        if (!activeSessionId) {
          setActiveSessionId(data.sessions[0].id);
          loadMessages(data.sessions[0].id);
        }
      } else {
        // Create initial default session
        handleNewChat();
      }
    } catch {
      // Fallback local session if API unavailable
      const defaultSession: ChatSession = {
        id: 'sess-default-1',
        user_id: currentUser.id,
        title: 'Menampilkan Peta GIS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
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

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId || 'default',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    // Update session title if it's the first message
    if (messages.length === 0 && activeSessionId) {
      const autoTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
      handleRenameSession(activeSessionId, autoTitle);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
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
          session_id: activeSessionId || 'default',
          role: 'assistant',
          content: data.content,
          sources: data.sources || [],
          tool_calls: data.tool_calls || [],
          map_actions: data.map_actions || [],
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Dispatch map action if any (dengan unique _id agar aksi dieksekusi tepat 1x)
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
        session_id: activeSessionId || 'default',
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
    <div className="flex h-screen w-full bg-[#fbfbfb] dark:bg-[#131417] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
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
        <header className="h-14 px-4 flex items-center justify-between border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-[#17181c]/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white text-sm hidden sm:inline">
                DKPP-INFO
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium hidden md:inline">
                Kota Cilegon
              </span>
            </div>
          </div>

          {/* Mode Switcher Buttons [SPLIT] [PETA] [CHAT] (Matching Mockup) */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800/90 p-1 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm text-xs font-semibold">
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'SPLIT'
                  ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>SPLIT</span>
            </button>

            <button
              onClick={() => setViewMode('PETA')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'PETA'
                  ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>PETA</span>
            </button>

            <button
              onClick={() => setViewMode('CHAT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'CHAT'
                  ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>CHAT</span>
            </button>
          </div>

          {/* Right Header: Log in & Sign up for free (Capture 1 for Guests) */}
          {currentUser.role === 'GUEST' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth('signup')}
                className="bg-white hover:bg-neutral-50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-600 shadow-xs transition-all hidden sm:inline-flex cursor-pointer"
              >
                Sign up for free
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {currentUser.email?.toLowerCase() === 'ridwansugiarto.mail@gmail.com' && (
                <Link
                  href="/admin"
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Portal Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800/90 text-xs font-medium border border-gray-200/60 dark:border-gray-700/60 shadow-xs">
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

        {/* Workspace Layout */}
        <main
          ref={mainScrollRef}
          className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-2 sm:p-3 gap-3"
        >
          {/* Chat Assistant Pane (Default Fullscreen di atas untuk Mobile, di Kanan untuk Desktop) */}
          {(viewMode === 'SPLIT' || viewMode === 'CHAT') && (
            <div
              className={`flex flex-col bg-white dark:bg-[#17181c] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-sm overflow-hidden min-w-0 order-1 md:order-2 ${
                viewMode === 'CHAT'
                  ? 'w-full h-full'
                  : 'w-full md:w-1/2 h-[calc(100dvh-4.75rem)] md:h-full shrink-0'
              }`}
            >
              <ChatContainer
                messages={messages}
                isLoading={isLoading}
                onSuggestionClick={handleSendMessage}
              />

              {/* Petunjuk Mobile: Peta Spasial GIS berada di bawah (scroll down) */}
              {viewMode === 'SPLIT' && (
                <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-emerald-50/90 dark:bg-emerald-950/40 border-t border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium shrink-0">
                  <span className="flex items-center gap-1">
                    <MapIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Peta GIS Cilegon (407 Poligon Sawah & Lengas) di bawah
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const mapEl = document.getElementById('gis-map-section');
                      if (mapEl) {
                        mapEl.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    Lihat Peta ↓
                  </button>
                </div>
              )}

              <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 bg-white/60 dark:bg-[#17181c]/60 backdrop-blur-sm shrink-0">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {/* GIS Map Pane (Di bawah Chatbot pada Mobile saat SPLIT, di Kiri pada Desktop) */}
          {(viewMode === 'SPLIT' || viewMode === 'PETA') && (
            <div
              id="gis-map-section"
              className={`transition-all duration-200 order-2 md:order-1 ${
                viewMode === 'PETA'
                  ? 'w-full h-full min-h-[500px]'
                  : 'w-full md:w-1/2 h-[75vh] md:h-full shrink-0'
              }`}
            >
              {/* Mobile Quick Navigation Bar */}
              {viewMode === 'SPLIT' && (
                <div className="md:hidden flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-t-2xl border-t border-x border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Peta Spasial GIS Kota Cilegon</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg transition-colors shadow-xs"
                  >
                    <span>↑ Kembali ke Chat</span>
                  </button>
                </div>
              )}
              <div className={`w-full ${viewMode === 'SPLIT' ? 'h-[calc(100%-37px)] md:h-full' : 'h-full'}`}>
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

      {/* Modal Autentikasi (Capture 3 UI/UX Style) */}
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
