/**
 * Scrape real wedding photographer emails via Bing search
 * Designed to run on US servers (GitHub Actions) where Bing is unrestricted
 *
 * Strategy: Search Bing for "wedding photographer {city} {state}" →
 *           filter real photographer websites → extract contact emails
 */

import puppeteer from "puppeteer";
import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";

const OUTPUT = "./scripts/photographers.json";
const EMAIL_RE = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;

const MARKETS = [
  { city: "Austin",      state: "TX" },
  { city: "Nashville",   state: "TN" },
  { city: "Denver",      state: "CO" },
  { city: "Seattle",     state: "WA" },
  { city: "Portland",    state: "OR" },
  { city: "Charlotte",   state: "NC" },
  { city: "Dallas",      state: "TX" },
  { city: "Phoenix",     state: "AZ" },
  { city: "Atlanta",     state: "GA" },
  { city: "Chicago",     state: "IL" },
  { city: "Boston",      state: "MA" },
  { city: "San Diego",   state: "CA" },
  { city: "Minneapolis", state: "MN" },
  { city: "Tampa",       state: "FL" },
  { city: "Raleigh",     state: "NC" },
];

const SKIP_EMAIL_RE = /example\.|test@|noreply|no-reply|admin@|webmaster|@2x|\.png|\.jpg|\.gif|sentry|googleapis|gstatic|cloudflare|schema\.org|w3\.org|theknotww|theknot/i;
const SKIP_DOMAINS = new Set([
  "bing.com","google.com","theknot.com","weddingwire.com","yelp.com",
  "facebook.com","instagram.com","pinterest.com","thumbtack.com","expertise.com",
  "reddit.com","youtube.com","zola.com","squarespace.com","wix.com","wordpress.com",
  "x.com","twitter.com","tiktok.com","linkedin.com","houzz.com","bark.com",
  "styleseat.com","gigsalad.com","wedding.com","mywedding.com","brides.com",
]);

function isValidEmail(email) {
  if (email.length > 70 || email.length < 6) return false;
  if (SKIP_EMAIL_RE.test(email)) return false;
  if (!email.match(/\.(com|net|org|co|photography|photo|pics|studio|me|us|biz|io)$/i)) return false;
  if (email.includes("..")) return false;
  return true;
}

function getDomain(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

function shouldSkip(url) {
  const d = getDomain(url);
  return !d || [...SKIP_DOMAINS].some(s => d === s || d.endsWith("." + s));
}

// Decode Bing redirect URL (u=a1{base64} format)
function decodeBingUrl(href) {
  try {
    const u = new URL(href).searchParams.get("u");
    if (!u) return href;
    const b64 = u.replace(/^a1/, "");
    const decoded = Buffer.from(b64, "base64").toString();
    return decoded.startsWith("http") ? decoded : href;
  } catch { return href; }
}

async function searchBingForPhotographers(page, city, state, pageNum = 0) {
  const queries = [
    `wedding photographer ${city} ${state} contact email`,
    `"wedding photography" ${city} ${state} site contact`,
    `best wedding photographers ${city} ${state}`,
  ];
  const query = queries[pageNum % queries.length];
  const first = pageNum * 10;

  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en&cc=US&first=${first}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));

    // Get all result links (both redirect and direct)
    const allHrefs = await page.$$eval("li.b_algo a[href], #b_results a[href]", els =>
      els.map(el => el.href).filter(h => h && h.startsWith("http"))
    );

    const realUrls = [];
    for (const href of allHrefs) {
      const url = href.includes("bing.com/ck/a") ? decodeBingUrl(href) : href;
      if (url && url.startsWith("http") && !shouldSkip(url)) {
        realUrls.push(url);
      }
    }

    return [...new Set(realUrls)].slice(0, 8);
  } catch (e) {
    console.error(`  Bing search error: ${e.message}`);
    return [];
  }
}

