import { NextResponse } from "next/server";
import {
  demoDraft,
  type OutreachContext,
} from "../../../../../../convex/lib/outreach";

// Dev/offline fallback for outreach drafting (mirrors outreach:draft).
export async function POST(req: Request) {
  const { context } = (await req.json().catch(() => ({}))) as {
    context?: OutreachContext;
  };
  if (!context?.candidateName) {
    return NextResponse.json({ error: "Missing context" }, { status: 400 });
  }
  return NextResponse.json({ ...demoDraft(context), demoMode: true });
}
