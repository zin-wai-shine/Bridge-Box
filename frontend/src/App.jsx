import React, { useEffect } from 'react';
import { useBriboxStore } from './store/useBriboxStore';
import { useWebSocket } from './hooks/useWebSocket';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import CommandCenter from './components/bridge/CommandCenter';
import { CreateBridgeModal, MediaSniperModal, MagicLinkModal } from './components/modals/Modals';

export default function App() {
  const { fetchBridges, fetchStats, activeBridge } = useBriboxStore();

  // Connect WebSocket
  useWebSocket(activeBridge?.id);

  // Initial data fetch
  useEffect(() => {
    fetchBridges();
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [fetchBridges, fetchStats]);

  return (
    <div className="h-full flex flex-col bg-[#212121] rounded-[2rem] border border-chat-border shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar />
        <CommandCenter />
      </div>

      {/* Modals */}
      <CreateBridgeModal />
      <MediaSniperModal />
      <MagicLinkModal />
    </div>
  );
}
