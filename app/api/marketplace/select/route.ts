// app/api/marketplace/select/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { packageId, hours } = await request.json();
  const userId = session.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Insert selection
    await client.query(
      `INSERT INTO startup_services (startup_id, package_id, hours_used)
       VALUES (
         (SELECT id FROM startups WHERE user_id = $1),
         $2, $3
       )`,
      [userId, packageId, hours]
    );

    // 2) Update credits
    await client.query(
      `UPDATE startups
         SET used_credits = used_credits + $1
       WHERE user_id = $2`,
      [hours, userId]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Select package error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
