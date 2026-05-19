"use client";
import { useState } from "react";
import styles from "./AgentLogin.module.css";

export default function AgentLogin({ onLogin }) {
  const [name, setName] = useState("");

  const agents = [
    { name: "Agent Sarah", avatar: "👩‍💼" },
    { name: "Agent Marcus", avatar: "👨‍💼" },
    { name: "Agent Priya", avatar: "👩‍🔧" },
    { name: "Agent Jake", avatar: "👨‍🔧" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onLogin(name.trim());
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🚛</span>
          <h1 className={styles.title}>RapidDispatch</h1>
          <p className={styles.subtitle}>Live Ops Helpdesk</p>
        </div>
        <div className={styles.quickPick}>
          <p className={styles.label}>Quick Login</p>
          <div className={styles.agents}>
            {agents.map((a) => (
              <button key={a.name} className={styles.agentBtn} onClick={() => onLogin(a.name)} id={`login-${a.name.replace(/\s/g, '-').toLowerCase()}`}>
                <span className={styles.avatar}>{a.avatar}</span>
                <span className={styles.agentName}>{a.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.divider}><span>or enter name</span></div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your agent name..." className={styles.input} id="agent-name-input" autoFocus />
          <button type="submit" className={styles.submit} disabled={!name.trim()} id="agent-login-submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}
