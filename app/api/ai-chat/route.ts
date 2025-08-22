import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import { buildStartupContext } from "@/lib/ai-context";

type FlatPkg = {
  id: string;
  service: string;     // service category display name
  package: string;     // package display name
  description: string; // description text
  credits: number;     // internal only (price)
  hours: number;       // shown in output
};

function detectIntent(text: string) {
  const t = (text || "").toLowerCase();
  if (/(summarize|summary|to-do|action item|next meeting)/.test(t)) return "summarize";
  if (/(plan|recommend|choose|service|package|marketing|branding|logo|nda|legal|finance|ai|prototype|validation|it|website|employment|employee|hiring|hr|labor|labour)/.test(t)) {
    return "plan";
  }
  return "smalltalk";
}

/** Requested categories from user text — now includes employment→legal */
function detectRequestedCategories(message: string): string[] {
  const t = (message || "").toLowerCase();
  const want: string[] = [];

  // LEGAL (expanded)
  if (
    /\blegal\b|nda|contract|compliance|regulatory|employment|employee|employees|hiring|hr\b|labor|labour/.test(t)
  ) want.push("legal");

  if (/\bmarketing|gtm|campaign|plan\b/.test(t)) want.push("marketing");
  if (/\bbranding|logo|identity|slides?|presentation/.test(t)) want.push("branding");
  if (/\bfinance|budget|forecast|model/.test(t)) want.push("finance");
  if (/\bprototype|validation|feedback|ui|ux/.test(t)) want.push("prototyping");
  if (/\bai\b|automation|roadmap/.test(t)) want.push("ai");
  if (/\bit\b|website|infrastructure|cloud/.test(t)) want.push("it");

  return Array.from(new Set(want));
}

/** Preface only */
function extractMeetingHints(meetings: any[]): { preface: string | null; blob: string } {
  if (!Array.isArray(meetings) || meetings.length === 0) return { preface: null, blob: "" };
  const latest = meetings[0];
  const blob = [
    latest?.public_summary,
    latest?.private_notes,
    ...(latest?.key_insights || []),
    ...(latest?.action_items || []),
    latest?.farah_notes,
    latest?.guest_notes,
  ].filter(Boolean).join(" ").toLowerCase();

  const hinted: string[] = [];
  if (/branding|logo|identity|social/.test(blob)) hinted.push("branding");
  if (/marketing|gtm|campaign|plan/.test(blob)) hinted.push("marketing");
  if (/nda|contract|legal|compliance|employment|employee|hiring|hr|labor|labour/.test(blob)) hinted.push("legal");
  if (/budget|finance|pricing|forecast/.test(blob)) hinted.push("finance");
  if (/prototype|ui|ux|validation/.test(blob)) hinted.push("prototyping");
  if (/\bai\b|automation|roadmap/.test(blob)) hinted.push("ai");
  if (/website|it|infrastructure|cloud/.test(blob)) hinted.push("it");

  const preface = hinted.length
    ? `Farah has suggested some ${hinted.join(" & ")} services in your recent meetings.`
    : null;

  return { preface, blob };
}

