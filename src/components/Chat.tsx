import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@livekit/components-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, X, MessageSquare } from 'lucide-react';

interface ChatProps {
  onClose: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onClose }) => {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && send) {
      await send(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111316] border border-slate-800 rounded-[24px] md:rounded-[32px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Secure Chat</span>
          <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">E2E</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full text-slate-500 hover:text-white hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages — flex-1 min-h-0 is critical for overflow-y-auto in a flex column */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 py-12">
            <MessageSquare className="h-10 w-10 mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-center leading-loose">
              Secure mesh active.<br />No messages yet.
            </p>
          </div>
        ) : (
          chatMessages.map((msg, i) => (
            <div
              key={i}
              className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-tight text-red-500">
                  {msg.from?.identity ?? 'Unknown'}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="text-xs text-slate-300 bg-slate-800/60 px-3 py-2.5 rounded-2xl border border-white/5 leading-relaxed break-words">
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 px-4 py-3 border-t border-slate-800 flex-shrink-0"
      >
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Secure transmission..."
          className="flex-1 bg-black/40 border-slate-700 rounded-xl h-10 text-xs focus-visible:ring-red-600 placeholder:text-slate-600 text-white"
        />
        <Button
          type="submit"
          size="icon"
          className="flex-shrink-0 h-10 w-10 bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20 border-none"
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      </form>
    </div>
  );
};
