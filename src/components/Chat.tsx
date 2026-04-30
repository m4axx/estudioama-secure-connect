import React, { useState, useRef, useEffect } from 'react';
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
    <div className="flex flex-col h-full bg-[#fffefe] border border-[#1c1c1c]/10 rounded-[28px] overflow-hidden shadow-sm">
      {/* Cabecera */}
      <div className="px-5 py-4 border-b border-[#1c1c1c]/8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase text-[#1c1c1c]/50 tracking-wider">Chat seguro</h3>
          <span className="text-[9px] bg-[#8d3030] text-white px-2 py-0.5 rounded-full font-bold">Cifrado</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 rounded-full text-[#1c1c1c]/35 hover:text-[#1c1c1c] hover:bg-[#1c1c1c]/6"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        {chatMessages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-tight text-[#8d3030]">
                {msg.from?.identity ?? 'Desconocido'}
              </span>
              <span className="text-[9px] text-[#1c1c1c]/30 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-xs text-[#1c1c1c]/75 bg-[#f8f5f0] px-3.5 py-2.5 rounded-2xl border border-[#1c1c1c]/6 leading-relaxed break-words">
              {msg.message}
            </div>
          </div>
        ))}

        {chatMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 opacity-30">
            <MessageSquare className="mx-auto h-10 w-10 mb-3 text-[#1c1c1c]/40" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#1c1c1c]/40 leading-loose">
              Canal seguro establecido.<br />Esperando mensajes...
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-4 border-t border-[#1c1c1c]/8 flex gap-2 flex-shrink-0">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enviar mensaje..."
          className="flex-1 bg-[#f8f5f0] border-[#1c1c1c]/10 rounded-xl h-10 text-xs focus-visible:ring-[#8d3030]/30 focus-visible:border-[#8d3030]/40 placeholder:text-[#1c1c1c]/30 text-[#1c1c1c]"
        />
        <Button
          type="submit"
          size="icon"
          className="bg-[#8d3030] hover:bg-[#7a2828] rounded-xl h-10 w-10 shadow-sm shadow-[#8d3030]/15 border-none flex-shrink-0"
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      </form>
    </div>
  );
};
