import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST() {
  try {
    const email = "admin@admin.com"
    const password = "IParkAdmin@123"

    // Check if admin already exists
    const { data: existing } = await supabaseAdmin.from("profiles").select("id, role").eq("email", email).maybeSingle()

    if (existing) {
      // If exists but wrong role, update it
      if (existing.role !== "manager") {
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ role: "manager", full_name: "Program Manager" })
          .eq("id", existing.id)

        if (updateError) {
          console.error("Update error:", updateError)
          return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 })
        }
        return NextResponse.json({ ok: true, message: "Admin role updated to manager" })
      }
      return NextResponse.json({ ok: true, message: "Admin already exists with correct role" })
    }

    // Create auth user with email confirmation bypassed
    const { data: auth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "manager",
        full_name: "Program Manager",
      },
    })

    if (authErr) {
      console.error("Auth error:", authErr)
      return NextResponse.json({ ok: false, error: authErr.message }, { status: 400 })
    }

    if (!auth.user) {
      return NextResponse.json({ ok: false, error: "No user created" }, { status: 400 })
    }

    // Create profile row with manager role
    const { error: profErr } = await supabaseAdmin.from("profiles").insert({
      id: auth.user.id,
      email,
      full_name: "Program Manager",
      role: "manager", // Explicitly set as manager
    })

    if (profErr) {
      console.error("Profile error:", profErr)
      return NextResponse.json({ ok: false, error: profErr.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      message: "Admin user created successfully as Program Manager. You can now login with the provided credentials.",
    })
  } catch (err: any) {
    console.error("create-admin route error:", err)
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Server error",
      },
      { status: 500 },
    )
  }
}
