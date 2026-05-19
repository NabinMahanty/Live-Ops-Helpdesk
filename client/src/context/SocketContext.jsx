"use client";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";

const SocketContext = createContext(null);

export function SocketProvider({ children, agentName }) {
  const [connected, setConnected] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [locks, setLocks] = useState({});
  const [agentsOnline, setAgentsOnline] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!agentName) return;
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("register_agent", { agentName });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("initial_state", ({ tickets: t, locks: l }) => {
      setTickets(t);
      setLocks(l);
    });

    socket.on("ticket_created", (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
    });

    socket.on("ticket_updated", (ticket) => {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
    });

    socket.on("ticket_locked", ({ ticketId, agentName: locker, lockedAt }) => {
      setLocks((prev) => ({ ...prev, [ticketId]: { agentName: locker, lockedAt } }));
    });

    socket.on("ticket_unlocked", ({ ticketId }) => {
      setLocks((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    });

    socket.on("agents_online", (count) => setAgentsOnline(count));

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("initial_state");
      socket.off("ticket_created");
      socket.off("ticket_updated");
      socket.off("ticket_locked");
      socket.off("ticket_unlocked");
      socket.off("agents_online");
      socket.disconnect();
    };
  }, [agentName]);

  const lockTicket = useCallback((ticketId) => {
    socketRef.current?.emit("lock_ticket", { ticketId, agentName });
  }, [agentName]);

  const unlockTicket = useCallback((ticketId) => {
    socketRef.current?.emit("unlock_ticket", { ticketId });
  }, []);

  return (
    <SocketContext.Provider value={{ connected, tickets, locks, agentsOnline, lockTicket, unlockTicket, agentName, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
