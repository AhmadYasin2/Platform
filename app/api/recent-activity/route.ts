// app/api/recent-activity/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();
  try {
    // 1) Last 3 service selections
    const svc = await client.query<{
      id: string;
      selected_at: string;
      hours_used: number;
      startup_name: string;
      package_name: string;
    }>(`
      SELECT
        ss.id,
        ss.selected_at::text       AS selected_at,
        ss.hours_used::int         AS hours_used,
        st.name        AS startup_name,
        pkg.name       AS package_name
      FROM public.startup_services ss
      JOIN public.startups AS st ON ss.startup_id = st.id
      JOIN public.packages AS pkg ON ss.package_id  = pkg.id
      ORDER BY ss.selected_at DESC
      LIMIT 3
    `);

    // 2) Last 2 startups
    const stp = await client.query<{
      id: string;
      name: string;
      created_at: string;
      contract_status: string;
    }>(`
      SELECT
        id,
        name,
        created_at::text   AS created_at,
        contract_status
      FROM public.startups
      ORDER BY created_at DESC
      LIMIT 2
    `);

    return NextResponse.json({
      recentServices: svc.rows,
      recentStartups: stp.rows,
    });
  } catch (err: any) {
    console.error("Recent activity API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
