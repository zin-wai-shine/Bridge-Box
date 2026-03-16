import { useEffect, useRef, useCallback } from 'react';
import { useBriboxStore } from '../store/useBriboxStore';

export function useWebSocket(bridgeId) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const { addMessage, setWsConnected, fetchBridges } = useBriboxStore();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const params = bridgeId ? `?bridge_id=${bridgeId}` : '';
    const url = `${protocol}//${host}/ws${params}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🟢 WebSocket connected');
        setWsConnected(true);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'new_message':
              addMessage(data.payload);
              break;
            case 'bridge_update':
              fetchBridges();
              break;
            case 'oracle_update':
            case 'toggle_update':
            case 'media_update':
              // These can be handled by specific components
              window.dispatchEvent(new CustomEvent('bribox:ws', { detail: data }));
              break;
            default:
              break;
          }
        } catch (err) {
          console.warn('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        setWsConnected(false);
        // Auto-reconnect after 3 seconds
        reconnectTimerRef.current = setTimeout(() => connect(), 3000);
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('WS connection failed:', err);
      reconnectTimerRef.current = setTimeout(() => connect(), 3000);
    }
  }, [bridgeId, addMessage, setWsConnected, fetchBridges]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  const sendWsMessage = useCallback((type, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { sendWsMessage };
}
