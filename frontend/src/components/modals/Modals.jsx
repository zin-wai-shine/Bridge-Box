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
    <ModalWrapper onClose={() => setCreateModalOpen(false)} title="Create New Bridge">
      <form onSubmit={handleSubmit} className="space-y-6 mt-2">
        {/* Source A — Client */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <span>👤</span> Client Source
          </label>
          <input
            type="text"
            value={form.source_a_name}
            onChange={(e) => setForm({ ...form, source_a_name: e.target.value })}
            placeholder="Client name (e.g. John Doe)"
            className="w-full bg-chat-bg border border-chat-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder-text-muted/50"
          />
          <PlatformSelect
            value={form.source_a_platform}
            onChange={(val) => setForm({ ...form, source_a_platform: val })}
          />
        </div>

        {/* Bridge Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-chat-sidebar border border-chat-border flex items-center justify-center text-text-muted shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        </div>

        {/* Source B — Provider */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <span>🏢</span> Provider Source
          </label>
          <input
            type="text"
            value={form.source_b_name}
            onChange={(e) => setForm({ ...form, source_b_name: e.target.value })}
            placeholder="Provider name (e.g. Agency Team)"
            className="w-full bg-chat-bg border border-chat-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder-text-muted/50"
          />
          <PlatformSelect
            value={form.source_b_platform}
            onChange={(val) => setForm({ ...form, source_b_platform: val })}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.source_a_name || !form.source_b_name}
          className="w-full btn btn-primary py-3.5 mt-4 text-sm"
        >
          {loading ? 'Creating Bridge...' : 'Create Bridge'}
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-chat-sidebar border border-chat-border p-8 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-white border-l-4 border-white pl-4 leading-none">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-chat-bg border border-chat-border hover:bg-white hover:text-[#181818] transition-all text-xs"
          >
            ✕
          </button>
        </div>
        {children}
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
