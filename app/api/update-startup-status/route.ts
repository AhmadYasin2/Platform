// app/api/update-startup-status/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing id or status" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE startups SET status = $1 WHERE id = $2`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Startup not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Update startup status error:", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
