// app/api/packages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { serviceId, name, description, price, hours } = await request.json();
  const { rows } = await pool.query(
    `INSERT INTO packages
       (service_id, name, description, price, hours)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [serviceId, name, description, price, hours]
  );
  return NextResponse.json(rows[0]);
}
