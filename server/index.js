/**
 * Live Ops Helpdesk — Backend Server
 * 
 * Express + Socket.io server handling:
 * - REST API for ticket CRUD
 * - Real-time WebSocket events for ticket locking/unlocking
 * - Presence tracking with automatic ghost disconnect cleanup
 * - In-memory ticket & lock store
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// ─── CORS Configuration ───────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  // Add production Vercel URL here when deploying
].filter(Boolean);

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ─── In-Memory Data Store ─────────────────────────────────────────

// Tickets: Map<ticketId, ticketObject>
const tickets = new Map();

// Lock Map: Map<ticketId, { agentName, socketId, lockedAt }>
const lockMap = new Map();

// Connected agents: Map<socketId, { agentName, connectedAt }>
const connectedAgents = new Map();

// ─── Seed Data ────────────────────────────────────────────────────
const seedTickets = [
  {
    id: uuidv4(),
    title: 'Truck #4421 — Engine Failure on I-35',
    customer: 'Walmart Distribution Center',
    priority: 'critical',
    status: 'open',
    description: 'Driver reports complete engine shutdown near mile marker 212 on I-35 southbound. Cargo: 18 pallets of refrigerated goods. ETA was 2 hours. Need emergency tow and transfer vehicle ASAP.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    resolution: '',
  },
  {
    id: uuidv4(),
    title: 'Missed Delivery — Order #RF-88210',
    customer: 'Home Depot — Austin Branch',
    priority: 'high',
    status: 'open',
    description: 'Delivery window was 8AM-12PM. Driver arrived at 3:15PM. Dock was closed. Customer requesting $2,400 credit for delayed construction materials.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    resolution: '',
  },
  {
    id: uuidv4(),
    title: 'Double Billing — Invoice #INV-3309',
    customer: 'Target Corporate Logistics',
    priority: 'high',
    status: 'open',
    description: 'Customer was charged twice for shipment #SH-4410 ($14,200 x2). Finance flagged. Needs immediate refund processing and customer apology call.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    resolution: '',
  },
  {
    id: uuidv4(),
    title: 'Damaged Cargo — Shipment #SH-7782',
    customer: 'Amazon FBA Warehouse — Dallas',
    priority: 'medium',
    status: 'open',
    description: 'Driver reports 3 out of 12 pallets sustained water damage during transit. Suspected tarp failure. Claim value estimated at $8,500.',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 5400000).toISOString(),
    resolution: '',
  },
  {
    id: uuidv4(),
    title: 'Route Optimization Request — Fleet #12',
    customer: 'Costco Wholesale — Regional',
    priority: 'low',
    status: 'open',
    description: 'Fleet manager requesting route re-optimization for 8 trucks covering DFW metro. Current routes have 23% deadhead miles. Potential savings: $4,200/week.',
    createdAt: new Date(Date.now() - 9000000).toISOString(),
    updatedAt: new Date(Date.now() - 9000000).toISOString(),
    resolution: '',
  },
  {
    id: uuidv4(),
    title: 'GPS Tracker Malfunction — Unit #TRK-0091',
    customer: 'Internal Operations',
    priority: 'medium',
    status: 'open',
    description: 'GPS unit on Truck #0091 showing location stuck at last known position (32.7767°N, 96.7970°W) for 6 hours. Driver confirms truck is moving. Need hardware reset or replacement.',
    createdAt: new Date(Date.now() - 4500000).toISOString(),
    updatedAt: new Date(Date.now() - 4500000).toISOString(),
    resolution: '',
  },
  {
    id: uuidv4(),
    title: 'Customs Hold — International Shipment #INT-2205',
    customer: 'Samsung Electronics — Mexico City',
    priority: 'critical',
    status: 'open',
    description: 'Cross-border shipment held at Laredo checkpoint. Missing NAFTA certificate of origin. $340,000 in electronics stuck. Daily storage fees of $1,200 accumulating.',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    resolution: '',
  },
  {
    id: uuidv4(),
    title: 'Driver Complaint — Safety Concern',
    customer: 'Internal HR',
    priority: 'medium',
    status: 'open',
    description: 'Driver #D-1187 filed safety complaint about Truck #3302. Reports faulty brakes on steep grades. Truck needs immediate inspection before next dispatch.',
    createdAt: new Date(Date.now() - 6300000).toISOString(),
    updatedAt: new Date(Date.now() - 6300000).toISOString(),
    resolution: '',
  },
];

// Populate the ticket store
seedTickets.forEach(t => tickets.set(t.id, t));

// ─── REST API Routes ──────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    tickets: tickets.size,
    locks: lockMap.size,
    agents: connectedAgents.size,
  });
});

// Get all tickets
app.get('/api/tickets', (req, res) => {
  const ticketList = Array.from(tickets.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(ticketList);
});

// Create a new ticket
app.post('/api/tickets', (req, res) => {
  const { title, customer, priority, description } = req.body;
  if (!title || !customer) {
    return res.status(400).json({ error: 'Title and customer are required' });
  }
  const ticket = {
    id: uuidv4(),
    title,
    customer,
    priority: priority || 'medium',
    status: 'open',
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolution: '',
  };
  tickets.set(ticket.id, ticket);

  // Broadcast to ALL connected clients instantly
  io.emit('ticket_created', ticket);
  res.status(201).json(ticket);
});

// Update a ticket (save resolution)
app.put('/api/tickets/:id', (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const { resolution, status } = req.body;
  if (resolution !== undefined) ticket.resolution = resolution;
  if (status) ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  tickets.set(ticket.id, ticket);

  // Broadcast update to all clients
  io.emit('ticket_updated', ticket);
  res.json(ticket);
});

// Get current lock state
app.get('/api/locks', (req, res) => {
  const locks = {};
  lockMap.forEach((value, key) => {
    locks[key] = value;
  });
  res.json(locks);
});

// ─── Socket.io Event Handling ─────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Agent registration
  socket.on('register_agent', ({ agentName }) => {
    connectedAgents.set(socket.id, {
      agentName,
      connectedAt: new Date().toISOString(),
    });
    console.log(`👤 Agent registered: ${agentName} (${socket.id})`);

    // Send the current state to the newly connected client
    const ticketList = Array.from(tickets.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const locks = {};
    lockMap.forEach((value, key) => {
      locks[key] = { agentName: value.agentName, lockedAt: value.lockedAt };
    });

    socket.emit('initial_state', { tickets: ticketList, locks });

    // Broadcast updated agent count
    io.emit('agents_online', connectedAgents.size);
  });

  // ─── Lock Ticket ────────────────────────────────────────────────
  socket.on('lock_ticket', ({ ticketId, agentName }) => {
    // Check if ticket is already locked
    if (lockMap.has(ticketId)) {
      const existingLock = lockMap.get(ticketId);
      socket.emit('lock_denied', {
        ticketId,
        lockedBy: existingLock.agentName,
      });
      return;
    }

    // Acquire lock
    const lockInfo = {
      agentName,
      socketId: socket.id,
      lockedAt: new Date().toISOString(),
    };
    lockMap.set(ticketId, lockInfo);

    console.log(`🔒 Ticket ${ticketId} locked by ${agentName}`);

    // Broadcast lock to ALL clients (including the requester for confirmation)
    io.emit('ticket_locked', {
      ticketId,
      agentName,
      lockedAt: lockInfo.lockedAt,
    });
  });

  // ─── Unlock Ticket ──────────────────────────────────────────────
  socket.on('unlock_ticket', ({ ticketId }) => {
    const lockInfo = lockMap.get(ticketId);

    // Only the agent holding the lock (same socket) can unlock
    if (lockInfo && lockInfo.socketId === socket.id) {
      lockMap.delete(ticketId);
      console.log(`🔓 Ticket ${ticketId} unlocked by ${lockInfo.agentName}`);

      io.emit('ticket_unlocked', { ticketId });
    }
  });

  // ─── Ghost Disconnect Handler ───────────────────────────────────
  socket.on('disconnect', (reason) => {
    const agent = connectedAgents.get(socket.id);
    const agentName = agent ? agent.agentName : 'Unknown';

    console.log(`❌ Socket disconnected: ${agentName} (${socket.id}) — Reason: ${reason}`);

    // Find and release ALL locks held by this socket
    const ticketsToUnlock = [];
    lockMap.forEach((value, key) => {
      if (value.socketId === socket.id) {
        ticketsToUnlock.push(key);
      }
    });

    ticketsToUnlock.forEach((ticketId) => {
      lockMap.delete(ticketId);
      console.log(`👻 Ghost unlock: Ticket ${ticketId} (was locked by ${agentName})`);
      io.emit('ticket_unlocked', { ticketId });
    });

    // Remove from connected agents
    connectedAgents.delete(socket.id);
    io.emit('agents_online', connectedAgents.size);
  });
});

// ─── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Live Ops Helpdesk Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`📋 ${tickets.size} seed tickets loaded\n`);
});
