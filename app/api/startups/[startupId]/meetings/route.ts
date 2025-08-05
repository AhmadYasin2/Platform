// app/api/startups/[startupId]/meetings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { startupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { startupId } = params;
  const { date, time, farahNotes, guestNotes } = await request.json();

  const { rows } = await pool.query(
    `
      INSERT INTO meetings 
        (startup_id, meeting_date, meeting_time, farah_notes, guest_notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [startupId, date, time || null, farahNotes, guestNotes]
  );

  return NextResponse.json(rows[0]);
}
