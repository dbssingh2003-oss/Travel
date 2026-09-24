/**
 * Notification Service
 *
 * Stub implementation that logs to console in development.
 * Set EMAIL_PROVIDER=ses or SMS_PROVIDER=twilio in .env for production.
 */

interface NotificationPayload {
  to: string;
  subject?: string;
  body: string;
  channel: "email" | "sms" | "push";
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const provider =
    payload.channel === "email"
      ? process.env.EMAIL_PROVIDER || "console"
      : process.env.SMS_PROVIDER || "console";

  if (provider === "console" || process.env.NODE_ENV === "development") {
    console.log(
      `[Notification][${payload.channel.toUpperCase()}] To: ${payload.to} | ${payload.subject ?? ""} | ${payload.body}`
    );
    return;
  }

  // TODO: plug in SES/Twilio/FCM based on provider env var
  console.warn(`[Notification] Provider "${provider}" not implemented yet.`);
}
