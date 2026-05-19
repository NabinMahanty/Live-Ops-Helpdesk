"use client";
import { useState } from "react";
import { SocketProvider } from "@/context/SocketContext";
import AgentLogin from "@/components/AgentLogin";
import TicketBoard from "@/components/TicketBoard";
import ConnectionBanner from "@/components/ConnectionBanner";

export default function Home() {
  const [agentName, setAgentName] = useState(null);

  if (!agentName) {
    return <AgentLogin onLogin={setAgentName} />;
  }

  return (
    <SocketProvider agentName={agentName}>
      <ConnectionBanner />
      <TicketBoard />
    </SocketProvider>
  );
}
