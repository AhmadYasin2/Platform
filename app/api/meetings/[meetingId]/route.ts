// app/api/meetings/[meetingId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { meetingId } = params;
  const updates = await request.json();
  const fields = Object.keys(updates);
  const vals = Object.values(updates);
  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields" }, { status: 400 });
  }
  const setClause = fields.map((f, i) => `"${f}" = $${i + 1}`).join(", ");
  await pool.query(
    `UPDATE meetings SET ${setClause} WHERE id = $${fields.length + 1}`,
    [...vals, meetingId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { meetingId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { meetingId } = params
  const result = await pool.query(
    `DELETE FROM meetings WHERE id = $1`,
    [meetingId]
  )
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

