// app/api/dashboard-stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function GET() {
  // 1) Only managers get to see these stats
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2) Run all four counts in parallel
  const [
    totalRes,
    signedRes,
    meetingsRes,
    servicesRes,
  ] = await Promise.all([
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM startups WHERE status = 'active'`
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM startups WHERE status = 'active' AND contract_status = 'Signed'`
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) 
         FROM meetings 
         WHERE meeting_date >= CURRENT_DATE `
    ),
    pool.query<{ count: string }>(`SELECT COUNT(*) FROM services`),
  ]);

  // 3) Parse counts from string → number
  const stats = {
    totalStartups:   parseInt(totalRes.rows[0].count, 10),
    signedContracts: parseInt(signedRes.rows[0].count, 10),
    thisWeekMeetings:parseInt(meetingsRes.rows[0].count, 10),
    activeServices:  parseInt(servicesRes.rows[0].count, 10),
  };

  return NextResponse.json(stats);
}
