import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role`,
    [email, hash]
  );
  return NextResponse.json(rows[0]);
}
