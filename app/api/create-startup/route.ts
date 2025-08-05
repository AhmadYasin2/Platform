// app/api/create-startup/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    // Remove original destructuring...
    // Instead:
    const body = await request.json();
    const name = body.name;
    const founderName = body.founderName;
    const password = body.password;
    const totalCredits = body.totalCredits;
    const email = (body.email as string).trim().toLowerCase();

    // --- 1) Validate ---
    if (!name || !founderName || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // --- 2) Ensure no existing user ---
      const result = await client.query(
        `SELECT 1 FROM users WHERE email = $1`,
        [email]
      );
      const userExists = result.rowCount ?? 0;
      if (userExists > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { ok: false, error: "User with this email already exists" },
          { status: 400 }
        );
      }

      // --- 3) Hash password & insert user ---
      const passwordHash = await bcrypt.hash(password, 10);
      const {
        rows: [{ id: userId }],
      } = await client.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'startup')
         RETURNING id`,
        [email, passwordHash]
      );

      // --- 4) Insert profile ---
      await client.query(
        `INSERT INTO profiles (id, email, full_name, role)
         VALUES ($1, $2, $3, 'startup')`,
        [userId, email, name]
      );

      // --- 5) Insert startup record ---
      const {
        rows: [{ id: startupId }],
      } = await client.query<{ id: string }>(
        `INSERT INTO startups
           (name, founder_name, email, total_credits, used_credits,
            contract_status, status, marketplace_access, user_id)
         VALUES
           ($1, $2, $3, $4, 0, 'Pending', 'active', true, $5)
         RETURNING id`,
        [name, founderName, email, totalCredits ?? 1000, userId]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        ok: true,
        message: "Startup created successfully",
        credentials: { email, password },
        userId,
        startupId,
      });
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error("Create-startup transaction error:", err);
      return NextResponse.json(
        { ok: false, error: err.message || "Transaction failed" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Unexpected create-startup error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
