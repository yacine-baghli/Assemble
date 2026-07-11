import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Dev/offline fallback for email capture. Persists to .dev-data/leads.json so
// captured signups survive reloads and can be inspected during local testing.
// In the graded demo this path is unused — Convex `leads:capture` handles it.

const DATA_DIR = path.join(process.cwd(), ".dev-data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

type Lead = { email: string; projectId?: string; source?: string; at: number };

async function readLeads(): Promise<Lead[]> {
  try {
    return JSON.parse(await fs.readFile(LEADS_FILE, "utf8")) as Lead[];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    projectId?: string;
    source?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const leads = await readLeads();
  const isNew = !leads.some((l) => l.email === email);
  if (isNew) {
    leads.push({ email, projectId: body.projectId, source: body.source ?? "teaser", at: Date.now() });
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
  }
  return NextResponse.json({ isNew });
}

export async function GET() {
  const leads = await readLeads();
  return NextResponse.json({ count: leads.length, leads });
}
