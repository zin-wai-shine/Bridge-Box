import React from 'react';

const PLATFORM_ICONS = {
  line: '💚',
  telegram: '✈️',
  whatsapp: '📱',
  messenger: '💬',
  magic_link: '🔗',
};

const PLATFORM_LABELS = {
  line: 'LINE',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
  magic_link: 'Magic Link',
};

export function PlatformBadge({ platform, size = 'sm' }) {
  const cls = size === 'lg' ? 'px-3 py-1.5 text-[0.6rem]' : 'px-2 py-0.5 text-[0.55rem]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded bg-white/5 border border-white/10 text-text-muted font-bold uppercase tracking-wider ${cls}`}>
      <span className="opacity-80">{PLATFORM_ICONS[platform] || '🔌'}</span>
      <span className="leading-none">{PLATFORM_LABELS[platform] || platform}</span>
    </span>
  );
}

export function SmartToggle({ label, active, onChange, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <button
        onClick={() => !disabled && onChange(!active)}
        className={`toggle-track ${active ? 'active' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        disabled={disabled}
        aria-label={`Toggle ${label}`}
      >
        <div className="toggle-thumb" />
      </button>
    </div>
  );
}

export function SniperButton({ children, onClick, icon, variant = 'primary', loading = false, disabled = false, className = '' }) {
  const variants = {
    primary: 'btn btn-primary',
    danger: 'btn bg-chat-sidebar text-text-primary border border-chat-border',
    ghost: 'btn btn-ghost',
    info: 'btn btn-secondary',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span className="flex items-center justify-center gap-2">
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : icon ? (
          <span className="text-sm">{icon}</span>
        ) : null}
        <span>{children}</span>
      </span>
    </button>
  );
}

export function GlassCard({ children, className = '', glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card p-4 ${onClick ? 'cursor-pointer hover:bg-chat-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon, trend }) {
  return (
    <div className="card p-6 animate-fade-in-up bg-[#181818] border-chat-border shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-[0.55rem] font-black uppercase tracking-[0.2em]">{label}</p>
          <p className="text-3xl font-black mt-2 text-white tracking-tighter">{value ?? '—'}</p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-white text-[#181818]' : 'bg-chat-border text-white'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-[0.55rem] text-text-muted font-bold uppercase tracking-widest">Growth</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-chat-bg border border-chat-border flex items-center justify-center text-xl opacity-80 shadow-inner">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function ConnectionIndicator({ connected }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-primary' : 'bg-chat-border'}`} />
      <span className="text-xs text-text-muted">
        {connected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in-up">
      <div className="w-20 h-20 rounded-[2rem] bg-chat-sidebar border border-chat-border flex items-center justify-center text-4xl mb-6 shadow-2xl">
        {icon}
      </div>
      <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">{title}</h3>
      <p className="text-xs text-text-muted font-medium max-w-[240px] leading-relaxed mb-8 opacity-60 uppercase tracking-wide">{description}</p>
      {action}
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chat-border/50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-chat-border/50 rounded w-3/4" />
              <div className="h-2 bg-chat-border/30 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
