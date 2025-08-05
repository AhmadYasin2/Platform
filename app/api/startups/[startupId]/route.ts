// app/api/startups/[startupId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { startupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { startupId } = params;

  // 1) Load startup row
  const { rows } = await pool.query("SELECT * FROM startups WHERE id = $1", [
    startupId,
  ]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const startup = rows[0];

  // 2) Load meetings
  const meetRes = await pool.query(
    `SELECT * FROM meetings
     WHERE startup_id = $1
     ORDER BY meeting_date DESC`,
    [startupId]
  );

  // 3) Load services
  const svcRes = await pool.query(
    `
      SELECT
        ss.*, 
        p.id   AS p_id,
        p.name AS p_name,
        p.description AS p_description,
        p.price AS p_price,
        p.hours AS p_hours,
        p.created_at AS p_created_at,
        p.updated_at AS p_updated_at
      FROM startup_services ss
      JOIN packages p ON p.id = ss.package_id
      WHERE ss.startup_id = $1
      ORDER BY ss.selected_at DESC
    `,
    [startupId]
  );

  const startup_services = svcRes.rows.map((r) => ({
    id: r.id,
    startup_id: r.startup_id,
    package_id: r.package_id,
    hours_used: r.hours_used,
    selected_at: r.selected_at,
    package: {
      id: r.p_id,
      name: r.p_name,
      description: r.p_description,
      price: r.p_price,
      hours: r.p_hours,
      created_at: r.p_created_at,
      updated_at: r.p_updated_at,
    },
  }));

  return NextResponse.json({
    ...startup,
    meetings: meetRes.rows,
    startup_services,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { startupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { startupId } = params;
  const updates = await request.json(); 
  // updates may include: contract_status, total_credits

  // Build SET clause dynamically
  const fields = Object.keys(updates);
  const vals = Object.values(updates);
  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  const setClause = fields.map((f, i) => `"${f}" = $${i + 1}`).join(", ");

  await pool.query(
    `UPDATE startups SET ${setClause} WHERE id = $${fields.length + 1}`,
    [...vals, startupId]
  );

  return NextResponse.json({ ok: true });
}
