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
    <div className="w-full px-0">
      <div className="relative flex items-start bg-white rounded-2xl border border-gray-300/90 shadow-sm focus-within:border-gray-400 focus-within:shadow-md focus-within:ring-0 transition-all p-2 sm:p-2.5 gap-1">
        {/* Plus / Add Action Button */}
        <button
          type="button"
          onClick={() => {}}
          title="Tindakan Tambahan"
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer mt-0.5"
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
          className="flex-1 bg-transparent px-2 py-1.5 text-[13px] sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none min-h-[28px] max-h-36 leading-relaxed"
        />

        {/* Action Buttons Right — aligned to bottom */}
        <div className="flex items-center gap-1 shrink-0 self-end pb-0.5">
          {/* Voice Input */}
          <button
            type="button"
            onClick={toggleVoice}
            title={isListening ? 'Mendengarkan...' : 'Gunakan Suara'}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'text-red-500 bg-red-50 animate-pulse'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button — ChatGPT style dark rounded square */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || disabled}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              input.trim() && !isLoading
                ? 'bg-neutral-900 hover:bg-black text-white shadow-sm cursor-pointer'
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

      <div className="text-[10px] text-center text-gray-400 mt-2 px-2">
        Chat DKPP didukung AI &amp; sistem intelijen ketahanan pangan Kota Cilegon. Mohon verifikasi kembali data penting kedinasan.
      </div>
    </div>
  );
};
