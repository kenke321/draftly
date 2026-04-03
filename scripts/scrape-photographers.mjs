/**
 * Scrape real wedding photographer emails
 * Step 1: Get vendor names from The Knot listing
 * Step 2: Search Bing for each vendor's real website
 * Step 3: Extract email from their site
 *
 * Designed to run on US servers (GitHub Actions) where Bing is unrestricted
 */

import puppeteer from "puppeteer";
import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";

const OUTPUT = "./scripts/photographers.json";
const EMAIL_RE = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;

const MARKETS = [
  { city: "Austin",      state: "TX", slug: "wedding-photographers-austin-tx" },
  { city: "Nashville",   state: "TN", slug: "wedding-photographers-nashville-tn" },
  { city: "Denver",      state: "CO", slug: "wedding-photographers-denver-co" },
  { city: "Seattle",     state: "WA", slug: "wedding-photographers-seattle-wa" },
  { city: "Portland",    state: "OR", slug: "wedding-photographers-portland-or" },
  { city: "Charlotte",   state: "NC", slug: "wedding-photographers-charlotte-nc" },
  { city: "Dallas",      state: "TX", slug: "wedding-photographers-dallas-tx" },
  { city: "Phoenix",     state: "AZ", slug: "wedding-photographers-phoenix-az" },
  { city: "Atlanta",     state: "GA", slug: "wedding-photographers-atlanta-ga" },
  { city: "Chicago",     state: "IL", slug: "wedding-photographers-chicago-il" },
  { city: "Boston",      state: "MA", slug: "wedding-photographers-boston-ma" },
  { city: "San Diego",   state: "CA", slug: "wedding-photographers-san-diego-ca" },
  { city: "Minneapolis", state: "MN", slug: "wedding-photographers-minneapolis-mn" },
  { city: "Tampa",       state: "FL", slug: "wedding-photographers-tampa-fl" },
  { city: "Raleigh",     state: "NC", slug: "wedding-photographers-raleigh-nc" },
];

const SKIP_EMAIL_RE = /example\.|test@|noreply|no-reply|admin@|webmaster|@2x|\.png|\.jpg|\.gif|sentry|googleapis|gstatic|cloudflare|schema\.org|w3\.org|theknotww|theknot/i;
const SKIP_DOMAINS = new Set(["bing.com","google.com","theknot.com","weddingwire.com","yelp.com","facebook.com","instagram.com","pinterest.com","thumbtack.com","expertise.com","reddit.com","youtube.com","zola.com","squarespace.com","wix.com","wordpress.com"]);

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

// Decode Bing redirect URL
function decodeBingUrl(href) {
  try {
    const u = new URL(href).searchParams.get("u");
    if (!u) return href;
    const b64 = u.replace(/^a1/, "");
    const decoded = Buffer.from(b64, "base64").toString();
    return decoded.startsWith("http") ? decoded : href;
  } catch { return href; }
}

async function getVendorNamesFromKnot(page, market) {
  try {
    await page.goto(`https://www.theknot.com/marketplace/${market.slug}`, {
      waitUntil: "domcontentloaded", timeout: 25000
    });
    await new Promise(r => setTimeout(r, 2000));

    const names = await page.$$eval("h2, h3, [class*='vendor'] h2, [class*='vendor'] h3", els =>
      els.map(el => el.textContent.trim())
         .filter(t => t.length > 3 && t.length < 80 && !t.includes("$") && !t.includes("©"))
         .filter((t, i, arr) => arr.indexOf(t) === i)
         .slice(0, 25)
    );
    return names;
  } catch (e) {
    console.error(`  Error getting names: ${e.message}`);
    return [];
  }
}

