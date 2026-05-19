import "./globals.css";

export const metadata = {
  title: "Live Ops Helpdesk — RapidDispatch Freight & Logistics",
  description: "Real-time collaborative support ticket management for RapidDispatch freight operations. Instant ticket locking, presence awareness, and live state synchronization.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
