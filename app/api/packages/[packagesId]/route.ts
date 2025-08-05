// app/api/packages/[packageId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { packagesId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.log("🔍 In PUT /api/packages/[id], got id =", params.packagesId);
  let updates: Record<string, any>;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 1. Validate fields
  const allowed = ["name", "description", "price", "hours"];
  const fields = Object.keys(updates).filter((f) => allowed.includes(f));
  if (fields.length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // 2. Build clause, include updated_at
  const sets = fields
    .map((f, i) => `"${f}" = $${i + 1}`)
    .concat(`"updated_at" = now()`)
    .join(", ");
  const vals = fields.map((f) => updates[f]);

  // 3. Execute safely
  try {
    const result = await pool.query(
      `UPDATE packages SET ${sets} WHERE id = $${vals.length + 1}`,
      [...vals, params.packagesId]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/packages error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { packageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await pool.query(`DELETE FROM packages WHERE id = $1`, [params.packageId]);
  return NextResponse.json({ ok: true });
}
