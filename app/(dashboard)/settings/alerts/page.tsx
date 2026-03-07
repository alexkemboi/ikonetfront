import AlertsClient from "./_components/AlertsClient";

export const metadata = { title: "Alert Channels — Beesmart" };

// ── Static mock providers (replace with API fetch when ready) ──────────
const MOCK_PROVIDERS = [
  {
    idxno:        1,
    channel:      "EMAIL",
    providerName: "Gmail SMTP",
    apiUrl:       "smtp.gmail.com",
    apiKey:       "alerts@beesmart.co.ke",
    senderId:     "587",
    fromEmail:    "alerts@beesmart.co.ke",
    fromName:     "Beesmart IBS",
    isActive:     true,
    createdAt:    "2026-03-07T21:17:56.086854",
  },
];

// ── Active channels (replace with API fetch when ready) ───────────────
const ACTIVE_CHANNELS: string[] = ["EMAIL"];

export default function AlertsPage() {
  return (
    <div className="p-6">
      <AlertsClient providers={MOCK_PROVIDERS} activeChannels={ACTIVE_CHANNELS} />
    </div>
  );
}