/** Normalize service display name → coarse category */
function normalizeServiceCategory(name: string): "legal"|"marketing"|"branding"|"finance"|"prototyping"|"ai"|"it"|"other" {
  const s = (name || "").toLowerCase();
  if (s.includes("legal")) return "legal";
  if (s.includes("marketing")) return "marketing";
  if (s.includes("branding") || s.includes("brand")) return "branding";
  if (s.includes("finance")) return "finance";
  if (s.includes("prototyping") || s.includes("prototype")) return "prototyping";
  if (s.startsWith("ai") || s.includes(" ai ")) return "ai";
  if (s.startsWith("it") || s.includes(" it ") || s.includes("website") || s.includes("infrastructure") || s.includes("cloud")) return "it";
  return "other";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, sessionId } = await req.json();
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    // Startup + credits
    const { rows: startupRows } = await pool.query(
      `SELECT id, name, total_credits, used_credits
         FROM startups
        WHERE user_id = $1
        LIMIT 1`,
      [session.user.id]
    );
    if (!startupRows.length) return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    const startup = startupRows[0];

    // Already selected packages → exclude + subtract for remaining credits
    const { rows: selectedRows } = await pool.query(
      `SELECT ss.package_id, COALESCE(p.price,0) AS price
         FROM startup_services ss
         JOIN packages p ON p.id = ss.package_id
        WHERE ss.startup_id = $1`,
      [startup.id]
    );
    const selectedIds = new Set<string>(selectedRows.map((r: any) => r.package_id));
    const selectedSum = selectedRows.reduce((sum: number, r: any) => sum + Number(r.price || 0), 0);

    const remainingCredits = Math.max(
      0,
      (startup.total_credits ?? 0) - (startup.used_credits ?? 0) - selectedSum
    );

    const context = await buildStartupContext(startup.id);

    // Save user message
    if (sessionId) {
      await pool.query(
        `INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`,
        [sessionId, "user", message]
      );
    }

    const intent = detectIntent(message);

    // Summarize
    if (intent === "summarize") {
      const latest = context.meetings?.[0];
      const reply = latest
        ? `Here’s a quick recap of your last meeting (${new Date(latest.meeting_date).toLocaleDateString()}):
- Summary: ${latest.public_summary || "No summary yet."}
- Action Items: ${latest.action_items?.length ? latest.action_items.join(", ") : "None."}
- Key Insights: ${latest.key_insights?.length ? latest.key_insights.join(", ") : "None."}`
        : "No meetings found. Once you have meeting notes, I can help summarize them.";
      if (sessionId) {
        await pool.query(`INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`, [sessionId, "assistant", reply]);
      }
      return NextResponse.json({ ok: true });
    }

    // Plan / recommendations (strict category + hours output)
    if (intent === "plan") {
      // Load packages
      type Row = {
        id: string;
        service_name: string;
        package_name: string;
        description: string | null;
        price: number | null;
        hours: number | null;
      };
      const res = await pool.query(
        `SELECT p.id,
                s.name AS service_name,
                p.name AS package_name,
                p.description,
                p.price,
                p.hours
           FROM packages p
           JOIN services s ON s.id = p.service_id
          ORDER BY s.name, p.name`
      );
      const rows = res.rows as Row[];

      const catalog: (FlatPkg & { cat: ReturnType<typeof normalizeServiceCategory>; text: string })[] =
        rows
          .filter((r) => !selectedIds.has(r.id))
          .map((r) => {
            const service = r.service_name;
            const pkg = r.package_name;
            const desc = r.description ?? "";
            const hours = Number(r.hours ?? 0);
            const credits = Number(r.price ?? 0);
            const cat = normalizeServiceCategory(service);
            return {
              id: r.id,
              service,
              package: pkg,
              description: desc,
              credits, // internal only
              hours,
              cat,
              text: `${service} ${pkg} ${desc}`.toLowerCase(),
            };
          });

      // Requested categories (STRICT). If explicit categories exist, DO NOT fallback to "all".
      const requestedCats = new Set(detectRequestedCategories(message));
      let candidates = catalog;

      if (requestedCats.size > 0) {
        // Primary filter by normalized category
        candidates = catalog.filter((p) => requestedCats.has(p.cat));

        // Secondary safety filter: if primary is empty (naming mismatch), filter by keyword family instead of falling back to all
        if (candidates.length === 0) {
          const t = (message || "").toLowerCase();
          const wantLegal = requestedCats.has("legal");
          const kwLegal = /(legal|contract|nda|compliance|regulatory|employment|employee|employees|hiring|hr\b|labor|labour)/;
          if (wantLegal) {
            candidates = catalog.filter((p) => kwLegal.test(p.text));
          }

          // Add similar secondary gates for other categories only if needed
          // (We keep only legal here to satisfy the current bug; others still pass via normalized name.)
        }

        // If still empty, DO NOT broaden to all; we handle this in fallback response below.
      }

      // If explicit categories were asked and still nothing matched → reply with "no matches" UX
      if (requestedCats.size > 0 && candidates.length === 0) {
        const { preface } = extractMeetingHints(context.meetings);
        const lines: string[] = [];
        if (preface) lines.push(preface);
        lines.push(`Based on your request: ${message}`);
        lines.push("");
        lines.push("I didn’t find packages in that category right now.");
        lines.push("Would you like me to propose a new plan of packages that fits your remaining credits?");
        const reply = lines.join("\n");
        if (sessionId) {
          await pool.query(`INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`, [sessionId, "assistant", reply]);
        }
        return NextResponse.json({ ok: true });
      }

      // Ranking within candidates
      const reqText = (message || "").toLowerCase();
      const { preface, blob: meetingBlob } = extractMeetingHints(context.meetings);
      const scored = candidates
        .map((p) => {
          let score = 0;

          // request keywords
          for (const kw of reqText.split(/\W+/).filter(Boolean)) {
            if (kw.length >= 4 && p.text.includes(kw)) score += 1.2;
          }
          // meeting keywords
          for (const kw of meetingBlob.split(/\W+/).filter(Boolean)) {
            if (kw.length >= 5 && p.text.includes(kw)) score += 0.6;
          }

          // gentle boosts for obvious intent (expanded for employment→legal)
          if (/(legal basics|nda|contract|compliance|regulatory|employment|employee|employees|hiring|hr\b|labor|labour)/.test(reqText)
              && /(legal|contract|nda|compliance|regulatory|employment|employee|employees|hiring|hr\b|labor|labour)/.test(p.text)) {
            score += 2.5;
          }
          if (/(logo|branding|slides?|presentation)/.test(reqText) && /(brand|logo|slide|presentation)/.test(p.text)) score += 2;
          if (/(marketing|gtm|campaign|plan)/.test(reqText) && /(marketing|gtm|campaign|plan)/.test(p.text)) score += 2;

          return { p, score };
        })
        .sort((a, b) => b.score - a.score);

      // Affordability filter (use credits internally; do not show)
      const affordable = scored.filter(({ p }) => (p.credits || 0) <= remainingCredits).map(({ p }) => p);

      let chosen: FlatPkg[] = [];
      let note: string | null = null;

      if (affordable.length > 0) {
        chosen = affordable.slice(0, 3);
      } else {
        // Nothing affordable in this (requested) category: DON'T show other categories.
        // Ask if user wants a new plan that fits budget; provide most relevant (category-pure) context items.
        const closest = scored.slice(0, 3).map(({ p }) => p);
        chosen = closest;
        note = "No packages in this category fit your current credits. Would you like me to propose a new plan of packages that fits your remaining credits?";
      }

      // Compose plain text (show hours, never prices)
      const lines: string[] = [];
      if (preface) lines.push(preface);
      lines.push(`Based on your request: ${message}`);
      lines.push("");
      lines.push("Recommended packages:");
      for (const pkg of chosen) {
        const hrs = pkg.hours > 0 ? ` (${pkg.hours} hrs)` : "";
        const desc = pkg.description ? ` — ${pkg.description}` : "";
        lines.push(`- ${pkg.service} — ${pkg.package}${hrs}${desc}`);
      }
      if (note) lines.push(note);

      const reply = lines.join("\n");
      if (sessionId) {
        await pool.query(
          `INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`,
          [sessionId, "assistant", reply]
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Smalltalk
    const greeting =
      "Tell me what you need (e.g., “legal basics for employment”, “logo and NDA templates”) and I’ll list the most relevant service packages.";
    if (sessionId) {
      await pool.query(`INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1,$2,$3)`, [sessionId, "assistant", greeting]);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/ai-chat:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
