import React, { useState } from 'react';
import { useBriboxStore } from '../../store/useBriboxStore';
import { SniperButton } from '../ui';

const PLATFORMS = [
  { value: 'line', label: 'LINE', icon: '💚' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { value: 'messenger', label: 'Messenger', icon: '💬' },
];

export function CreateBridgeModal() {
  const { createModalOpen, setCreateModalOpen, createBridge } = useBriboxStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    source_a_name: '',
    source_a_platform: 'line',
    source_b_name: '',
    source_b_platform: 'whatsapp',
  });

  if (!createModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.source_a_name || !form.source_b_name) return;
    setLoading(true);
    await createBridge(form);
    setLoading(false);
    setCreateModalOpen(false);
    setForm({ source_a_name: '', source_a_platform: 'line', source_b_name: '', source_b_platform: 'whatsapp' });
  };

  return (
    <ModalWrapper onClose={() => setCreateModalOpen(false)} title="Initialize Bridge">
      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-8">
          {/* Source A — Client */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-text-muted">
                Sector A (Source)
              </label>
              <span className="text-[0.45rem] font-black text-white bg-white/10 px-2 py-0.5 rounded tracking-tighter shadow-sm">UPLINK_01</span>
            </div>
            <input
              type="text"
              value={form.source_a_name}
              onChange={(e) => setForm({ ...form, source_a_name: e.target.value })}
              placeholder="Source Name (e.g. Client Alpha)"
              className="w-full bg-[#181818] border border-chat-border rounded-2xl px-6 py-5 text-sm text-white outline-none focus:border-white transition-all font-bold placeholder:text-text-muted/20 shadow-inner"
            />
            <PlatformSelect
              value={form.source_a_platform}
              onChange={(val) => setForm({ ...form, source_a_platform: val })}
            />
          </div>

          {/* Tactical Divider */}
          <div className="flex items-center gap-6 px-1">
            <div className="flex-1 h-[2px] bg-chat-border/50" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[0.5rem] font-black text-text-muted tracking-[0.4em] uppercase">Bridging Network</span>
            </div>
            <div className="flex-1 h-[2px] bg-chat-border/50" />
          </div>

          {/* Source B — Provider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-text-muted">
                Sector B (Dest)
              </label>
              <span className="text-[0.45rem] font-black text-white bg-white/10 px-2 py-0.5 rounded tracking-tighter shadow-sm">UPLINK_02</span>
            </div>
            <input
              type="text"
              value={form.source_b_name}
              onChange={(e) => setForm({ ...form, source_b_name: e.target.value })}
              placeholder="Target Name (e.g. Fulfillment Hub)"
              className="w-full bg-[#181818] border border-chat-border rounded-2xl px-6 py-5 text-sm text-white outline-none focus:border-white transition-all font-bold placeholder:text-text-muted/20 shadow-inner"
            />
            <PlatformSelect
              value={form.source_b_platform}
              onChange={(val) => setForm({ ...form, source_b_platform: val })}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.source_a_name || !form.source_b_name}
          className="w-full btn btn-primary py-6 text-xs font-black uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(0,0,0,0.5)] active:scale-[0.98] mt-4"
        >
          {loading ? 'DEPLOYING UPLINK...' : 'DEPLOY TACTICAL BRIDGE'}
        </button>
      </form>
    </ModalWrapper>
  );
}

export function MediaSniperModal() {
  const { mediaModalOpen, setMediaModalOpen, processMedia, activeBridge, mediaProcessing } = useBriboxStore();
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState({ upscale: true, deWatermark: true, cleanMeta: true });

  if (!mediaModalOpen) return null;

  const handleProcess = async () => {
    if (!url.trim()) return;
    await processMedia(url, activeBridge?.id, options);
    setUrl('');
    setMediaModalOpen(false);
  };

  return (
    <ModalWrapper onClose={() => setMediaModalOpen(false)} title="Media Sniper">
      <div className="space-y-6">
        <p className="text-[0.65rem] text-text-muted font-bold tracking-widest uppercase">
          AI-Powered media optimization pipeline. Paste URL to refine.
        </p>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Media Source URL..."
          className="w-full bg-chat-bg border border-chat-border rounded-xl px-4 py-3.5 text-sm text-text-primary outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-medium placeholder:text-text-muted/30"
        />

        <div className="space-y-3">
          <OptionToggle
            label="4K UPSCALING"
            description="Neural resolution enhancement"
            active={options.upscale}
            onChange={() => setOptions({ ...options, upscale: !options.upscale })}
          />
          <OptionToggle
            label="WATERMARK STRIP"
            description="AI inpainting removal"
            active={options.deWatermark}
            onChange={() => setOptions({ ...options, deWatermark: !options.deWatermark })}
          />
          <OptionToggle
            label="METADATA SCRUB"
            description="EXIF/GPS data sanitization"
            active={options.cleanMeta}
            onChange={() => setOptions({ ...options, cleanMeta: !options.cleanMeta })}
          />
        </div>

        <button
          onClick={handleProcess}
          disabled={loading || !url.trim()}
          className="w-full btn btn-primary py-4 mt-2"
        >
          {mediaProcessing ? 'Analyzing...' : 'PROCESS TACTICAL MEDIA'}
        </button>
      </div>
    </ModalWrapper>
  );
}

export function MagicLinkModal() {
  const { magicLinkModalOpen, setMagicLinkModalOpen, generateMagicLink, activeBridge } = useBriboxStore();
  const [platform, setPlatform] = useState('line');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!magicLinkModalOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    const data = await generateMagicLink(activeBridge?.id, platform, 5, 168);
    setResult(data);
    setLoading(false);
  };

  return (
    <ModalWrapper onClose={() => { setMagicLinkModalOpen(false); setResult(null); }} title="Link Connector">
      <div className="space-y-6">
        <p className="text-[0.65rem] text-text-muted font-bold tracking-widest uppercase">
          Generate UUID tunnel to route external data into dashboard.
        </p>

        {!result ? (
          <>
            <PlatformSelect value={platform} onChange={setPlatform} />

            <div className="bg-chat-bg border border-chat-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-[0.6rem] font-bold uppercase tracking-widest text-text-muted">
                <span>Max Capacity</span>
                <span className="text-white">5 USES</span>
              </div>
              <div className="flex justify-between text-[0.6rem] font-bold uppercase tracking-widest text-text-muted">
                <span>TTL Expiry</span>
                <span className="text-white">168 HOURS</span>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full btn btn-primary py-4 mt-2">
              {loading ? 'Generating...' : 'GENERATE ACCESS LINK'}
            </button>
          </>
        ) : (
          <div className="animate-fade-in-up space-y-4">
            <div className="bg-chat-bg border border-chat-border rounded-xl p-6 text-center shadow-inner">
              <span className="text-4xl mb-3 block">🔗</span>
              <p className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white underline decoration-white/20 underline-offset-4 decoration-2">Link Generated</p>
              <div className="bg-chat-sidebar border border-chat-border rounded-lg p-4 mt-4 break-all shadow-lg">
                <code className="text-[0.65rem] font-mono font-bold text-white selection:bg-white selection:text-[#181818]">{result.url}</code>
              </div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(result.url); }}
              className="w-full btn btn-primary py-4 text-xs font-bold uppercase tracking-widest"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// ── Shared Components ──────────────────────────────────────

function ModalWrapper({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#181818] border border-chat-border p-10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-fade-in-up my-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-white rounded-full" />
            <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-white leading-none whitespace-nowrap">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-chat-bg border border-chat-border hover:bg-white hover:text-[#181818] transition-all text-sm shadow-lg"
          >
            ✕
          </button>
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}

function PlatformSelect({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {PLATFORMS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`h-16 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1.5 border
            ${value === p.value
              ? 'bg-white border-white text-[#181818] shadow-2xl scale-[1.02]'
              : 'bg-chat-bg border-chat-border text-text-muted hover:border-white/40 hover:text-white'
            }`}
        >
          <span className="text-xl leading-none">{p.icon}</span>
          <span className="text-[0.45rem] font-black uppercase tracking-widest leading-none">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

function OptionToggle({ label, description, active, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between border group
        ${active
          ? 'bg-white/5 border-white shadow-lg'
          : 'bg-chat-bg border-chat-border hover:border-white/30'
        }`}
    >
      <div>
        <p className="text-[0.6rem] font-black uppercase tracking-widest text-white">{label}</p>
        <p className="text-[0.55rem] text-text-muted font-medium mt-1 leading-none">{description}</p>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
        ${active ? 'border-white bg-white' : 'border-chat-border group-hover:border-white/50'}`}>
        {active && <span className="text-[#181818] text-[0.6rem] font-black">✓</span>}
      </div>
    </button>
  );
}
