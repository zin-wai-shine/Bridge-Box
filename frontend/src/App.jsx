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
    <div className="h-screen flex flex-col overflow-hidden bg-chat-bg">

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar />

        {/* Command Center */}
        <CommandCenter />
      </div>

      {/* Modals */}
      <CreateBridgeModal />
      <MediaSniperModal />
      <MagicLinkModal />
    </div>
  );
}
