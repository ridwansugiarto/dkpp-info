'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  ArrowUp, 
  Mic, 
  MicOff, 
  Sparkles, 
  BrainCircuit,
  Paperclip
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [isThinkingMode, setIsThinkingMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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

    // Toggle speech recognition
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

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-4">
      <div className="relative flex items-center bg-white rounded-full border border-gray-300/80 shadow-xs focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-200 transition-all p-1 sm:p-1.5">
        {/* Plus / Add Action Button (Capture 5 style) */}
        <button
          type="button"
          onClick={() => {}}
          title="Tindakan Tambahan"
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors shrink-0 cursor-pointer ml-0.5"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya Chat DKPP apa saja..."
          rows={1}
          disabled={disabled || isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none max-h-32 leading-relaxed"
        />

        {/* Action Buttons Right */}
        <div className="flex items-center gap-1 shrink-0 pr-1">
          {/* Voice Input */}
          <button
            type="button"
            onClick={toggleVoice}
            title={isListening ? 'Mendengarkan...' : 'Gunakan Suara'}
            className={`p-2 rounded-full transition-colors ${
              isListening
                ? 'text-red-500 bg-red-50 animate-pulse'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button (Capture 5 Circular Arrow Button) */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || disabled}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all ${
              input.trim() && !isLoading
                ? 'bg-neutral-900 hover:bg-black text-white shadow-xs cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>
        </div>
      </div>

      <div className="text-[10.5px] text-center text-gray-400 mt-2 px-4">
        Chat DKPP didukung AI & sistem intelijen ketahanan pangan Kota Cilegon. Mohon verifikasi kembali data penting kedinasan.
      </div>
    </div>
  );
};
