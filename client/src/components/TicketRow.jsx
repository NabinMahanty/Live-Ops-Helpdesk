"use client";
import { useSocket } from "@/context/SocketContext";
import styles from "./TicketRow.module.css";

const priorityConfig = {
  critical: { label: "CRITICAL", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high: { label: "HIGH", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  medium: { label: "MEDIUM", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  low: { label: "LOW", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
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
          {isLocked && !isMyLock && <span className={styles.lockIcon}>🔒</span>}
          {isMyLock && <span className={styles.lockIcon}>✏️</span>}
          <h3 className={styles.title}>{ticket.title}</h3>
        </div>
        <div className={styles.meta}>
          <span className={styles.customer}>🏢 {ticket.customer}</span>
          <span className={styles.time}>🕐 {timeAgo(ticket.createdAt)}</span>
          {ticket.status === "resolved" && <span className={styles.resolved}>✅ Resolved</span>}
        </div>
        {isLocked && !isMyLock && (
          <div className={styles.lockedBy}>
            Locked by <strong>{lock.agentName}</strong>
          </div>
        )}
      </div>
      <div className={styles.right}>
        <span className={styles.priority} style={{ color: pri.color, background: pri.bg }}>
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
