import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// In-memory OTP store: email -> { otp, expires }
// NOTE: This works per-serverless-instance. For production, use Redis/Firestore.
const otpStore = new Map<string, { otp: string; expires: number }>();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sender address:
//  - Use 'onboarding@resend.dev' for testing (no domain verification needed)
//  - Set RESEND_FROM_EMAIL=noreply@yourdomain.com once your domain is verified in Resend
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = 'ArchRevenue';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { action, email, otp: submittedOtp } = req.body || {};

    if (action === 'send') {
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const otp = generateOtp();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(email.toLowerCase(), { otp, expires });

      console.log(`[OTP] ${email} → ${otp}`);

      if (resend) {
        // Send real email via Resend
        const { error } = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [email],
          subject: 'Your ArchRevenue verification code',
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">ArchRevenue</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;">Email Verification</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:600;color:#ffffff;line-height:1.2;">Your verification code</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#a1a1aa;line-height:1.6;">Use the code below to verify your email and complete your ArchRevenue account setup. This code expires in <strong style="color:#ffffff;">10 minutes</strong>.</p>
              <!-- OTP Box -->
              <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;">
                <span style="font-size:40px;font-weight:700;letter-spacing:0.25em;color:#818cf8;font-family:'Courier New',monospace;">${otp}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#52525b;line-height:1.6;">If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#3f3f46;">© ${new Date().getFullYear()} ArchRevenue · Sent to ${email}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });

        if (error) {
          console.error('[Resend error]', JSON.stringify(error));
          const msg = (error as any)?.message || (error as any)?.name || 'Failed to send OTP email.';
          return res.status(500).json({ error: `Email error: ${msg}` });
        }

        return res.status(200).json({ success: true, message: 'OTP sent to your email.' });
      }

      // No email provider — dev mode: return OTP in response so the UI toast can show it
      return res.status(200).json({
        success: true,
        message: 'OTP generated (dev mode — no email provider configured).',
        devOtp: otp,
      });
    }

    if (action === 'verify') {
      if (!email || !submittedOtp) {
        return res.status(400).json({ error: 'Email and OTP are required.' });
      }

      const record = otpStore.get(email.toLowerCase());

      if (!record) {
        return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
      }

      if (Date.now() > record.expires) {
        otpStore.delete(email.toLowerCase());
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }

      if (record.otp !== submittedOtp.toString()) {
        return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
      }

      // OTP verified — remove it from store
      otpStore.delete(email.toLowerCase());
      return res.status(200).json({ success: true, message: 'OTP verified.' });
    }

    return res.status(400).json({ error: 'Invalid action. Use "send" or "verify".' });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
