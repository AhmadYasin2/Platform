// app/api/startups/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { pool } from "@/lib/db"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Read ?status=active (or any status)
  const url = new URL(request.url)
  const statusFilter = url.searchParams.get("status")

  const { rows } = await pool.query(
    `
    SELECT
      id, name, founder_name, email, logo_url,
      contract_status, total_credits, used_credits,
      marketplace_access
    FROM startups
    WHERE ($1::text IS NULL OR status = $1)
    ORDER BY created_at DESC
    `,
    [statusFilter]
  )

  return NextResponse.json(rows)
}
