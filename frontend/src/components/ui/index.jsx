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
  const cls = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[0.65rem]';
  return (
    <span className={`platform-badge platform-${platform} ${cls}`}>
      <span>{PLATFORM_ICONS[platform] || '🔌'}</span>
      <span>{PLATFORM_LABELS[platform] || platform}</span>
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
    primary: 'sniper-btn',
    danger: 'sniper-btn !bg-gradient-to-br !from-red-700 !to-red-600 !border-red-500/30',
    ghost: 'sniper-btn !bg-transparent !border-glass-border hover:!bg-glass-hover',
    info: 'sniper-btn !bg-gradient-to-br !from-blue-700 !to-blue-600 !border-blue-500/30',
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
      className={`glass-card p-4 ${glow ? 'emerald-glow' : ''} ${onClick ? 'cursor-pointer glass-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon, trend }) {
  return (
    <GlassCard className="animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 emerald-text-glow">{value ?? '—'}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </GlassCard>
  );
}

export function ConnectionIndicator({ connected }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse-glow' : 'bg-red-500'}`} />
      <span className="text-xs text-text-muted">
        {connected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in-up">
      <span className="text-5xl mb-4 opacity-40">{icon}</span>
      <h3 className="text-lg font-semibold text-text-secondary mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-4 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-obsidian-400/50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-obsidian-400/50 rounded w-3/4" />
              <div className="h-2 bg-obsidian-400/30 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
