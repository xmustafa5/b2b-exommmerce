import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { OrderStatus } from '../types';

interface OrderUpdateEvent {
  type: 'order:updated';
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
}

interface WebSocketMessage {
  type: string;
  orderId?: string;
  status?: OrderStatus;
  updatedAt?: string;
  message?: string;
}

// API base URL - adjust for your environment
const getWebSocketUrl = (): string => {
  // For iOS simulator: ws://localhost:3000
  // For Android emulator: ws://10.0.2.2:3000
  // For physical device: ws://YOUR_IP:3000
  return 'ws://localhost:3000';
};

/**
 * Hook for real-time order tracking via WebSocket
 */
export function useOrderTracking(orderId: string) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const tokens = useAuthStore((state) => state.tokens);

  const connect = useCallback(() => {
    if (!orderId || !tokens?.accessToken) {
      return;
    }

    try {
      const wsUrl = `${getWebSocketUrl()}/ws?token=${tokens.accessToken}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[OrderTracking] WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to order updates
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            orderId,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          if (data.type === 'order:updated' && data.orderId === orderId) {
            console.log('[OrderTracking] Order status updated:', data.status);
            if (data.status) {
              setStatus(data.status);
            }
          }
        } catch (parseError) {
          console.error('[OrderTracking] Failed to parse message:', parseError);
        }
      };

      ws.onerror = (event) => {
        console.error('[OrderTracking] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('[OrderTracking] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[OrderTracking] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[OrderTracking] Failed to create WebSocket:', err);
      setError('Failed to connect');
    }
  }, [orderId, tokens?.accessToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    isConnected,
    error,
    reconnect: connect,
  };
}

/**
 * Hook for receiving all order updates (useful for order list)
 */
export function useOrderUpdates(onUpdate?: (orderId: string, status: OrderStatus) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tokens = useAuthStore((state) => state.tokens);

  useEffect(() => {
    if (!tokens?.accessToken) {
      return;
    }

    try {
      const wsUrl = `${getWebSocketUrl()}/ws?token=${tokens.accessToken}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Subscribe to all user's orders
        ws.send(JSON.stringify({ type: 'subscribe:all' }));
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          if (data.type === 'order:updated' && data.orderId && data.status) {
            onUpdate?.(data.orderId, data.status);
          }
        } catch (parseError) {
          console.error('[OrderUpdates] Failed to parse message:', parseError);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;

      return () => {
        ws.close(1000, 'Component unmounted');
      };
    } catch (err) {
      console.error('[OrderUpdates] Failed to create WebSocket:', err);
    }
  }, [tokens?.accessToken, onUpdate]);

  return { isConnected };
}
