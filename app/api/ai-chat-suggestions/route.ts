// app/api/ai-chat-suggestions/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

type Body = { dropPackageId?: string | null; addPackageId?: string | null };

type StartupRow = {
  id: string;
  marketplace_access: boolean | null;
  total_credits: number | null;
  used_credits: number | null;
};

type PackageRow = {
  id: string;
  price: number | null;
  hours: number | null;
  service_id: string | null;
  name: string;
};

type SelectionRow = {
  id: string;
  package_id: string;
  package_name: string;
  hours: number | null;
  service_id: string;
  service_name: string;
};

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dropPackageId, addPackageId } = (await req.json()) as Body;
    if (!dropPackageId && !addPackageId) {
      return NextResponse.json({ error: "Nothing to apply" }, { status: 400 });
    }

    // Resolve startup for this user
    const sRes = await client.query<StartupRow>(
      `SELECT id, marketplace_access, total_credits, used_credits
         FROM startups
        WHERE user_id = $1
        LIMIT 1`,
      [session.user.id]
    );
    if (sRes.rowCount === 0) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }
    const startup = sRes.rows[0];
    if (startup.marketplace_access === false) {
      return NextResponse.json(
        { error: "Marketplace disabled for this startup" },
        { status: 403 }
      );
    }

    // Fetch involved packages (if any)
    const ids = [dropPackageId, addPackageId].filter(Boolean) as string[];
    const pMap = new Map<string, PackageRow>();
    if (ids.length) {
      const pRes = await client.query<PackageRow>(
        `SELECT id, price, hours, service_id, name
           FROM packages
          WHERE id = ANY($1::uuid[])`,
        [ids]
      );
      for (const row of pRes.rows) pMap.set(row.id, row);
    }

    if (dropPackageId && !pMap.has(dropPackageId)) {
      return NextResponse.json({ error: "Drop package not found" }, { status: 404 });
    }
    if (addPackageId && !pMap.has(addPackageId)) {
      return NextResponse.json({ error: "Add package not found" }, { status: 404 });
    }
    if (addPackageId) {
      const addPkg = pMap.get(addPackageId)!;
      if (!addPkg.service_id) {
        return NextResponse.json(
          { error: "Package not linked to a service" },
          { status: 409 }
        );
      }
    }

    // Credits guard (assumes credits == price)
    const addCredits = addPackageId ? (pMap.get(addPackageId)!.price ?? 0) : 0;
    const dropCredits = dropPackageId ? (pMap.get(dropPackageId)!.price ?? 0) : 0;
    const newUsed = (startup.used_credits ?? 0) - dropCredits + addCredits;
    if (startup.total_credits != null && newUsed > startup.total_credits) {
      return NextResponse.json({ error: "Insufficient credits for this change" }, { status: 400 });
    }

    await client.query("BEGIN");

    if (dropPackageId) {
      await client.query(
        `DELETE FROM startup_services
          WHERE startup_id = $1 AND package_id = $2`,
        [startup.id, dropPackageId]
      );
    }

    if (addPackageId) {
      await client.query(
        `INSERT INTO startup_services (startup_id, package_id, hours_used)
         VALUES ($1, $2, 0)
         ON CONFLICT (startup_id, package_id) DO NOTHING`,
        [startup.id, addPackageId]
      );
    }

    await client.query(
      `UPDATE startups
          SET used_credits = $1, updated_at = NOW()
        WHERE id = $2`,
      [newUsed, startup.id]
    );

    const selRes = await client.query<SelectionRow>(
      `SELECT ss.id,
              p.id  AS package_id,
              p.name AS package_name,
              p.hours,
              s.id  AS service_id,
              s.name AS service_name
         FROM startup_services ss
         JOIN packages p ON p.id = ss.package_id
         JOIN services s ON s.id = p.service_id
        WHERE ss.startup_id = $1`,
      [startup.id]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, selections: selRes.rows }, { status: 200 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ai-chat-suggestions POST error", err);
    return NextResponse.json({ error: "Failed to apply change" }, { status: 500 });
  } finally {
    client.release();
  }
}