async function findWebsiteViaBing(page, vendorName, city, state) {
  const query = `"${vendorName}" ${city} ${state} photographer`;
  try {
    await page.goto(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en&count=10`,
      { waitUntil: "domcontentloaded", timeout: 20000 }
    );
    await new Promise(r => setTimeout(r, 800));

    // Decode Bing redirect links
    const allHrefs = await page.$$eval("a[href]", els =>
      els.map(el => el.href).filter(h => h && h.includes("bing.com/ck/a"))
    );
    const realUrls = allHrefs
      .map(decodeBingUrl)
      .filter(u => u && u.startsWith("http") && !u.includes("bing.com"))
      .filter(u => !shouldSkip(u));

    return [...new Set(realUrls)].slice(0, 5);
  } catch { return []; }
}

async function extractEmailFromSite(browser, siteUrl) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
  const emails = new Set();
  try {
    await page.goto(siteUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

    // mailto links
    const mailtos = await page.$$eval("a[href^='mailto:']", els =>
      els.map(el => el.href.replace("mailto:", "").split("?")[0].toLowerCase())
    ).catch(() => []);
    mailtos.filter(isValidEmail).forEach(e => emails.add(e));

    // page text
    if (emails.size === 0) {
      const text = await page.evaluate(() => document.body.innerText).catch(() => "");
      (text.match(EMAIL_RE) || []).map(e => e.toLowerCase()).filter(isValidEmail).forEach(e => emails.add(e));
    }

    // contact page
    if (emails.size === 0) {
      const contactHref = await page.$eval("a[href*='contact' i]", el => el.href).catch(() => null);
      if (contactHref && getDomain(contactHref) === getDomain(siteUrl)) {
        await page.goto(contactHref, { waitUntil: "domcontentloaded", timeout: 10000 });
        const m = await page.$$eval("a[href^='mailto:']", els =>
          els.map(el => el.href.replace("mailto:", "").split("?")[0].toLowerCase())
        ).catch(() => []);
        m.filter(isValidEmail).forEach(e => emails.add(e));
        if (emails.size === 0) {
          const t = await page.evaluate(() => document.body.innerText).catch(() => "");
          (t.match(EMAIL_RE) || []).map(e => e.toLowerCase()).filter(isValidEmail).forEach(e => emails.add(e));
        }
      }
    }
  } catch { } finally {
    await page.close();
  }
  return [...emails];
}

function guessName(vendorName) {
  // "Amy Dang Photography" → "Amy"
  const words = vendorName.replace(/photography|photo|studio|video|media|&|plus|\+/gi, " ").trim().split(/\s+/);
  const w = words[0] || "Hello";
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

async function main() {
  let existing = [];
  if (existsSync(OUTPUT)) {
    try { existing = JSON.parse(await readFile(OUTPUT, "utf-8")).filter(e => e.email); } catch {}
  }
  const seenEmails = new Set(existing.map(e => e.email));
  const seenNames = new Set(existing.map(e => e.business));
  const found = [...existing];
  console.log(`Starting with ${found.length} existing leads\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  const mainPage = await browser.newPage();
  await mainPage.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  for (const market of MARKETS) {
    if (found.length >= 100) break;
    console.log(`\n📍 ${market.city} ${market.state}`);

    const vendorNames = await getVendorNamesFromKnot(mainPage, market);
    console.log(`   Got ${vendorNames.length} vendor names`);

    for (const vendorName of vendorNames) {
      if (found.length >= 100) break;
      if (seenNames.has(vendorName)) continue;
      seenNames.add(vendorName);

      process.stdout.write(`   "${vendorName}" → `);

      const websites = await findWebsiteViaBing(mainPage, vendorName, market.city, market.state);
      if (!websites.length) { console.log("no site"); continue; }

      let gotEmail = false;
      for (const siteUrl of websites) {
        const domain = getDomain(siteUrl);
        const emails = await extractEmailFromSite(browser, siteUrl);
        const newEmail = emails.find(e => !seenEmails.has(e));
        if (newEmail) {
          seenEmails.add(newEmail);
          const lead = {
            name: guessName(vendorName),
            business: vendorName,
            email: newEmail,
            city: market.city,
            niche: "wedding",
          };
          found.push(lead);
          await writeFile(OUTPUT, JSON.stringify(found, null, 2));
          console.log(`✓ ${newEmail}`);
          gotEmail = true;
          break;
        }
      }
      if (!gotEmail) console.log("no email");
      await new Promise(r => setTimeout(r, 600));
    }

    // Polite delay between cities
    await new Promise(r => setTimeout(r, 3000));
  }

  await browser.close();
  console.log(`\n=== Done: ${found.length} real leads ===`);
  found.forEach(p => console.log(`  ${p.city}: ${p.name} <${p.email}>`));
}

main().catch(console.error);
