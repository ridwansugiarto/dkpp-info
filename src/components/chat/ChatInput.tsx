'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  ArrowUp, 
  Mic, 
  MicOff, 
  Brain,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  isCentered?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  isCentered = false,
  placeholder = 'Ask anything'
}) => {
  const [input, setInput] = useState('');
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea seamlessly (Capture 2)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser Anda tidak mendukung Web Speech API.');
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;

      if (!isListening) {
        setIsListening(true);
        recognition.start();
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
      } else {
        setIsListening(false);
      }
    } catch {
      setIsListening(false);
    }
  };

  const isMultiline = input.includes('\n') || input.length > 60;

  return (
    <div className={`w-full ${isCentered ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}`}>
      <div
        className={`relative flex items-end bg-white border border-gray-200/90 shadow-sm focus-within:border-gray-300 focus-within:shadow-md transition-all duration-200 ${
          isMultiline
            ? 'rounded-2xl p-2.5 sm:p-3'
            : 'rounded-full px-3 py-1.5 sm:px-4 sm:py-2'
        }`}
      >
        {/* Plus / Add Action Button */}
        <button
          type="button"
          onClick={() => {}}
          title="Tindakan Tambahan"
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors shrink-0 cursor-pointer mb-0.5"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled || isLoading}
          className="flex-1 bg-transparent px-2.5 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none min-h-[24px] max-h-48 leading-relaxed self-center"
        />

        {/* Action Buttons Right */}
        <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
          {/* Think Mode Pill Button (Capture 1 & 2) */}
          <button
            type="button"
            onClick={() => setIsThinkingMode((prev) => !prev)}
            title="Mode Berpikir Mendalam"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              isThinkingMode
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-gray-500" />
            <span>Think</span>
          </button>

          {/* Voice Input */}
          <button
            type="button"
            onClick={toggleVoice}
            title={isListening ? 'Mendengarkan...' : 'Gunakan Suara'}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              isListening
                ? 'text-red-500 bg-red-50 animate-pulse'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button — Blue Rounded Circle (Capture 1, 2, 3) */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-[#1A73E8] hover:bg-blue-600 text-white shadow-xs cursor-pointer active:scale-95'
                : 'bg-[#1A73E8]/85 text-white opacity-80 cursor-default'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Centered Disclaimer below input (Capture 3) */}
      {!isCentered && (
        <div className="text-[11px] text-center text-gray-400 mt-2 px-2 select-none">
          Chat DKPP can make mistakes. Check important info.
        </div>
      )}
    </div>
  );
};

