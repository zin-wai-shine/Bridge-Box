import React, { useRef, useEffect, useState } from 'react';
import { useBriboxStore } from '../../store/useBriboxStore';

export default function MessagePane({ side, title, platformLabel }) {
  const { messages, activeBridge } = useBriboxStore();
  const scrollRef = useRef(null);
  const [input, setInput] = useState('');

  const direction = side === 'client' ? 'inbound' : 'outbound';
  const filteredMessages = messages.filter((m) => m.direction === direction);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeBridge) return;
    
    const { sendMessage } = useBriboxStore.getState();
    const connectionId = side === 'client' ? activeBridge.source_a_id : activeBridge.source_b_id;
    sendMessage(activeBridge.id, connectionId, direction, input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Pane Header */}
      <div className="px-6 py-4 border-b border-chat-border bg-chat-sidebar">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">{title}</h3>
            <p className="text-[0.5rem] text-text-muted font-bold uppercase tracking-[0.2em] mt-1">{platformLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${side === 'client' ? 'bg-primary' : 'bg-white'} animate-pulse`} />
            <span className="text-[0.55rem] text-text-muted font-bold uppercase tracking-wider">{filteredMessages.length} Messages</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <span className="text-4xl mb-2">{side === 'client' ? '👤' : '🏢'}</span>
            <p className="text-xs text-text-muted">No messages yet</p>
          </div>
        ) : (
          filteredMessages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} side={side} index={i} />
          ))
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-chat-border bg-chat-sidebar">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type a command...`}
            className="flex-1 bg-chat-bg border border-chat-border rounded-xl px-5 py-3 text-sm
                       text-text-primary outline-none font-medium
                       focus:border-primary transition-all placeholder:text-text-muted/40"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center
                       hover:bg-primary-hover transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed shadow-lg"
          >
            <svg className="w-5 h-5 text-[#181818]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message, side, index }) {
  const bubbleClass = side === 'client' ? 'inbound' : 'outbound';
  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`flex ${side === 'client' ? 'justify-start' : 'justify-end'}`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm font-medium border animate-fade-in-up shadow-sm
        ${side === 'client' 
          ? 'bg-chat-sidebar border-chat-border text-white rounded-bl-none' 
          : 'bg-white border-white text-[#181818] rounded-br-none'
        }`}>
        {message.msg_type === 'image' && message.media_url && (
          <div className="mb-2 rounded-lg overflow-hidden border border-chat-border/20">
            <div className="w-full h-40 bg-chat-bg flex items-center justify-center text-3xl">🖼️</div>
          </div>
        )}
        <p className="leading-relaxed">{message.content || `[${message.msg_type} command]`}</p>
        
        {message.translated && (
          <div className={`mt-2 pt-2 border-t text-[0.7rem] italic opacity-80 flex items-start gap-2
            ${side === 'client' ? 'border-chat-border text-white' : 'border-[#181818]/10 text-[#181818]'}`}>
            <span>🌐</span> <span>{message.translated}</span>
          </div>
        )}
        
        <p className={`text-[0.5rem] font-black uppercase tracking-tighter mt-1.5 flex items-center justify-end gap-1 opacity-40`}>
          {time}
        </p>
      </div>
    </div>
  );
}
