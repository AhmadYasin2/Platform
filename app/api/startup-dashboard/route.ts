import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // 1) Load the active startup for this user
  const { rows: startupRows } = await pool.query(
    `SELECT * FROM startups
     WHERE status = 'active' AND user_id = $1
     LIMIT 1`,
    [userId]
  );
  if (startupRows.length === 0) {
    return NextResponse.json({ error: "No active startup" }, { status: 404 });
  }
  const startup = startupRows[0];

  // 2) Load selected services + package info
  const svcRes = await pool.query<{
    id: string;
    startup_id: string;
    package_id: string;
    hours_used: number;
    selected_at: string;
    p_id: string;
    p_service_id: string;
    p_name: string;
    p_description: string | null;
    p_price: number;
    p_hours: number;
    p_created_at: string;
    p_updated_at: string;
  }>(
    `
      SELECT 
        ss.id,
        ss.startup_id,
        ss.package_id,
        ss.hours_used,
        ss.selected_at,
        p.id   AS p_id,
        p.service_id   AS p_service_id,
        p.name         AS p_name,
        p.description  AS p_description,
        p.price        AS p_price,
        p.hours        AS p_hours,
        p.created_at   AS p_created_at,
        p.updated_at   AS p_updated_at
      FROM startup_services ss
      JOIN packages p ON p.id = ss.package_id
      WHERE ss.startup_id = $1
      ORDER BY ss.selected_at DESC
    `,
    [startup.id]
  );
  const startup_services = svcRes.rows.map((r) => ({
    id: r.id,
    startup_id: r.startup_id,
    package_id: r.package_id,
    hours_used: r.hours_used,
    selected_at: r.selected_at,
    package: {
      id: r.p_id,
      service_id: r.p_service_id,
      name: r.p_name,
      description: r.p_description,
      price: r.p_price,
      hours: r.p_hours,
      created_at: r.p_created_at,
      updated_at: r.p_updated_at,
    },
  }));

  // 3) Load upcoming meetings (next 5)
  const meetRes = await pool.query<{
    id: string;
    startup_id: string;
    meeting_date: string;
    meeting_time: string | null;
    farah_notes: string | null;
    guest_notes: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `
      SELECT * FROM meetings
      WHERE startup_id = $1
        AND meeting_date >= CURRENT_DATE
      ORDER BY meeting_date, meeting_time
      LIMIT 5
    `,
    [startup.id]
  );
  const meetings = meetRes.rows;

  return NextResponse.json({ startup, startup_services, meetings });
}
