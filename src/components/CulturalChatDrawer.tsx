import React, { useEffect, useRef, useState } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import type { ChatMessage, Motif } from '../types';

interface CulturalChatDrawerProps {
  open: boolean;
  onClose: () => void;
  activeMotif: Motif | null;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Nomoshkar. I am your Bengali Folk Art Cultural Guide. Ask me about Patachitra scroll traditions, Alpona rice-paste motifs, Nakshi Kantha stitching, or how to credit artisans respectfully.',
};

export const CulturalChatDrawer: React.FC<CulturalChatDrawerProps> = ({
  open,
  onClose,
  activeMotif,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (!open) return null;

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const historyPayload = nextMessages
        .filter((m) => m.id !== 'welcome')
        .slice(0, -1)
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyPayload,
          message: trimmed,
          activeMotifContext: activeMotif
            ? {
                title: activeMotif.title,
                artStyle: activeMotif.artStyle,
                region: activeMotif.region,
                artistName: activeMotif.artistName,
                license: activeMotif.license,
                story: activeMotif.story,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not reach the Cultural Guide.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.reply || 'I could not generate a response right now.',
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Cultural Guide Chatbot"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md bg-[#FBF9F5] border-l border-[#D6CEBE] h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#E5DEC9] flex items-center justify-between gap-4 bg-white">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#1C1917]">
              Cultural Heritage Guide
            </h2>
            <p className="text-xs text-[#78716C]">
              {activeMotif
                ? `Context: ${activeMotif.title} (${activeMotif.artStyle})`
                : 'Ask about Bengali craft traditions & ethical credit'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cultural Guide"
            className="p-1.5 text-[#57534E] hover:text-[#1C1917] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#9A3412] text-[#FBF9F5]'
                    : 'bg-white border border-[#E5DEC9] text-[#1C1917]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-lg bg-white border border-[#E5DEC9] text-xs text-[#57534E] inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A3412]" aria-hidden="true" />
                Consulting archive notes...
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="p-4 border-t border-[#E5DEC9] bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Patachitra pigments, Alpona rules..."
            className="flex-1 px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className="p-2.5 bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 text-[#FBF9F5] rounded-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
};
