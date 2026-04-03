/**
 * Draftly Cold Email Campaign
 * Sends personalized emails to photographers about Draftly
 */

import nodemailer from "nodemailer";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

// Config
const GMAIL = "hello.draftly@gmail.com";
const APP_PASSWORD = "vyal ozae rkuc dlsp";
const DELAY_MS = 8000; // 8s between emails (avoid rate limits)
const SENT_LOG = "./scripts/sent.json";

// Email template
function buildEmail(photographer) {
  const { name, business, city, niche } = photographer;
  const nicheLabel = niche === "wedding" ? "wedding" : "portrait";

  return {
    subject: `Writing proposals is eating your weekends, ${name}`,
    html: `
<div style="font-family: -apple-system, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
  <p>Hi ${name},</p>

  <p>I came across ${business} — your ${nicheLabel} work in ${city} looks beautiful.</p>

  <p>Quick question: how long does it take you to write a client proposal? For most photographers I've talked to, it's 2–4 hours per inquiry. During peak ${niche === "wedding" ? "wedding" : "portrait"} season, that turns into a part-time job.</p>

  <p>I built <strong>Draftly</strong> to fix this — it generates a professional, personalized photography proposal in under 60 seconds. You paste the client's inquiry (or fill 5 fields), and it writes the whole thing: pricing, packages, timeline, booking terms, your tone.</p>

  <p>We're in early access and giving photographers <strong>3 free proposals</strong> to try it with no credit card.</p>

  <p style="margin: 24px 0;">
    <a href="https://draftly-kappa.vercel.app?ref=email&src=${encodeURIComponent(city.toLowerCase())}"
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
    `.trim(),
  };
}

async function loadSentLog() {
  if (!existsSync(SENT_LOG)) return new Set();
  const raw = await readFile(SENT_LOG, "utf-8");
  const arr = JSON.parse(raw);
  return new Set(arr);
}

async function saveSentLog(sentSet) {
  await writeFile(SENT_LOG, JSON.stringify([...sentSet], null, 2));
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // Load photographer list
  const photographers = JSON.parse(
    await readFile("./scripts/photographers.json", "utf-8")
  );

  // Load sent log (avoid duplicates)
  const sent = await loadSentLog();
  console.log(`Already sent: ${sent.size} | Queue: ${photographers.length}`);

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL,
      pass: APP_PASSWORD,
    },
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log("✓ Gmail connection verified\n");
  } catch (err) {
    console.error("✗ Gmail auth failed:", err.message);
    process.exit(1);
  }

  let successCount = 0;
  let skipCount = 0;

  for (const photographer of photographers) {
    const { email, name } = photographer;

    if (sent.has(email)) {
      console.log(`  skip (already sent): ${email}`);
      skipCount++;
      continue;
    }

    const { subject, html } = buildEmail(photographer);

    try {
      await transporter.sendMail({
        from: `"Alex at Draftly" <${GMAIL}>`,
        to: email,
        subject,
        html,
      });

      sent.add(email);
      await saveSentLog(sent);
      successCount++;
      console.log(`✓ [${successCount}] Sent to ${name} <${email}>`);
    } catch (err) {
      console.error(`✗ Failed to send to ${email}: ${err.message}`);
    }

    // Delay between sends
    if (successCount < photographers.length) {
      process.stdout.write(`  waiting ${DELAY_MS / 1000}s...`);
      await sleep(DELAY_MS);
      process.stdout.write(" done\n");
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Sent: ${successCount} | Skipped: ${skipCount}`);
  transporter.close();
}

main().catch(console.error);
