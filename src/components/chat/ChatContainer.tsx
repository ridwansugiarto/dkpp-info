'use client';

import React, { useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Layers, 
  BookOpen, 
  Globe, 
  ExternalLink, 
  Database,
  Calendar,
  Compass,
  TrendingUp,
  FileText,
  Activity
} from 'lucide-react';
import { ChatMessage, SourceCitation } from '@/types/dkpp';

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    title: 'FSVA & Kerawanan Pangan',
    prompt: 'Tampilkan analisis FSVA Kota Cilegon dan daftar kelurahan yang masuk prioritas waspada pangan.',
    icon: Compass,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
  },
  {
    title: 'SKPG & Neraca Pangan',
    prompt: 'Bagaimana ringkasan laporan bulanan SKPG Cilegon dan stabilitas pasokan beras serta komoditas strategis?',
    icon: Activity,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
  },
  {
    title: 'Harga Pasar Kranggot & Blok F',
    prompt: 'Berapa harga komoditas pangan pokok terkini di Pasar Kranggot dan Pasar Blok F Cilegon?',
    icon: TrendingUp,
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
  },
  {
    title: 'Agroklimat & Lengas Tanah',
    prompt: 'Tampilkan kondisi telemetri agroklimat dan lengas tanah untuk wilayah pertanian di Cilegon.',
    icon: Layers,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
  },
];

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  onSuggestionClick,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Format simple markdown into clean HTML/React nodes
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-bold text-base text-gray-900 dark:text-white pt-2 pb-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="font-bold text-lg text-gray-900 dark:text-white pt-3 pb-1 border-b border-gray-200 dark:border-gray-700">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="font-extrabold text-xl text-emerald-700 dark:text-emerald-400 pt-3 pb-1">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-500 text-base leading-none">•</span>
                <span>{line.substring(2)}</span>
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.length === 0 ? (
        /* Empty State */
        <div className="max-w-2xl mx-auto py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md mb-4">
            <Sparkles className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Bagaimana saya dapat membantu?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8">
            Asisten cerdas DKPP Kota Cilegon untuk analisis ketahanan pangan, pertanian, agroklimat, dan data spasial GIS.
          </p>

          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
            {SUGGESTIONS.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(item.prompt)}
                  className={`p-3.5 rounded-xl border text-xs transition-all hover:scale-[1.01] flex flex-col justify-between gap-2.5 ${item.color}`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[11px] opacity-80 line-clamp-2">
                    {item.prompt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Messages Thread */
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-xs shrink-0 mt-0.5">
                    DK
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    isUser
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-br-none'
                      : 'bg-white dark:bg-[#1e2025] border border-gray-200/80 dark:border-gray-800 rounded-bl-none'
                  }`}
                >
                  {/* Tool Calls Status Chips */}
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
                      {msg.tool_calls.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800/60"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                          <span>Tool: {tool.name.replace(/_/g, ' ')} ({tool.status})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Body */}
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}

                  {/* Source Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1.5">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>Sumber Rujukan ({msg.sources.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => {
                          const badgeColor =
                            src.type === 'LOCAL DATA'
                              ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : src.type === 'KNOWLEDGE BASE'
                              ? 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'bg-amber-100/70 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';

                          return (
                            <div
                              key={sIdx}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${badgeColor}`}
                            >
                              <Database className="w-2.5 h-2.5" />
                              <span className="font-semibold">[{src.type}]</span>
                              <span className="truncate max-w-[200px]">{src.title}</span>
                              {src.url && (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline ml-0.5"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 inline" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-xs shrink-0">
                DK
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#1e2025] border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>DKPP-INFO sedang menganalisis data spasial & ketahanan pangan...</span>
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>
      )}
    </div>
  );
};
