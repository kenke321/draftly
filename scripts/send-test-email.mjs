/**
 * Send a test email to yourself first
 * Lets you verify email formatting and link before real campaign
 */

import nodemailer from "nodemailer";

const GMAIL = "hello.draftly@gmail.com";
const APP_PASSWORD = "vyal ozae rkuc dlsp";

const TEST_RECIPIENT = "hello.draftly@gmail.com"; // send to self

const html = `
<div style="font-family: -apple-system, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
  <p>Hi Sarah,</p>

  <p>I came across Sarah Chen Photography — your wedding work in Austin looks beautiful.</p>

  <p>Quick question: how long does it take you to write a client proposal? For most photographers I've talked to, it's 2–4 hours per inquiry. During peak wedding season, that turns into a part-time job.</p>

  <p>I built <strong>Draftly</strong> to fix this — it generates a professional, personalized photography proposal in under 60 seconds. You paste the client's inquiry (or fill 5 fields), and it writes the whole thing: pricing, packages, timeline, booking terms, your tone.</p>

  <p>We're in early access and giving photographers <strong>3 free proposals</strong> to try it with no credit card.</p>

  <p style="margin: 24px 0;">
    <a href="https://draftly-kappa.vercel.app?ref=email&src=austin"
       style="background:#f59e0b;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
      Try Draftly Free →
    </a>
  </p>

  <p>If it's not useful, takes 10 seconds to unsubscribe. No hard feelings.</p>

  <p>
    Alex<br>
    <span style="color:#888;font-size:13px;">Draftly — Proposals for photographers</span><br>
    <a href="https://draftly-kappa.vercel.app" style="color:#f59e0b;font-size:13px;">draftly-kappa.vercel.app</a>
  </p>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#aaa;font-size:11px;">
    You're receiving this because your contact info is publicly listed on your photography website.<br>
    <a href="mailto:hello.draftly@gmail.com?subject=unsubscribe" style="color:#aaa;">Unsubscribe</a>
  </p>
</div>
`.trim();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL, pass: APP_PASSWORD },
});

try {
  await transporter.verify();
  console.log("✓ Gmail auth OK");

  const info = await transporter.sendMail({
    from: `"Alex at Draftly" <${GMAIL}>`,
    to: TEST_RECIPIENT,
    subject: "Writing proposals is eating your weekends, Sarah [TEST PREVIEW]",
    html,
  });

  console.log(`✓ Test email sent! Message ID: ${info.messageId}`);
  console.log(`\n→ Check your inbox: ${TEST_RECIPIENT}`);
  console.log("  Verify:");
  console.log("  1. Email looks professional");
  console.log('  2. "Try Draftly Free →" button is visible');
  console.log("  3. Link opens draftly-kappa.vercel.app (use VPN if needed)");
} catch (err) {
  console.error("✗ Failed:", err.message);
}

transporter.close();
