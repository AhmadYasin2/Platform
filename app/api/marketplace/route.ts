// app/api/marketplace/route.ts
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

  // 1) Fetch startup
  const { rows: startupRows } = await pool.query(
    `SELECT *
     FROM startups
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );
  const startup = startupRows[0] || null;
  if (!startup) {
    return NextResponse.json({ error: "No startup found" }, { status: 404 });
  }

  // 2) If no access, return early
  if (!startup.marketplace_access) {
    return NextResponse.json({ startup, services: [], selectedServices: [] });
  }

  // 3) Fetch services & packages
  const { rows: services } = await pool.query(
    `SELECT * FROM services ORDER BY created_at`
  );
  const { rows: packages } = await pool.query(
    `SELECT * FROM packages ORDER BY created_at`
  );

  // 4) Group
  type Service = typeof services[number];
  type Package = typeof packages[number];
  const servicesWithPackages = (services as Service[]).map((s) => ({
    ...s,
    packages: (packages as Package[]).filter((p) => p.service_id === s.id),
  }));

  // 5) Fetch selected
  const { rows: selected } = await pool.query<{ package_id: string }>(
    `SELECT package_id FROM startup_services WHERE startup_id = $1`,
    [startup.id]
  );
  const selectedServices = selected.map((r) => r.package_id);

  return NextResponse.json({ startup, services: servicesWithPackages, selectedServices });
}
