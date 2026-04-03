import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

// Vercel serverless: use /tmp for writable storage
const DB_PATH = join("/tmp", "waitlist.json");

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    let entries: { email: string; ts: string }[] = [];
    try {
      const raw = await readFile(DB_PATH, "utf-8");
      entries = JSON.parse(raw);
    } catch {}

    if (!entries.find((e) => e.email === email)) {
      entries.push({ email, ts: new Date().toISOString() });
      await writeFile(DB_PATH, JSON.stringify(entries, null, 2));
    }

    // Also log so we can see in Vercel function logs
    console.log(`[waitlist] new signup: ${email} | total: ${entries.length}`);

    return NextResponse.json({ ok: true, count: entries.length });
  } catch (err) {
    console.error("[waitlist] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const raw = await readFile(DB_PATH, "utf-8");
    const entries = JSON.parse(raw);
    return NextResponse.json({ count: entries.length, entries });
  } catch {
    return NextResponse.json({ count: 0, entries: [] });
  }
}
