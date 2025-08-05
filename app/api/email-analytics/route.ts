// app/api/email-analytics/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();
  try {
    // 1) Aggregate stats by status
    const statsResult = await client.query<{
      status: string;
      count: string;
    }>(`
      SELECT
        status,
        COUNT(*)::int AS count
      FROM public.email_logs
      GROUP BY status
    `);

    // initialize all counters to zero
    const stats: Record<string, number> = {
      total: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      spam: 0,
    };

    // fill in each status
    statsResult.rows.forEach((row) => {
      const s = row.status.toLowerCase();
      if (s in stats) stats[s] = parseInt(row.count, 10);
      stats.total += parseInt(row.count, 10);
    });

    // 2) Fetch the 10 most recent emails
    const recentResult = await client.query<{
      id: string;
      recipient_email: string;
      recipient_name: string | null;
      subject: string;
      status: string;
      sent_at: string;
      delivered_at: string | null;
      opened_at: string | null;
    }>(`
      SELECT
        id,
        recipient_email,
        recipient_name,
        subject,
        status,
        sent_at,
        delivered_at,
        opened_at
      FROM public.email_logs
      ORDER BY sent_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      stats,
      recent: recentResult.rows,
    });
  } catch (err: any) {
    console.error("Email analytics API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
