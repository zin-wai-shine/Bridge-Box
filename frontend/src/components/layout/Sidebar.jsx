import React from 'react';
import { useBriboxStore } from '../../store/useBriboxStore';
import { PlatformBadge, SniperButton, LoadingSkeleton, EmptyState } from '../ui';

export default function Sidebar() {
  const {
    bridges,
    activeBridge,
    bridgesLoading,
    sidebarOpen,
    setSidebarOpen,
    setActiveBridge,
    setCreateModalOpen,
  } = useBriboxStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative z-40 top-14 lg:top-0 bottom-0 left-0
          w-[260px] border-r border-chat-border bg-chat-sidebar
          flex flex-col transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-chat-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-text-muted">
              Network Bridges
            </h2>
            <span className="text-[0.6rem] px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold">
              {bridges.length}
            </span>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="w-full btn btn-primary flex justify-center py-3 text-xs uppercase tracking-widest"
          >
            Create New Bridge
          </button>
        </div>

        {/* Bridge List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bridgesLoading ? (
            <LoadingSkeleton count={4} />
          ) : bridges.length === 0 ? (
            <EmptyState
              icon="🌑"
              title="No Active Bridges"
              description="Deploy a bridge to start bridging platforms."
            />
          ) : (
            bridges.map((bridge, i) => (
              <BridgeItem
                key={bridge.id}
                bridge={bridge}
                active={activeBridge?.id === bridge.id}
                index={i}
                onClick={() => {
                  setActiveBridge(bridge);
                  setSidebarOpen(false);
                }}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-chat-border">
          <div className="card p-3">
            <p className="text-[0.6rem] text-text-muted uppercase tracking-wider mb-1">DARP Status</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-primary font-medium">All Adapters Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function BridgeItem({ bridge, active, index, onClick }) {
  const statusColors = {
    active: 'bg-primary',
    paused: 'bg-chat-border',
    closed: 'bg-chat-border',
    archived: 'bg-chat-border',
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl transition-all duration-300 animate-fade-in-up border
        ${active
          ? 'bg-[#212121] border-chat-border shadow-2xl'
          : 'bg-transparent border-transparent hover:bg-[#212121] hover:border-chat-border group'
        }
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[0.65rem] font-mono font-bold tracking-tight ${active ? 'text-white' : 'text-text-muted group-hover:text-text-primary'}`}>
          {bridge.bridge_code}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[bridge.status] || 'bg-chat-border'}`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-chat-border" />
          <span className="text-[0.7rem] text-text-primary font-bold truncate flex-1">{bridge.source_a_name}</span>
          <PlatformBadge platform={bridge.source_a_platform} />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-[0.7rem] text-text-primary font-bold truncate flex-1">{bridge.source_b_name}</span>
          <PlatformBadge platform={bridge.source_b_platform} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-chat-border/50">
        <span className="text-[0.55rem] text-text-muted font-bold uppercase tracking-wider">
          {bridge.message_count} SYNCED
        </span>
        <div className="flex gap-1.5">
          {bridge.auto_translate && <MiniBadge label="T" title="Auto-Translate" />}
          {bridge.auto_ai && <MiniBadge label="AI" title="AI AUTO" />}
          {bridge.oracle_enabled && <MiniBadge label="O" title="ORACLE" />}
        </div>
      </div>
    </button>
  );
}

function MiniBadge({ label, title }) {
  return (
    <span
      title={title}
      className="w-4 h-4 rounded-sm text-[0.45rem] font-black bg-white text-[#181818] flex items-center justify-center tracking-tighter"
    >
      {label}
    </span>
  );
}
