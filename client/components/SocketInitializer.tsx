"use client";
import { useEffect } from "react";
import { socket } from "../lib/socket";
import { useSocketStore } from "../store/useSocketStore";
import { useAuthStore } from "../lib/store";

export default function SocketInitializer() {
  const setIsConnected = useSocketStore((state) => state.setIsConnected);
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?._id ?? user?.id ?? null;

  useEffect(() => {
    if (isAuthenticated && userId) {
      socket.auth = { userId: String(userId) };
      socket.connect();

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        // Don't disconnect in cleanup - avoids "WebSocket closed before connection established"
        // when effect re-runs (e.g. rehydration). Only disconnect when auth is false (else branch).
      };
    } else {
      socket.disconnect();
    }
  }, [setIsConnected, isAuthenticated, userId]);

  return null;
}