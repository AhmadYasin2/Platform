// app/api/ai-chat-sessions/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

// GET: list sessions for current startup
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // find startup for user
  const { rows: sRows } = await pool.query(
    `SELECT id FROM startups WHERE user_id = $1 LIMIT 1`,
    [session.user.id]
  );
  if (!sRows.length) {
    return NextResponse.json([], { status: 200 });
  }
  const startupId = sRows[0].id;

  const { rows } = await pool.query(
    `SELECT id, session_title, created_at
       FROM ai_chat_sessions
      WHERE startup_id = $1
      ORDER BY updated_at DESC NULLS LAST, created_at DESC`,
    [startupId]
  );

  return NextResponse.json(rows);
}

// POST: create a new session for current startup
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows: sRows } = await pool.query(
    `SELECT id, name FROM startups WHERE user_id = $1 LIMIT 1`,
    [session.user.id]
  );
  if (!sRows.length) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  }
  const startup = sRows[0];

  const { rows } = await pool.query(
    `INSERT INTO ai_chat_sessions (startup_id, session_title)
     VALUES ($1, $2)
     RETURNING id, session_title, created_at`,
    [startup.id, `New Chat • ${startup.name}`]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