async function extractEmailFromSite(browser, siteUrl) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  const emails = new Set();
  try {
    await page.goto(siteUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

    // mailto links first (most reliable)
    const mailtos = await page.$$eval("a[href^='mailto:']", els =>
      els.map(el => el.href.replace("mailto:", "").split("?")[0].toLowerCase())
    ).catch(() => []);
    mailtos.filter(isValidEmail).forEach(e => emails.add(e));

    // page text scan
    if (emails.size === 0) {
      const text = await page.evaluate(() => document.body?.innerText || "").catch(() => "");
      (text.match(EMAIL_RE) || []).map(e => e.toLowerCase()).filter(isValidEmail).forEach(e => emails.add(e));
    }

    // Try contact page if still no email
    if (emails.size === 0) {
      const contactHref = await page.$eval(
        "a[href*='contact' i], a[href*='about' i]",
        el => el.href
      ).catch(() => null);

      if (contactHref && getDomain(contactHref) === getDomain(siteUrl)) {
        await page.goto(contactHref, { waitUntil: "domcontentloaded", timeout: 10000 });
        const m = await page.$$eval("a[href^='mailto:']", els =>
          els.map(el => el.href.replace("mailto:", "").split("?")[0].toLowerCase())
        ).catch(() => []);
        m.filter(isValidEmail).forEach(e => emails.add(e));
        if (emails.size === 0) {
          const t = await page.evaluate(() => document.body?.innerText || "").catch(() => "");
          (t.match(EMAIL_RE) || []).map(e => e.toLowerCase()).filter(isValidEmail).forEach(e => emails.add(e));
        }
      }
    }
  } catch { } finally {
    await page.close().catch(() => {});
  }
  return [...emails];
}

function guessName(domain) {
  // "amydangphotography.com" → "Amy"
  // "sarahchenphotography.com" → "Sarah"
  const base = domain.replace(/\.(com|net|org|photography|photo|studio|pics|me|co|us|biz|io)$/i, "")
    .replace(/photography|photo|studio|video|media|weddings?|images?/gi, " ")
    .replace(/[-_]/g, " ")
    .trim();
  const words = base.split(/\s+/).filter(Boolean);
  const w = words[0] || "Hi";
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function guessBusinessName(domain) {
  const base = domain.replace(/\.(com|net|org|photography|photo|studio|pics|me|co|us|biz|io)$/i, "")
    .replace(/[-_]/g, " ")
    .trim();
  return base.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

async function main() {
  let existing = [];
  if (existsSync(OUTPUT)) {
    try { existing = JSON.parse(await readFile(OUTPUT, "utf-8")).filter(e => e.email); } catch {}
  }
  const seenEmails = new Set(existing.map(e => e.email));
  const seenDomains = new Set(existing.map(e => e.domain).filter(Boolean));
  const found = [...existing];
  console.log(`Starting with ${found.length} existing leads\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  const searchPage = await browser.newPage();
  await searchPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  for (const market of MARKETS) {
    if (found.length >= 100) break;
    console.log(`\n📍 ${market.city}, ${market.state}`);

    // Try up to 3 Bing result pages per city
    for (let page = 0; page < 3 && found.length < 100; page++) {
      const siteUrls = await searchBingForPhotographers(searchPage, market.city, market.state, page);
      console.log(`   Bing page ${page + 1}: ${siteUrls.length} candidate sites`);

      for (const siteUrl of siteUrls) {
        if (found.length >= 100) break;
        const domain = getDomain(siteUrl);
        if (!domain || seenDomains.has(domain)) continue;
        seenDomains.add(domain);

        process.stdout.write(`   ${domain} → `);

        const emails = await extractEmailFromSite(browser, siteUrl);
        const newEmail = emails.find(e => !seenEmails.has(e));

        if (newEmail) {
          seenEmails.add(newEmail);
          const lead = {
            name: guessName(domain),
            business: guessBusinessName(domain),
            email: newEmail,
            domain,
            city: market.city,
            niche: "wedding",
          };
          found.push(lead);
          await writeFile(OUTPUT, JSON.stringify(found, null, 2));
          console.log(`✓ ${newEmail}`);
        } else {
          console.log("no email");
        }

        await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
      }

      // Delay between Bing pages
      await new Promise(r => setTimeout(r, 2000));
    }

    // Polite delay between cities
    await new Promise(r => setTimeout(r, 3000));
  }

  await browser.close();
  console.log(`\n=== Done: ${found.length} real leads ===`);
  found.forEach(p => console.log(`  ${p.city}: ${p.name} <${p.email}>`));
}

main().catch(console.error);
