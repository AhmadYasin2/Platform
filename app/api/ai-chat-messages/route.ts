// app/api/ai-chat-messages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // verify this chat session belongs to the user's startup
  const { rows: sRows } = await pool.query(
    `SELECT s.startup_id
       FROM ai_chat_sessions s
      WHERE s.id = $1
      LIMIT 1`,
    [sessionId]
  );
  if (!sRows.length) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const startupId = sRows[0].startup_id;

  const { rows: ownerRows } = await pool.query(
    `SELECT 1
       FROM startups
      WHERE id = $1
        AND user_id = $2
      LIMIT 1`,
    [startupId, session.user.id]
  );
  if (!ownerRows.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await pool.query(
    `SELECT id, role, content, created_at
       FROM ai_chat_messages
      WHERE session_id = $1
      ORDER BY created_at ASC`,
    [sessionId]
  );

  return NextResponse.json(rows);
}
