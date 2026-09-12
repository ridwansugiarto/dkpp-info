'use client';

import React, { useState, useEffect } from 'react';
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
import { ChatSession, ChatMessage, UserProfile, MapAction } from '@/types/dkpp';
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

  // User state (Default guest or verified user)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'guest',
    email: 'guest@cilegon.go.id',
    full_name: 'Ridwan S.',
    role: 'ADMIN',
    is_verified_employee: true,
    can_access_sensitive: true,
  });

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

        // Dispatch map action if any
        if (data.map_actions && data.map_actions.length > 0) {
          setLastMapAction(data.map_actions[0]);
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
        onLoginClick={() => {}}
        onLogoutClick={() => {}}
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

          {/* Right Header Avatar (Matching Mockup) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center font-bold text-xs">
                RS
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                {currentUser.full_name}
              </span>
            </div>
          </div>
        </header>

        {/* Workspace Layout */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 sm:p-3 gap-3">
          {/* GIS Map Pane */}
          {(viewMode === 'SPLIT' || viewMode === 'PETA') && (
            <div
              className={`h-full transition-all duration-200 ${
                viewMode === 'PETA'
                  ? 'w-full'
                  : 'w-full md:w-1/2 h-[42vh] md:h-full shrink-0'
              }`}
            >
              <SplitMapPane
                lastAction={lastMapAction}
                onSelectKelurahan={(kel) =>
                  handleSendMessage(`Tampilkan data dan status ketahanan pangan untuk ${kel}`)
                }
              />
            </div>
          )}

          {/* Chat Assistant Pane */}
          {(viewMode === 'SPLIT' || viewMode === 'CHAT') && (
            <div
              className={`flex-1 flex flex-col h-full bg-white dark:bg-[#17181c] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-sm overflow-hidden min-w-0 ${
                viewMode === 'CHAT' ? 'w-full' : 'w-full md:w-1/2'
              }`}
            >
              <ChatContainer
                messages={messages}
                isLoading={isLoading}
                onSuggestionClick={handleSendMessage}
              />
              <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 bg-white/60 dark:bg-[#17181c]/60 backdrop-blur-sm">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
