import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

const DB_PATH = join(process.cwd(), "waitlist.json");

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Read existing entries
    let entries: { email: string; ts: string }[] = [];
    try {
      const raw = await readFile(DB_PATH, "utf-8");
      entries = JSON.parse(raw);
    } catch {}

    // Deduplicate
    if (!entries.find((e) => e.email === email)) {
      entries.push({ email, ts: new Date().toISOString() });
      await writeFile(DB_PATH, JSON.stringify(entries, null, 2));
    }

    return NextResponse.json({ ok: true, count: entries.length });
  } catch (err) {
    console.error(err);
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
