import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client (service-role key has full DB access)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("startups").update({ status }).eq("id", id)

    if (error) {
      console.error("Admin status update error:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 })
  }
}
