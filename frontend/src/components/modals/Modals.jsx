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
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source A — Client */}
        {/* Source A — Client */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">👤</span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-info">Source A — Client</h4>
          </div>
          <input
            type="text"
            value={form.source_a_name}
            onChange={(e) => setForm({ ...form, source_a_name: e.target.value })}
            placeholder="Client name..."
            className="w-full bg-chat-bg border border-chat-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary transition-all"
          />
          <PlatformSelect
            value={form.source_a_platform}
            onChange={(val) => setForm({ ...form, source_a_platform: val })}
          />
        </div>

        {/* Bridge Arrow */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full border border-primary bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-lg">⇅</span>
          </div>
        </div>

        {/* Source B — Provider */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🏢</span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Source B — Provider</h4>
          </div>
          <input
            type="text"
            value={form.source_b_name}
            onChange={(e) => setForm({ ...form, source_b_name: e.target.value })}
            placeholder="Provider name..."
            className="w-full bg-chat-bg border border-chat-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary transition-all"
          />
          <PlatformSelect
            value={form.source_b_platform}
            onChange={(val) => setForm({ ...form, source_b_platform: val })}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.source_a_name || !form.source_b_name}
          className="w-full btn btn-primary py-3"
        >
          <span className="text-lg">🌉</span> {loading ? 'Creating...' : 'Create Bridge'}
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
    <ModalWrapper onClose={() => setMediaModalOpen(false)} title="AI Media Sniper">
      <div className="space-y-4">
        <p className="text-xs text-text-secondary">
          One-click media processing pipeline. Paste a URL to automatically upscale, remove watermarks, and strip metadata.
        </p>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste image/media URL..."
          className="w-full bg-chat-bg border border-chat-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary transition-all"
        />

        <div className="space-y-3">
          <OptionToggle
            label="📐 Upscale to 4K"
            description="Increase resolution for HD output"
            active={options.upscale}
            onChange={() => setOptions({ ...options, upscale: !options.upscale })}
          />
          <OptionToggle
            label="🎨 Watermark Removal"
            description="AI inpainting to remove logos & contact info"
            active={options.deWatermark}
            onChange={() => setOptions({ ...options, deWatermark: !options.deWatermark })}
          />
          <OptionToggle
            label="🧹 Metadata Cleaning"
            description="Strip EXIF, GPS, and sensitive data"
            active={options.cleanMeta}
            onChange={() => setOptions({ ...options, cleanMeta: !options.cleanMeta })}
          />
        </div>

        <button
          onClick={handleProcess}
          disabled={loading || !url.trim()}
          className="w-full btn btn-primary py-3"
        >
          <span className="text-lg">⚡</span> {mediaProcessing ? 'Processing' : 'Process Media'}
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
    <ModalWrapper onClose={() => { setMagicLinkModalOpen(false); setResult(null); }} title="Magic Link Connector">
      <div className="space-y-4">
        <p className="text-xs text-text-secondary">
          Generate a secure UUID URL that tunnels external party data into your Bribox dashboard.
          Zero app installation required.
        </p>

        {!result ? (
          <>
            <PlatformSelect value={platform} onChange={setPlatform} />

            <div className="card p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Max Uses</span>
                <span className="text-text-primary">5</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Expires</span>
                <span className="text-text-primary">7 days</span>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full btn btn-primary py-3">
              <span className="text-lg">🔗</span> {loading ? 'Generating...' : 'Generate Link'}
            </button>
          </>
        ) : (
          <div className="animate-fade-in-up space-y-3">
            <div className="card p-4 text-center">
              <span className="text-3xl mb-2 block">✅</span>
              <p className="text-sm font-semibold text-primary mb-2">Link Generated!</p>
              <div className="bg-chat-sidebar rounded-lg p-3 break-all">
                <code className="text-xs text-primary">{result.url}</code>
              </div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(result.url); }}
              className="w-full btn btn-secondary"
            >
              <span className="text-lg">📋</span> Copy to Clipboard
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md card p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-chat-hover transition-colors text-text-muted"
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
    <div className="grid grid-cols-4 gap-2">
      {PLATFORMS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`py-2 px-1 rounded-lg text-center transition-all
            ${value === p.value
              ? 'bg-primary/20 border border-primary/30 text-primary'
              : 'bg-chat-bg border border-chat-border text-text-muted hover:bg-chat-hover'
            }`}
        >
          <span className="text-lg block">{p.icon}</span>
          <span className="text-[0.55rem] font-medium mt-1 block">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

function OptionToggle({ label, description, active, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border
        ${active
          ? 'bg-primary/10 border-primary/20'
          : 'bg-chat-bg border-chat-border'
        }`}
    >
      <div>
        <p className="text-xs font-semibold text-text-primary">{label}</p>
        <p className="text-[0.6rem] text-text-muted mt-0.5">{description}</p>
      </div>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
        ${active ? 'border-primary bg-primary' : 'border-chat-border'}`}>
        {active && <span className="text-white text-[0.5rem]">✓</span>}
      </div>
    </button>
  );
}
