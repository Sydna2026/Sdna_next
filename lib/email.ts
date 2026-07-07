import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "SDAN <news@sydan.org>";

// Lazily create the client only if a key is configured. Without a key the app
// still works — emails are logged to the server console instead of sent, which
// is handy in development and prevents subscribe requests from failing.
const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — would send to ${to}: "${subject}"`,
    );
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

const BRAND = "#A08C8A";
const INK = "#4A4A4A";

function shell(title: string, body: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F9ECE4;padding:32px 0;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5D5CD;">
      <div style="background:${INK};padding:24px 32px;">
        <h1 style="margin:0;color:#F9ECE4;font-size:18px;letter-spacing:1px;">Syrian Dental Academic Network</h1>
      </div>
      <div style="padding:32px;color:${INK};">
        <h2 style="margin:0 0 16px;font-size:20px;color:${INK};">${title}</h2>
        ${body}
      </div>
      <div style="padding:16px 32px;background:#F9ECE4;color:#8b8b8b;font-size:12px;">
        You received this because you subscribed on sydan.org.
      </div>
    </div>
  </div>`;
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:bold;letter-spacing:.5px;">${label}</a>`;
}

export async function sendConfirmationEmail(args: {
  to: string;
  name?: string | null;
  specializationTitle: string;
  confirmUrl: string;
}): Promise<void> {
  const hi = args.name ? `Hi ${escapeHtml(args.name)},` : "Hi,";
  const body = `
    <p style="line-height:1.6;">${hi}</p>
    <p style="line-height:1.6;">Please confirm your subscription to <strong>${escapeHtml(
      args.specializationTitle,
    )}</strong> updates. We'll email you when new research articles are published.</p>
    <p style="margin:28px 0;">${button(args.confirmUrl, "Confirm subscription")}</p>
    <p style="line-height:1.6;font-size:13px;color:#8b8b8b;">If you didn't request this, you can ignore this email.</p>`;
  await sendEmail({
    to: args.to,
    subject: `Confirm your ${args.specializationTitle} subscription`,
    html: shell("Confirm your subscription", body),
  });
}

export async function sendWelcomeEmail(args: {
  to: string;
  name?: string | null;
  specializationTitle: string;
  unsubscribeUrl: string;
}): Promise<void> {
  const hi = args.name ? `Hi ${escapeHtml(args.name)},` : "Hi,";
  const body = `
    <p style="line-height:1.6;">${hi}</p>
    <p style="line-height:1.6;">You're subscribed to <strong>${escapeHtml(
      args.specializationTitle,
    )}</strong> updates. We'll notify you as new research articles appear.</p>
    <p style="line-height:1.6;font-size:13px;color:#8b8b8b;margin-top:28px;">
      Don't want these? <a href="${args.unsubscribeUrl}" style="color:${BRAND};">Unsubscribe</a>.
    </p>`;
  await sendEmail({
    to: args.to,
    subject: `You're subscribed to ${args.specializationTitle}`,
    html: shell("Subscription confirmed", body),
  });
}

export async function sendArticlesEmail(args: {
  to: string;
  name?: string | null;
  specializationTitle: string;
  articles: { title: string; link: string; publishedAt?: Date | null }[];
  unsubscribeUrl: string;
}): Promise<void> {
  const hi = args.name ? `Hi ${escapeHtml(args.name)},` : "Hi,";
  const items = args.articles
    .map((a) => {
      const date = a.publishedAt
        ? `<span style="color:#8b8b8b;font-size:12px;"> — ${a.publishedAt.toISOString().slice(0, 10)}</span>`
        : "";
      return `<li style="margin:0 0 12px;line-height:1.5;">
        <a href="${a.link}" style="color:${BRAND};font-weight:bold;text-decoration:none;">${escapeHtml(
          a.title,
        )}</a>${date}
      </li>`;
    })
    .join("");
  const count = args.articles.length;
  const body = `
    <p style="line-height:1.6;">${hi}</p>
    <p style="line-height:1.6;">${count} new ${count === 1 ? "article" : "articles"} in <strong>${escapeHtml(
      args.specializationTitle,
    )}</strong>:</p>
    <ul style="padding-left:18px;margin:20px 0;">${items}</ul>
    <p style="line-height:1.6;font-size:13px;color:#8b8b8b;margin-top:28px;">
      <a href="${args.unsubscribeUrl}" style="color:${BRAND};">Unsubscribe</a> from ${escapeHtml(
        args.specializationTitle,
      )} updates.
    </p>`;
  await sendEmail({
    to: args.to,
    subject: `${count} new ${args.specializationTitle} ${count === 1 ? "article" : "articles"}`,
    html: shell(`New ${args.specializationTitle} research`, body),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
