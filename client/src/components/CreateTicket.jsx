"use client";
import { useState } from "react";
import styles from "./TicketEditor.module.css";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

export default function CreateTicket({ onClose }) {
  const [form, setForm] = useState({ title: "", customer: "", priority: "medium", description: "" });
  const [saving, setSaving] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.customer.trim()) return;
    setSaving(true);
    try {
      await fetch(`${SERVER_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onClose();
    } catch (err) {
      console.error("Create failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="create-ticket-modal">
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Create New Ticket</h2>
            <p className={styles.sub}>This will appear instantly for all agents</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.resSection}>
            <label htmlFor="create-title">Title</label>
            <input id="create-title" className={styles.textarea} style={{ minHeight: "auto", resize: "none" }} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Truck #4421 — Engine Failure" required />
          </div>
          <div className={styles.resSection}>
            <label htmlFor="create-customer">Customer</label>
            <input id="create-customer" className={styles.textarea} style={{ minHeight: "auto", resize: "none" }} value={form.customer} onChange={(e) => update("customer", e.target.value)} placeholder="e.g. Walmart Distribution Center" required />
          </div>
          <div className={styles.resSection}>
            <label htmlFor="create-priority">Priority</label>
            <select id="create-priority" className={styles.textarea} style={{ minHeight: "auto" }} value={form.priority} onChange={(e) => update("priority", e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className={styles.resSection}>
            <label htmlFor="create-desc">Description</label>
            <textarea id="create-desc" className={styles.textarea} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the issue..." rows={4} />
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving || !form.title.trim() || !form.customer.trim()} id="submit-new-ticket">
              {saving ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
