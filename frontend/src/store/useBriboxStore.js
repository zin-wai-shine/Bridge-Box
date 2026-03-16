import { create } from 'zustand';

const API_BASE = '/api';

export const useBriboxStore = create((set, get) => ({
  // ── Bridges ───────────────────────────────────────────────
  bridges: [],
  activeBridge: null,
  bridgesLoading: true,

  fetchBridges: async () => {
    set({ bridgesLoading: true });
    try {
      const res = await fetch(`${API_BASE}/bridges`);
      const data = await res.json();
      set({ bridges: data.bridges || [], bridgesLoading: false });
    } catch (err) {
      console.error('Failed to fetch bridges:', err);
      set({ bridgesLoading: false });
    }
  },

  setActiveBridge: (bridge) => {
    set({ activeBridge: bridge, messages: [], messagesLoading: true });
    if (bridge) get().fetchMessages(bridge.id);
  },

  createBridge: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/bridges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      get().fetchBridges();
      return data;
    } catch (err) {
      console.error('Failed to create bridge:', err);
      return null;
    }
  },

  toggleBridgeSetting: async (bridgeId, field, value) => {
    try {
      await fetch(`${API_BASE}/bridges/${bridgeId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });
      set((state) => ({
        bridges: state.bridges.map((b) =>
          b.id === bridgeId ? { ...b, [field]: value } : b
        ),
        activeBridge:
          state.activeBridge?.id === bridgeId
            ? { ...state.activeBridge, [field]: value }
            : state.activeBridge,
      }));
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  },

  // ── Messages ──────────────────────────────────────────────
  messages: [],
  messagesLoading: false,

  fetchMessages: async (bridgeId) => {
    set({ messagesLoading: true });
    try {
      const res = await fetch(`${API_BASE}/messages/${bridgeId}?limit=100`);
      const data = await res.json();
      set({ messages: data.messages || [], messagesLoading: false });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      set({ messagesLoading: false });
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  sendMessage: async (bridgeId, connectionId, direction, content, msgType = 'text') => {
    try {
      await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridge_id: bridgeId,
          connection_id: connectionId,
          direction,
          msg_type: msgType,
          content,
        }),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  },

  // ── Oracle ────────────────────────────────────────────────
  oracleLoading: false,

  pingOracle: async (bridgeId, queryText) => {
    set({ oracleLoading: true });
    try {
      const res = await fetch(`${API_BASE}/oracle/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridge_id: bridgeId, query_text: queryText }),
      });
      const data = await res.json();
      set({ oracleLoading: false });
      return data;
    } catch (err) {
      console.error('Oracle ping failed:', err);
      set({ oracleLoading: false });
      return null;
    }
  },

  // ── Media Sniper ──────────────────────────────────────────
  mediaProcessing: false,

  processMedia: async (sourceUrl, bridgeId, options = {}) => {
    set({ mediaProcessing: true });
    try {
      const res = await fetch(`${API_BASE}/media/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: sourceUrl,
          bridge_id: bridgeId,
          upscale: options.upscale ?? true,
          de_watermark: options.deWatermark ?? true,
          clean_meta: options.cleanMeta ?? true,
        }),
      });
      const data = await res.json();
      set({ mediaProcessing: false });
      return data;
    } catch (err) {
      console.error('Media processing failed:', err);
      set({ mediaProcessing: false });
      return null;
    }
  },

  // ── Magic Links ───────────────────────────────────────────
  generateMagicLink: async (bridgeId, targetPlatform, maxUses = 1, expiresHours = 168) => {
    try {
      const res = await fetch(`${API_BASE}/magic/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridge_id: bridgeId,
          target_platform: targetPlatform,
          max_uses: maxUses,
          expires_hours: expiresHours,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error('Magic link generation failed:', err);
      return null;
    }
  },

  // ── Dashboard Stats ───────────────────────────────────────
  stats: null,
  statsLoading: true,

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      set({ stats: data, statsLoading: false });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      set({ statsLoading: false });
    }
  },

  // ── WebSocket ─────────────────────────────────────────────
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  // ── UI State ──────────────────────────────────────────────
  mobilePane: 'client', // 'client' | 'provider'
  sidebarOpen: true,
  createModalOpen: false,
  mediaModalOpen: false,
  magicLinkModalOpen: false,

  setMobilePane: (pane) => set({ mobilePane: pane }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCreateModalOpen: (open) => set({ createModalOpen: open }),
  setMediaModalOpen: (open) => set({ mediaModalOpen: open }),
  setMagicLinkModalOpen: (open) => set({ magicLinkModalOpen: open }),
}));
