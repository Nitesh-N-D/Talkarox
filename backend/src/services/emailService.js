import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Brevo's free tier lets you send from a verified sender email address
 * (your own Gmail/Outlook address works) without owning a custom domain —
 * unlike Resend, which requires DNS verification of a domain you own.
 * Sign up free at https://www.brevo.com, verify your sender email under
 * Senders & IP > Senders, then grab an API key under SMTP & API > API Keys.
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set — skipping email send. Would have sent:', { to, subject });
    return { skipped: true };
  }

  try {
    const { data } = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: 'Talkarox', email: process.env.SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return data;
  } catch (err) {
    console.error('[email] Failed to send:', err.response?.data || err.message);
    throw err;
  }
}

export async function sendVerificationEmail(to, name, token) {
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return sendEmail({
    to,
    subject: 'Verify your Talkarox account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0F172A;">Welcome to Talkarox, ${name}!</h2>
        <p style="color: #6B7280;">Click below to verify your email and finish setting up your account.</p>
        <a href="${link}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify email</a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">If you didn't create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to, token) {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: 'Reset your Talkarox password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0F172A;">Reset your password</h2>
        <p style="color: #6B7280;">Click below to set a new password. This link expires in 1 hour.</p>
        <a href="${link}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset password</a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendAppointmentConfirmedEmail(to, name, scheduledAt, meetingUrl) {
  return sendEmail({
    to,
    subject: 'Your meeting on Talkarox is confirmed',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0F172A;">Meeting confirmed</h2>
        <p style="color: #6B7280;">Your meeting with ${name} is confirmed for ${new Date(scheduledAt).toLocaleString()}.</p>
        <a href="${meetingUrl}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join meeting</a>
      </div>
    `,
  });
}

export async function sendEmergencyBroadcastEmail(to, title, message) {
  return sendEmail({
    to,
    subject: `🚨 ${title}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 2px solid #EF4444; border-radius: 8px;">
        <h2 style="color: #EF4444;">${title}</h2>
        <p style="color: #1F2937;">${message}</p>
      </div>
    `,
  });
}

export async function sendStaffInviteEmail(to, schoolName, inviteLink) {
  return sendEmail({
    to,
    subject: `You're invited to join ${schoolName} on Talkarox`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0F172A;">You've been invited to ${schoolName}</h2>
        <p style="color: #6B7280;">Join your school's communication platform on Talkarox — no personal phone numbers, AI-organized messages, and built-in scheduling.</p>
        <a href="${inviteLink}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Accept invitation</a>
      </div>
    `,
  });
}

export function isEmailConfigured() {
  return Boolean(process.env.BREVO_API_KEY);
}

export default { sendVerificationEmail, sendPasswordResetEmail, sendAppointmentConfirmedEmail, sendEmergencyBroadcastEmail, sendStaffInviteEmail, isEmailConfigured };
