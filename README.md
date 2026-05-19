# 🚛 Live Ops Helpdesk — RapidDispatch Freight & Logistics

A **real-time collaborative helpdesk** built for RapidDispatch's 50-agent support team. Solves the critical **race condition** problem where multiple agents editing the same ticket would overwrite each other's work.

## ✨ Key Features

- **🔒 Real-Time Ticket Locking** — When an agent opens a ticket, it instantly locks for all other agents across the globe
- **👁️ Live Presence** — See which tickets are locked and by whom, in real-time with zero page refreshes
- **👻 Ghost Disconnect Handling** — If an agent closes their tab or loses Wi-Fi, their locks are automatically released
- **⚡ Instant Sync** — New tickets created by anyone appear instantly on all connected dashboards
- **🔴 Connection Banner** — Visual warning when WebSocket connection drops, with auto-reconnect
- **🚫 No Polling** — Pure WebSocket (Socket.io) bidirectional communication

## 🏗️ Architecture

```
┌─────────────────────┐     WebSocket (Socket.io)     ┌─────────────────────┐
│   Next.js Client    │◄════════════════════════════►│  Express + Socket.io │
│   (React 18)        │         REST API (HTTP)       │  Server              │
│                     │◄─────────────────────────────►│                     │
│  • SocketProvider   │                               │  • Lock Map          │
│  • TicketBoard      │                               │  • Ticket Store      │
│  • ConnectionBanner │                               │  • Presence Tracker  │
└─────────────────────┘                               └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (with npm)

### 1. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:4000`

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:3000`

### 3. Test Dual-Agent Scenario
1. Open `http://localhost:3000` in **Window 1** → Login as "Agent Sarah"
2. Open `http://localhost:3000` in **Window 2** → Login as "Agent Marcus"
3. Click a ticket in Window 1 → Window 2 instantly shows 🔒
4. Close Window 1's tab → Window 2 auto-unlocks the ticket

## 📁 Project Structure

```
Live-Ops-Helpdesk/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── package.json
│   └── .env
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js        # Root layout with SEO
│   │   │   ├── page.js          # Entry point (login → board)
│   │   │   └── globals.css      # Design system
│   │   ├── components/
│   │   │   ├── AgentLogin.jsx    # Login screen
│   │   │   ├── TicketBoard.jsx   # Main dashboard
│   │   │   ├── TicketRow.jsx     # Individual ticket with lock UI
│   │   │   ├── TicketEditor.jsx  # Edit modal (emits unlock on close)
│   │   │   ├── CreateTicket.jsx  # New ticket modal
│   │   │   └── ConnectionBanner.jsx  # Disconnect warning
│   │   ├── context/
│   │   │   └── SocketContext.jsx # Central socket state manager
│   │   └── lib/
│   │       └── socket.js        # Singleton socket instance
│   └── .env.local
├── PROMPTS.md                    # AI transparency log
└── README.md
```

## 🔌 Socket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `register_agent` | Client → Server | Register agent name on connect |
| `initial_state` | Server → Client | Send full ticket + lock state |
| `ticket_created` | Server → All | Broadcast new ticket |
| `ticket_updated` | Server → All | Broadcast ticket edit |
| `lock_ticket` | Client → Server | Request lock on a ticket |
| `ticket_locked` | Server → All | Broadcast lock acquired |
| `unlock_ticket` | Client → Server | Release lock |
| `ticket_unlocked` | Server → All | Broadcast lock released |
| `agents_online` | Server → All | Updated connected agent count |
| `disconnect` | Auto | Server auto-releases all locks |

## 🛡️ Race Condition Solution

The previous CRUD app allowed this destructive sequence:
1. Agent A opens Ticket #105, starts typing
2. Agent B opens Ticket #105, types different resolution, saves
3. Agent A saves → **overwrites Agent B's work permanently**

**Our solution:** Step 1 now emits `lock_ticket`. Step 2 is **blocked** — Agent B sees 🔒 and a disabled edit button. The race condition is eliminated at the UI level before it can reach the data layer.

## 📝 License

Built for RapidDispatch Freight & Logistics — Dallas, TX
