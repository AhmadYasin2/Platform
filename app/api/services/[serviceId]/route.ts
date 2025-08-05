// app/api/services/[serviceId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, description } = await request.json();
  await pool.query(
    `UPDATE services SET name = $1, description = $2 WHERE id = $3`,
    [name, description, params.serviceId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { serviceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await pool.query(`DELETE FROM services WHERE id = $1`, [params.serviceId]);
  return NextResponse.json({ ok: true });
}
