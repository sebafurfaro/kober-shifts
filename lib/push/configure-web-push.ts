import webpush from "web-push";

let configured = false;

/** Configura VAPID una vez por proceso (API routes / server actions). */
export function ensureWebPushConfigured(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:dev@localhost";
  if (!publicKey || !privateKey) {
    throw new Error("Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY en el entorno.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export { webpush };
