// app/api/agent/route.ts
// -----------------------------------------------------------------------------
// POST /api/agent
// Body: { workspace?: "cryowipes" | "lthr-style", messages: [{role, content}] }
// Geeft { text, messages } terug. `messages` bevat de volledige conversatie
// (incl. tool-calls) zodat je die bij een volgende vraag terug kunt sturen.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";

export const runtime = "nodejs";
export const maxDuration = 60; // agent-loops mogen even duren

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspace = body.workspace ?? "cryowipes";
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages (array) is verplicht" },
        { status: 400 }
      );
    }

    const result = await runAgent({ workspaceSlug: workspace, messages });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[/api/agent]", err);
    return NextResponse.json(
      { error: err?.message ?? "onbekende fout" },
      { status: 500 }
    );
  }
}
