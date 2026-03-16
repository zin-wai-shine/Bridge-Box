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
      <div className="px-4 py-3 border-b border-chat-border bg-chat-bg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            <p className="text-[0.6rem] text-text-muted uppercase tracking-wider">{platformLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${side === 'client' ? 'bg-blue-400' : 'bg-primary'} animate-pulse`} />
            <span className="text-[0.6rem] text-text-muted">{filteredMessages.length} msgs</span>
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
      <form onSubmit={handleSend} className="p-3 border-t border-chat-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Send as ${side === 'client' ? 'Client' : 'Provider'}...`}
            className="flex-1 bg-chat-bg border border-chat-border rounded-xl px-4 py-2.5 text-sm
                       text-text-primary outline-none
                       focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center
                       hover:bg-primary-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
      <div className={`msg-bubble ${bubbleClass}`}>
        {message.msg_type === 'image' && message.media_url && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <div className="w-full h-32 bg-chat-bg border border-chat-border flex items-center justify-center text-2xl">🖼️</div>
          </div>
        )}
        <p className="text-sm">{message.content || `[${message.msg_type} message]`}</p>
        {message.translated && (
          <p className="text-xs text-primary mt-1 italic border-t border-chat-border pt-1">
            🌐 {message.translated}
          </p>
        )}
        <p className="text-[0.55rem] text-text-muted/60 mt-1 text-right">{time}</p>
      </div>
    </div>
  );
}
