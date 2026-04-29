import React, { useState } from 'react';
import { useChat } from '@livekit/components-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Send, X, MessageSquare } from 'lucide-react';

interface ChatProps {
  onClose: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onClose }) => {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && send) {
      await send(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1c20]/80 backdrop-blur-3xl border border-slate-800 rounded-[32px] overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Secure Chat</h3>
           <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">Encrypted</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-slate-500 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-5">
        <div className="space-y-6">
          {chatMessages.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-tight text-red-500">
                  {msg.from?.identity ?? 'Unknown'}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-xs text-slate-300 bg-slate-800/30 p-3 rounded-2xl border border-white/5 leading-relaxed break-words">
                {msg.message}
              </div>
            </div>
          ))}
          {chatMessages.length === 0 && (
            <div className="text-center py-20 opacity-10 grayscale">
              <MessageSquare className="mx-auto h-16 w-16 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest leading-loose">Secure mesh established.<br/>Waiting for communications...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-5 border-t border-slate-800 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Secure transmission..."
          className="flex-1 bg-black/40 border-slate-800 rounded-xl h-10 text-xs focus-visible:ring-red-600 placeholder:text-slate-600 text-white"
        />
        <Button type="submit" size="icon" className="bg-red-600 hover:bg-red-700 rounded-xl h-10 w-10 shadow-lg shadow-red-500/20 border-none">
          <Send className="h-4 w-4 text-white" />
        </Button>
      </form>
    </div>
  );
};
