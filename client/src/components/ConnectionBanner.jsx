"use client";

import { useSocket } from "@/context/SocketContext";
import { AlertTriangle } from "./Icons";
import styles from "./ConnectionBanner.module.css";

export default function ConnectionBanner() {
  const { connected } = useSocket();

  if (connected) return null;

  return (
    <div className={styles.banner} role="alert" id="connection-banner">
      <div className={styles.inner}>
        <AlertTriangle className={styles.warningIcon} />
        <span className={styles.pulse}></span>
        <span className={styles.text}>
          Connection Lost: Reconnecting<span className={styles.dots}>...</span>
        </span>
        <span className={styles.sub}>Your changes may not save until connection is restored.</span>
      </div>
    </div>
  );
}
