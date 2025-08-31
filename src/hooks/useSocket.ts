'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001');
    
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return socket;
}