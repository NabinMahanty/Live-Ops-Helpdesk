# PROMPTS.md — AI Transparency Log

## Overview
This document records AI-assisted decisions and debugging during the development of the Live Ops Helpdesk.

---

## 1. Socket.io Architecture — Lock Map Design
**Prompt Context:** Designing the in-memory lock tracking system.

**Decision:** Used a `Map<ticketId, { agentName, socketId, lockedAt }>` structure on the server. The `socketId` is critical — it's the key that enables the Ghost Disconnect handler. When a socket disconnects, we iterate the lock map and release any locks where `lockInfo.socketId === disconnectedSocketId`.

**Why not a database?** For this MVP, in-memory is sufficient. Lock state is transient by nature — if the server restarts, all locks should be cleared anyway. A Redis-backed lock store would be the next step for horizontal scaling.

---

## 2. React Strict Mode — Double Socket Connection
**Prompt Context:** Debugging why `useEffect` in `SocketContext` was firing twice in development.

**Resolution:** React 18's Strict Mode intentionally double-invokes effects in development to surface cleanup bugs. The fix was to:
1. Use a singleton pattern for the socket instance (`getSocket()` in `lib/socket.js`)
2. Properly clean up all listeners in the `useEffect` return function
3. Call `socket.disconnect()` in cleanup

This ensures that even with Strict Mode's double-mount, we don't get duplicate connections or phantom event listeners.

---

## 3. Ghost Disconnect Handler
**Prompt Context:** Implementing automatic lock release when an agent closes their tab or loses Wi-Fi.

**Approach:** Socket.io's built-in `disconnect` event fires automatically when:
- The tab is closed (`transport close`)
- Wi-Fi drops (detected via `pingTimeout` — set to 5 seconds)
- The server detects no heartbeat response

On disconnect, the server iterates the entire `lockMap`, finds all entries where `socketId` matches the disconnected socket, deletes them, and broadcasts `ticket_unlocked` to all remaining clients. This is the "ghost cleanup" — no polling, no timers, purely event-driven.

---

## 4. CORS Configuration for Production
**Prompt Context:** WebSocket connections fail in production when CORS isn't properly configured.

**Solution:** Both the Express CORS middleware and the Socket.io server constructor accept an `origin` array. For production:
- The Vercel frontend URL must be added to `ALLOWED_ORIGINS`
- `credentials: true` must be set on both sides
- Socket.io should be configured to use both `websocket` and `polling` transports as fallback

---

## 5. State Synchronization on Reconnect
**Prompt Context:** What happens when an agent reconnects after a brief disconnect?

**Approach:** On every `connect` event, the client re-emits `register_agent`. The server responds with `initial_state` containing the full ticket list and current lock map. This ensures the reconnected client has accurate state without needing to refresh the page.
