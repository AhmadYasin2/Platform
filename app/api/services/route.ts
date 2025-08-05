// app/api/services/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all services & packages
  const [svcRes, pkgRes] = await Promise.all([
    pool.query("SELECT * FROM services ORDER BY created_at"),
    pool.query("SELECT * FROM packages ORDER BY created_at"),
  ]);

  type ServiceRow = typeof svcRes.rows[number];
  type PackageRow = typeof pkgRes.rows[number];

  const services = (svcRes.rows as ServiceRow[]).map((s) => ({
    ...s,
    packages: (pkgRes.rows as PackageRow[]).filter((p) => p.service_id === s.id),
  }));

  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, description } = await request.json();
  const { rows } = await pool.query(
    `INSERT INTO services (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [name, description]
  );
  const svc = rows[0];
  return NextResponse.json({ ...svc, packages: [] });
}
