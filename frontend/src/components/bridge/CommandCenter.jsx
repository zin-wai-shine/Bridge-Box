import React from 'react';
import { useBriboxStore } from '../../store/useBriboxStore';
import MessagePane from './MessagePane';
import ActionSniperBar from './ActionSniperBar';
import { EmptyState, SniperButton } from '../ui';

export default function CommandCenter() {
  const { activeBridge, mobilePane, setMobilePane, setCreateModalOpen } = useBriboxStore();

  if (!activeBridge) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon="🌑"
          title="Command Uplink Required"
          description="Select a bridge from the tactical sidebar or initialize a new link to begin operation."
          action={
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary mt-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">
              Initialize New Bridge
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Mobile Pane Toggle */}
      <div className="lg:hidden border-b border-chat-border">
        <div className="flex">
          <button
            onClick={() => setMobilePane('client')}
            className={`flex-1 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all
              ${mobilePane === 'client'
                ? 'text-white border-b-2 border-white bg-white/5'
                : 'text-text-muted hover:text-text-secondary'
              }`}
          >
            Client {activeBridge.source_a_name}
          </button>
          <button
            onClick={() => setMobilePane('provider')}
            className={`flex-1 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all
              ${mobilePane === 'provider'
                ? 'text-white border-b-2 border-white bg-white/5'
                : 'text-text-muted hover:text-text-secondary'
              }`}
          >
            Provider {activeBridge.source_b_name}
          </button>
        </div>
      </div>

      {/* Desktop: Dual Pane Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Pane — Client */}
        <div className="flex-1 flex flex-col border-r border-chat-border">
          <MessagePane
            side="client"
            title={activeBridge.source_a_name}
            platformLabel={activeBridge.source_a_platform}
          />
        </div>

        {/* Center — Action Sniper Bar */}
        <ActionSniperBar />

        {/* Right Pane — Provider */}
        <div className="flex-1 flex flex-col">
          <MessagePane
            side="provider"
            title={activeBridge.source_b_name}
            platformLabel={activeBridge.source_b_platform}
          />
        </div>
      </div>

      {/* Mobile: Single Pane */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        {mobilePane === 'client' ? (
          <MessagePane
            side="client"
            title={activeBridge.source_a_name}
            platformLabel={activeBridge.source_a_platform}
          />
        ) : (
          <MessagePane
            side="provider"
            title={activeBridge.source_b_name}
            platformLabel={activeBridge.source_b_platform}
          />
        )}
      </div>

      {/* Mobile Bottom Sheet Action Menu */}
      <div className="lg:hidden border-t border-chat-border bg-chat-sidebar p-2">
        <div className="flex items-center justify-around">
          <MobileAction icon="🔔" label="Oracle" />
          <MobileAction icon="📸" label="Media" />
          <MobileAction icon="🔗" label="Link" />
          <MobileAction icon="⚙️" label="Toggles" />
        </div>
      </div>
    </div>
  );
}

function MobileAction({ icon, label }) {
  return (
    <button className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl
                       hover:bg-chat-hover transition-all border border-transparent hover:border-chat-border">
      <span className="text-xl">{icon}</span>
      <span className="text-[0.45rem] text-text-muted font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
