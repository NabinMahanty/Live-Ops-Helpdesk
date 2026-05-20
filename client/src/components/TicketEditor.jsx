"use client";

import { useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { Building } from "./Icons";
import styles from "./TicketEditor.module.css";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

export default function TicketEditor({ ticket, onClose }) {
  const { unlockTicket, agentName } = useSocket();
  const [resolution, setResolution] = useState(ticket.resolution || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${SERVER_URL}/api/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, status: resolution.trim() ? "resolved" : "open" }),
      });
      setSaved(true);
      setTimeout(() => {
        unlockTicket(ticket.id);
        onClose();
      }, 800);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    unlockTicket(ticket.id);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="ticket-editor-modal">
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{ticket.title}</h2>
            <p className={styles.sub}>
              Editing as <strong className={styles.agentHighlight}>{agentName}</strong>
            </p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} id="close-editor-btn">
            &times;
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.details}>
            <div className={styles.field}>
              <label>Customer</label>
              <span className={styles.fieldVal}>
                <Building className={styles.fieldIcon} /> {ticket.customer}
              </span>
            </div>
            <div className={styles.field}>
              <label>Priority</label>
              <span className={`${styles.priorityBadge} ${styles[ticket.priority]}`}>
                {ticket.priority.toUpperCase()}
              </span>
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <span className={`${styles.statusBadge} ${ticket.status === "resolved" ? styles.statusResolved : styles.statusOpen}`}>
                <span className={styles.statusDot}></span>
                {ticket.status === "resolved" ? "Resolved" : "Open"}
              </span>
            </div>
          </div>
          <div className={styles.descSection}>
            <label>Description</label>
            <p className={styles.desc}>{ticket.description}</p>
          </div>
          <div className={styles.resSection}>
            <label htmlFor="resolution-textarea">Resolution Update</label>
            <textarea
              id="resolution-textarea"
              className={styles.textarea}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Provide a clear description of the resolution..."
              rows={5}
              autoFocus
            />
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={handleClose} id="cancel-editor-btn">
            Cancel
          </button>
          <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ""}`} onClick={handleSave} disabled={saving || saved} id="save-editor-btn">
            {saved ? "Saved Successfully" : saving ? "Saving..." : "Save Resolution"}
          </button>
        </div>
      </div>
    </div>
  );
}
