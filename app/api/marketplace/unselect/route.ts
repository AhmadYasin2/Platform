// app/api/marketplace/unselect/route.ts
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

    // 1) Delete the selection
    await client.query(
      `DELETE FROM startup_services
       WHERE startup_id = (SELECT id FROM startups WHERE user_id = $1)
         AND package_id = $2`,
      [userId, packageId]
    );

    // 2) Update credits
    await client.query(
      `UPDATE startups
         SET used_credits = GREATEST(0, used_credits - $1)
       WHERE user_id = $2`,
      [hours, userId]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Unselect package error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
