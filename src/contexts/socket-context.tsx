// src/contexts/socket-context.tsx
// חיבור Socket.io אחד לכל האפליקציה (צ'אט קבוצתי, הודעות פרטיות והתראות בזמן אמת) - אותו שרת ואותם אירועים כמו באתר
// (chavruta-app/server/sockets/chatSocket.js). האימות הוא בטוקן (auth.token) במקום בעוגיית session.
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  refreshUnread: () => Promise<void>;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  unreadCount: 0,
  setUnreadCount: () => {},
  refreshUnread: async () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, web } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const webRef = useRef(web);
  webRef.current = web;

  const refreshUnread = useCallback(async () => {
    try {
      const res = await webRef.current.get<{ unreadCount?: number }>("/api/notifications");
      const count = (res as unknown as { unreadCount?: number }).unreadCount ?? 0;
      setUnreadCount(count);
    } catch {
      // התראות הן "בונוס" - כישלון לא מפריע לשאר האפליקציה
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      setUnreadCount(0);
      return;
    }
    const s = io(API_BASE_URL, { auth: { token }, transports: ["websocket", "polling"], reconnection: true });
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("notification:new", () => setUnreadCount((n) => n + 1)); // פעמון בזמן אמת, כמו notifications.js באתר
    setSocket(s);
    refreshUnread();
    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [token, refreshUnread]);

  const value = useMemo(
    () => ({ socket, connected, unreadCount, setUnreadCount, refreshUnread }),
    [socket, connected, unreadCount, refreshUnread]
  );
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
