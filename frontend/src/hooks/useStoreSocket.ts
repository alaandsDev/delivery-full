'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';

type OrderEvent = {
  id: string;
  customerName: string;
  totalCents: number;
  status: string;
};

type UseStoreSocketOptions = {
  storeId: string | undefined;
  token: string | undefined | null;
  onNewOrder?: (order: OrderEvent) => void;
  onOrderUpdated?: (order: OrderEvent) => void;
};

export function useStoreSocket({ storeId, token, onNewOrder, onOrderUpdated }: UseStoreSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onNewOrderRef = useRef(onNewOrder);
  const onOrderUpdatedRef = useRef(onOrderUpdated);

  useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);
  useEffect(() => { onOrderUpdatedRef.current = onOrderUpdated; }, [onOrderUpdated]);

  const connect = useCallback(() => {
    if (!storeId || !token || !WS_URL) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      socket.emit('join_store', storeId);
    });

    socket.on('new_order', (order: OrderEvent) => {
      onNewOrderRef.current?.(order);
    });

    socket.on('order_updated', (order: OrderEvent) => {
      onOrderUpdatedRef.current?.(order);
    });

    socketRef.current = socket;
    return socket;
  }, [storeId, token]);

  useEffect(() => {
    const socket = connect();
    return () => {
      socket?.disconnect();
    };
  }, [connect]);

  return socketRef;
}
