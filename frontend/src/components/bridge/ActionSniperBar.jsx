import React, { useState } from 'react';
import { useBriboxStore } from '../../store/useBriboxStore';
import { SmartToggle, SniperButton } from '../ui';

export default function ActionSniperBar() {
  const {
    activeBridge,
    toggleBridgeSetting,
    oracleLoading,
    pingOracle,
    mediaProcessing,
    processMedia,
    setMediaModalOpen,
    setMagicLinkModalOpen,
  } = useBriboxStore();

  const [oracleQuery, setOracleQuery] = useState('');
  const [showOracleInput, setShowOracleInput] = useState(false);

  if (!activeBridge) return null;

  const handleOraclePing = async () => {
    if (!oracleQuery.trim()) return;
    await pingOracle(activeBridge.id, oracleQuery);
    setOracleQuery('');
    setShowOracleInput(false);
  };

  return (
    <div className="w-16 lg:w-[240px] border-x border-chat-border bg-chat-sidebar flex flex-col">
      {/* Title */}
      <div className="p-6 border-b border-chat-border">
        <div className="hidden lg:block">
          <h3 className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white">
            Cockpit
          </h3>
          <p className="text-[0.5rem] font-bold text-text-muted mt-1 uppercase tracking-widest leading-none">Command Center</p>
        </div>
        <div className="lg:hidden flex justify-center">
          <span className="text-xl">⚡</span>
        </div>
      </div>

      {/* Smart Toggles */}
      <div className="p-3 space-y-3 border-b border-chat-border">
        <p className="text-[0.55rem] font-semibold uppercase tracking-widest text-text-muted hidden lg:block">
          Smart Toggles
        </p>

        <div className="hidden lg:block space-y-3">
          <SmartToggle
            label="Auto-Translate"
            active={activeBridge.auto_translate}
            onChange={(val) => toggleBridgeSetting(activeBridge.id, 'auto_translate', val)}
          />
          <SmartToggle
            label="Auto-AI"
            active={activeBridge.auto_ai}
            onChange={(val) => toggleBridgeSetting(activeBridge.id, 'auto_ai', val)}
          />
          <SmartToggle
            label="Oracle"
            active={activeBridge.oracle_enabled}
            onChange={(val) => toggleBridgeSetting(activeBridge.id, 'oracle_enabled', val)}
          />
        </div>

        {/* Mobile mini toggles */}
        <div className="lg:hidden space-y-2">
          <MiniToggle label="T" active={activeBridge.auto_translate}
            onClick={() => toggleBridgeSetting(activeBridge.id, 'auto_translate', !activeBridge.auto_translate)} />
          <MiniToggle label="AI" active={activeBridge.auto_ai}
            onClick={() => toggleBridgeSetting(activeBridge.id, 'auto_ai', !activeBridge.auto_ai)} />
          <MiniToggle label="O" active={activeBridge.oracle_enabled}
            onClick={() => toggleBridgeSetting(activeBridge.id, 'oracle_enabled', !activeBridge.oracle_enabled)} />
        </div>
      </div>

      {/* Action Sniper Buttons */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-text-muted hidden lg:block mb-1">
          Tactical Actions
        </p>

        {/* Oracle Ping */}
        <div className="hidden lg:block">
          {showOracleInput ? (
            <div className="space-y-3 animate-fade-in-up">
              <textarea
                value={oracleQuery}
                onChange={(e) => setOracleQuery(e.target.value)}
                placeholder="Availability query..."
                className="w-full bg-chat-bg border border-chat-border rounded-lg px-3 py-3 text-xs
                           text-text-primary outline-none resize-none h-20
                           focus:border-primary transition-all font-medium"
              />
              <div className="flex gap-2">
                <button onClick={handleOraclePing} disabled={oracleLoading} className="flex-[3] btn btn-primary text-xs py-3">
                  PING ORACLE
                </button>
                <button onClick={() => setShowOracleInput(false)} className="flex-1 btn btn-secondary text-xs py-3">
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowOracleInput(true)}
              className="w-full btn btn-primary py-3.5 text-xs tracking-widest uppercase font-bold"
              disabled={!activeBridge.oracle_enabled}
            >
              🔔 Oracle Ping
            </button>
          )}
        </div>

        <div className="lg:hidden">
          <MiniAction icon="🔔" onClick={() => setShowOracleInput(true)} />
        </div>

        {/* Media Sniper */}
        <div className="hidden lg:block">
          <button
            onClick={() => setMediaModalOpen(true)}
            className="w-full btn btn-secondary py-2"
          >
            <span className="text-lg">📸</span> {mediaProcessing ? 'Processing...' : 'Media Sniper'}
          </button>
        </div>
        <div className="lg:hidden">
          <MiniAction icon="📸" onClick={() => setMediaModalOpen(true)} />
        </div>

          <button
            onClick={() => setMagicLinkModalOpen(true)}
            className="w-full btn btn-secondary py-2"
          >
            <span className="text-lg">🔗</span> Magic Link
          </button>
        <div className="lg:hidden">
          <MiniAction icon="🔗" onClick={() => setMagicLinkModalOpen(true)} />
        </div>

        {/* Quick Actions Divider */}
        <div className="hidden lg:block pt-2">
          <p className="text-[0.55rem] font-semibold uppercase tracking-widest text-text-muted mb-2">
            Quick Send
          </p>

          <div className="space-y-1.5">
            <QuickReply label="✅ Confirm" />
            <QuickReply label="⏳ Please wait" />
            <QuickReply label="📋 Send details" />
            <QuickReply label="💰 Send price" />
          </div>
        </div>
      </div>

      {/* Bridge Code */}
      <div className="p-6 border-t border-chat-border text-center">
        <p className="text-[0.5rem] text-text-muted uppercase tracking-[0.3em] font-bold hidden lg:block mb-1">Sector ID</p>
        <p className="text-[0.65rem] font-mono font-bold text-white tracking-tighter">{activeBridge.bridge_code}</p>
      </div>
    </div>
  );
}

function MiniToggle({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-8 rounded-lg text-[0.55rem] font-bold flex items-center justify-center transition-all
        ${active ? 'bg-primary text-white' : 'bg-chat-bg text-text-muted border border-chat-border'}
      `}
    >
      {label}
    </button>
  );
}

function MiniAction({ icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-xl bg-chat-bg border border-chat-border flex items-center justify-center
                 hover:bg-chat-hover hover:border-text-primary transition-all text-base"
    >
      {icon}
    </button>
  );
}

function QuickReply({ label }) {
  return (
    <button className="w-full text-left px-3 py-2 rounded-lg bg-chat-bg border border-chat-border
                       text-xs text-text-secondary hover:bg-chat-hover hover:text-text-primary
                       transition-all">
      {label}
    </button>
  );
}
