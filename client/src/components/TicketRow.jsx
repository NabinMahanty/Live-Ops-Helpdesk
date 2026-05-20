"use client";

import { useSocket } from "@/context/SocketContext";
import { Lock, Edit, Building, Clock, CheckCircle } from "./Icons";
import styles from "./TicketRow.module.css";

const priorityConfig = {
  critical: { label: "CRITICAL", color: "var(--status-open)", bg: "var(--status-open-bg)", border: "var(--status-open-border)" },
  high: { label: "HIGH", color: "var(--status-locked)", bg: "var(--status-locked-bg)", border: "var(--status-locked-border)" },
  medium: { label: "MEDIUM", color: "var(--status-low)", bg: "var(--status-low-bg)", border: "var(--status-low-border)" },
  low: { label: "LOW", color: "var(--status-resolved)", bg: "var(--status-resolved-bg)", border: "var(--status-resolved-border)" },
};

export default function TicketRow({ ticket, onEdit }) {
  const { locks, agentName, lockTicket } = useSocket();
  const lock = locks[ticket.id];
  const isLocked = !!lock;
  const isMyLock = isLocked && lock.agentName === agentName;
  const pri = priorityConfig[ticket.priority] || priorityConfig.medium;

  const handleEdit = () => {
    if (isLocked && !isMyLock) return;
    lockTicket(ticket.id);
    onEdit(ticket);
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`${styles.row} ${isLocked && !isMyLock ? styles.locked : ""} ${isMyLock ? styles.myLock : ""}`} id={`ticket-row-${ticket.id}`}>
      <div className={styles.left}>
        <div className={styles.titleLine}>
          {isLocked && !isMyLock && <Lock className={styles.lockIcon} />}
          {isMyLock && <Edit className={styles.myLockIcon} />}
          <h3 className={styles.title}>{ticket.title}</h3>
        </div>
        <div className={styles.meta}>
          <span className={styles.customer}>
            <Building className={styles.metaIcon} />
            <span>{ticket.customer}</span>
          </span>
          <span className={styles.time}>
            <Clock className={styles.metaIcon} />
            <span>{timeAgo(ticket.createdAt)}</span>
          </span>
          {ticket.status === "resolved" && (
            <span className={styles.resolved}>
              <CheckCircle className={styles.resolvedIcon} />
              <span>Resolved</span>
            </span>
          )}
        </div>
        {isLocked && !isMyLock && (
          <div className={styles.lockedBy}>
            Locked by <strong>{lock.agentName}</strong>
          </div>
        )}
      </div>
      <div className={styles.right}>
        <span className={styles.priority} style={{ color: pri.color, background: pri.bg, border: `1px solid ${pri.border}` }}>
          {pri.label}
        </span>
        <button
          className={`${styles.editBtn} ${isLocked && !isMyLock ? styles.disabled : ""}`}
          onClick={handleEdit}
          disabled={isLocked && !isMyLock}
          id={`edit-btn-${ticket.id}`}
        >
          {isLocked && !isMyLock ? "Locked" : "Open Ticket"}
        </button>
      </div>
    </div>
  );
}
