import React from 'react';
import { useBriboxStore } from '../../store/useBriboxStore';
import { ConnectionIndicator } from '../ui';

export default function Header() {
  const { wsConnected, stats, sidebarOpen, setSidebarOpen } = useBriboxStore();

  return (
    <header className="h-14 border-b border-chat-border bg-chat-bg flex items-center justify-between px-4 z-50 relative">
      {/* Left — Logo & Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-chat-hover transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-black text-sm">B</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              Bribox<span className="text-primary">.io</span>
            </h1>
            <p className="text-[0.6rem] text-text-muted -mt-0.5 hidden sm:block">Universal Master Controller</p>
          </div>
        </div>
      </div>

      {/* Center — Quick Stats */}
      <div className="hidden md:flex items-center gap-6">
        <QuickStat label="Bridges" value={stats?.stats?.total_bridges ?? 0} />
        <QuickStat label="Messages" value={stats?.stats?.total_messages ?? 0} />
        <QuickStat label="Pending" value={stats?.stats?.pending_oracle ?? 0} accent />
      </div>

      {/* Right — Status */}
      <div className="flex items-center gap-4">
        <ConnectionIndicator connected={wsConnected} />
        <div className="w-8 h-8 rounded-full bg-chat-sidebar border border-chat-border flex items-center justify-center">
          <span className="text-xs">⚡</span>
        </div>
      </div>
    </header>
  );
}

function QuickStat({ label, value, accent = false }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-bold ${accent ? 'text-primary' : 'text-text-primary'}`}>
        {value}
      </p>
      <p className="text-[0.6rem] text-text-muted uppercase tracking-wider">{label}</p>
    </div>
  );
}
