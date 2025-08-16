// app/api/ai-chat/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import { buildStartupContext } from "@/lib/ai-context";
import { generatePlanWithGroq } from "@/lib/advisor";
import type { Stage, AdvisorInput } from "@/lib/advisor";

function mapStage(dbStage?: string): Stage {
  switch ((dbStage || "").toLowerCase()) {
    case "idea":
      return "idea";
    case "mvp":
      return "mvp";
    case "post-mvp":
      return "post-mvp";
    case "scale":
      return "scale";
    default:
      return "mvp";
  }
}

function detectIntent(text: string) {
  const t = (text || "").toLowerCase();
  if (/(summarize|summary|action item|next meeting|remind|todo|to-do)/.test(t)) return "summarize";
  if (/(service|package|plan|strategy|recommend|select|choose|credits|hours|swap)/.test(t)) return "plan";
  return "smalltalk";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, sessionId } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1) Resolve current startup (by user)
    const { rows: startupRows } = await pool.query(
      `SELECT id, name, contract_status, total_credits, used_credits
         FROM startups
        WHERE user_id = $1
        LIMIT 1`,
      [session.user.id]
    );
    if (!startupRows.length) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }
    const startup = startupRows[0];

    // 2) Build full context (services, meetings, selected)
    const context = await buildStartupContext(startup.id);

    // 3) Persist user message
    if (sessionId) {
      await pool.query(
        `INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`,
        [sessionId, "user", message]
      );
    }

    // 4) Intent routing
    const intent = detectIntent(message);

    // ---------- A) Summarize latest meeting ----------
    if (intent === "summarize") {
      const latest = context.meetings[0];
      const text = latest
        ? `Here’s a quick recap from your latest meeting (${new Date(latest.meeting_date).toLocaleDateString()}):
- Summary: ${latest.public_summary || "No summary available"}
- Action items: ${
            (latest.action_items || []).length ? latest.action_items.join(", ") : "None listed"
          }
- Key insights: ${
            (latest.key_insights || []).length ? latest.key_insights.join(", ") : "None listed"
          }`
        : "I don’t see recent meetings yet. Once there are summaries, I can turn them into action items for you.";

      if (sessionId) {
        await pool.query(
          `INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`,
          [sessionId, "assistant", text]
        );
      }

      // No plan object here; frontend will re-fetch messages and show the text bubble
      return NextResponse.json({ ok: true });
    }

    // ---------- B) Plan / services strategy ----------
    if (intent === "plan") {
      const available = Math.max(
        0,
        (context.startup.total_credits || 0) - (context.startup.used_credits || 0)
      );

      // Flatten catalog to package-level services for the planner
      const flatCatalog = context.services.flatMap((svc) =>
        (svc.packages || []).map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          category: svc.name,
          credits: pkg.price, // not sent to UI later
          durationWeeks: pkg.hours,
        }))
      );

      // If user has no selected services yet, let the planner consider all packages
      const selectedIds =
        context.selectedServices && context.selectedServices.length > 0
          ? context.selectedServices
          : flatCatalog.map((p) => p.id);

      const advisorInput: AdvisorInput = {
        profile: {
          name: context.startup.name,
          stage: mapStage((context as any).startup.stage), // optional if you add stage later
          goals: ["choose best incubation services"],
          constraints: {
            maxServices: 5,
            maxCredits: available,
            timelineWeeks: 12,
          },
        },
        servicesCatalog: flatCatalog,
        selectedServiceIds: selectedIds,
      };

      const plan = await generatePlanWithGroq(advisorInput);

      // Persist assistant JSON message
      if (sessionId) {
        await pool.query(
          `INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`,
          [sessionId, "assistant", JSON.stringify(plan)]
        );
      }

      // Strip catalog for UI (no prices)
      const safeCatalog = context.services.map((s) => ({ id: s.id, name: s.name }));

      return NextResponse.json({
        plan,
        servicesCatalog: safeCatalog,
      });
    }

    // ---------- C) Smalltalk / greeting ----------
    const friendly =
      "Hey! I can help you pick the best service packages for this month, or summarize your latest meeting into clear action items. Try asking: “Are my selected services the best for now?” or “Summarize my last meeting”.";
    if (sessionId) {
      await pool.query(
        `INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`,
        [sessionId, "assistant", friendly]
      );
    }
    // Frontend will fetch and display
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/ai-chat:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
