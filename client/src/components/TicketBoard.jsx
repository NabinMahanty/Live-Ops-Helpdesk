"use client";

import { useState } from "react";
import { useSocket } from "@/context/SocketContext";
import TicketRow from "./TicketRow";
import TicketEditor from "./TicketEditor";
import CreateTicket from "./CreateTicket";
import { Logo, Users, Clipboard, Lock, CheckCircle, AlertCircle, Plus, Inbox } from "./Icons";
import styles from "./TicketBoard.module.css";

export default function TicketBoard() {
  const { tickets, locks, agentsOnline, connected, agentName } = useSocket();
  const [editingTicket, setEditingTicket] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all");

  const filtered = tickets.filter((t) => {
    if (filter === "open") return t.status === "open";
    if (filter === "resolved") return t.status === "resolved";
    if (filter === "locked") return !!locks[t.id];
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    locked: Object.keys(locks).length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.logo}>
            <Logo className={styles.logoIcon} />
            <span>RapidDispatch</span>
            <span className={styles.accent}>Live Ops</span>
          </h1>
          <p className={styles.welcome}>
            Logged in as <strong className={styles.welcomeName}>{agentName}</strong>
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.status}>
            <span className={`${styles.dot} ${connected ? styles.online : styles.offline}`}></span>
            <span className={styles.statusText}>{connected ? "Operational" : "Offline"}</span>
          </div>
          <div className={styles.agentCount}>
            <Users className={styles.agentCountIcon} />
            <span>
              <strong>{agentsOnline}</strong> agent{agentsOnline !== 1 ? "s" : ""} online
            </span>
          </div>
        </div>
      </header>

      <div className={styles.statsBar}>
        {[
          { label: "Total", value: stats.total, icon: <Clipboard className={styles.statIconSvg} /> },
          { label: "Open", value: stats.open, icon: <AlertCircle className={`${styles.statIconSvg} ${styles.statOpen}`} /> },
          { label: "Locked", value: stats.locked, icon: <Lock className={`${styles.statIconSvg} ${styles.statLocked}`} /> },
          { label: "Resolved", value: stats.resolved, icon: <CheckCircle className={`${styles.statIconSvg} ${styles.statResolved}`} /> },
        ].map((s) => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statIconContainer}>{s.icon}</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {["all", "open", "locked", "resolved"].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
              onClick={() => setFilter(f)}
              id={`filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)} id="create-ticket-btn">
          <Plus className={styles.createBtnIcon} />
          <span>New Ticket</span>
        </button>
      </div>

      <div className={styles.list} id="ticket-list">
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Inbox className={styles.emptyIcon} />
            <p className={styles.emptyText}>No tickets match this filter</p>
          </div>
        ) : (
          filtered.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onEdit={setEditingTicket} />
          ))
        )}
      </div>

      {editingTicket && (
        <TicketEditor ticket={editingTicket} onClose={() => setEditingTicket(null)} />
      )}
      {showCreate && <CreateTicket onClose={() => setShowCreate(false)} />}
    </div>
  );
}
