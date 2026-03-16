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
        <div className="p-4 border-b border-chat-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Active Bridges
            </h2>
            <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
              {bridges.length}
            </span>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="w-full btn btn-primary flex justify-center py-2"
          >
            + New Bridge
          </button>
        </div>

        {/* Bridge List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {bridgesLoading ? (
            <LoadingSkeleton count={4} />
          ) : bridges.length === 0 ? (
            <EmptyState
              icon="🌉"
              title="No Bridges"
              description="Create your first bridge to connect two platforms"
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
    active: 'bg-emerald-500',
    paused: 'bg-yellow-500',
    closed: 'bg-red-500',
    archived: 'bg-gray-500',
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-xl transition-all duration-200 animate-fade-in-up
        ${active
          ? 'bg-chat-bg border border-chat-border'
          : 'bg-transparent border border-transparent hover:bg-chat-hover-sidebar'
        }
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono font-bold text-primary">{bridge.bridge_code}</span>
        <div className={`w-2 h-2 rounded-full ${statusColors[bridge.status] || 'bg-gray-500'}`} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] text-text-muted w-6">A →</span>
          <span className="text-xs text-text-primary truncate flex-1">{bridge.source_a_name}</span>
          <PlatformBadge platform={bridge.source_a_platform} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] text-text-muted w-6">B →</span>
          <span className="text-xs text-text-primary truncate flex-1">{bridge.source_b_name}</span>
          <PlatformBadge platform={bridge.source_b_platform} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-chat-border">
        <span className="text-[0.6rem] text-text-muted">
          {bridge.message_count} msgs
        </span>
        <div className="flex gap-1">
          {bridge.auto_translate && <MiniBadge label="T" title="Auto-Translate" />}
          {bridge.auto_ai && <MiniBadge label="AI" title="Auto-AI" />}
          {bridge.oracle_enabled && <MiniBadge label="O" title="Oracle" />}
        </div>
      </div>
    </button>
  );
}

function MiniBadge({ label, title }) {
  return (
    <span
      title={title}
      className="w-5 h-5 rounded text-[0.5rem] font-bold bg-primary/20 text-primary flex items-center justify-center"
    >
      {label}
    </span>
  );
}
