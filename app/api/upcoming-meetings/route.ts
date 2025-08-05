// app/api/upcoming-meetings/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{
      id: string;
      meeting_date: string;
      meeting_time: string | null;
      startup_name: string;
    }>(`
      SELECT
        m.id,
        m.meeting_date::text      AS meeting_date,
        m.meeting_time::text      AS meeting_time,
        s.name                    AS startup_name
      FROM public.meetings AS m
      JOIN public.startups AS s
        ON m.startup_id = s.id
      WHERE m.meeting_date >= CURRENT_DATE
      ORDER BY m.meeting_date ASC
      LIMIT 5
    `);

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("Upcoming Meetings API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
