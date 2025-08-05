// app/api/contract-status/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{
      contract_status: string;
      count: string;               // note: PG returns COUNT(*) as string
    }>(`
      SELECT
        contract_status,
        COUNT(*)::int AS count
      FROM startups
      WHERE status = 'active'
      GROUP BY contract_status
    `);

    const result: Record<string, number> = {
      Signed: 0,
      Sent: 0,
      Pending: 0,
    };

    for (const row of rows) {
      // parseInt converts the string to a number
      result[row.contract_status] = parseInt(row.count, 10);
    }

    return NextResponse.json(result);
  } finally {
    client.release();
  }
}
