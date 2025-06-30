import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const { name, founderName, email, password, totalCredits } = await request.json()

    console.log("=== STARTUP CREATION DEBUG ===")
    console.log("Input data:", { name, founderName, email, password: "***", totalCredits })

    // Validate input
    if (!name || !founderName || !email || !password) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if startup already exists
    const { data: existing } = await supabaseAdmin.from("startups").select("id").eq("email", email).maybeSingle()

    if (existing) {
      console.log("Startup already exists with email:", email)
      return NextResponse.json({ ok: false, error: "Startup with this email already exists" }, { status: 400 })
    }

    // Check if auth user already exists
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingAuthUser.users.find((u) => u.email === email)

    if (userExists) {
      console.log("Auth user already exists with email:", email)
      return NextResponse.json({ ok: false, error: "User with this email already exists" }, { status: 400 })
    }

    console.log("Creating auth user...")

    // Create auth user with proper metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "startup",
        startup_name: name,
        founder_name: founderName,
        full_name: name,
      },
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json({ ok: false, error: `Auth error: ${authError.message}` }, { status: 400 })
    }

    if (!authData.user) {
      console.error("No user data returned from auth creation")
      return NextResponse.json({ ok: false, error: "No user created" }, { status: 400 })
    }

    console.log("Auth user created successfully:", {
      id: authData.user.id,
      email: authData.user.email,
      confirmed: authData.user.email_confirmed_at,
      metadata: authData.user.user_metadata,
    })

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verify profile was created, if not create it manually
    const { data: profileCheck } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle()

    if (!profileCheck) {
      console.log("Profile not created by trigger, creating manually...")
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: authData.user.id,
        email,
        full_name: name,
        role: "startup",
      })

      if (profileError) {
        console.error("Manual profile creation error:", profileError)
        // Don't fail here, continue with startup creation
      }
    }

    console.log("Creating startup record...")
    const { data: startupData, error: startupError } = await supabaseAdmin
      .from("startups")
      .insert({
        name,
        founder_name: founderName,
        email,
        total_credits: totalCredits || 1000,
        used_credits: 0,
        contract_status: "Pending",
        status: "active",
        marketplace_access: true,
        user_id: authData.user.id,
      })
      .select()
      .single()

    if (startupError) {
      console.error("Startup record creation error:", startupError)

      // If startup creation fails, clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError)
      }

      return NextResponse.json({ ok: false, error: `Startup error: ${startupError.message}` }, { status: 400 })
    }

    console.log("Startup record created successfully:", startupData)

    // Test the credentials immediately with a longer wait
    console.log("Waiting before testing credentials...")
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Testing credentials...")
    const { data: testAuth, error: testError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (testError) {
      console.error("Credential test failed:", testError)
      // Don't fail the creation, just warn
      console.warn("User created but login test failed - this might be a timing issue")
    } else {
      console.log("Credentials test successful:", testAuth.user?.email)
      // Sign out the test session
      await supabaseAdmin.auth.signOut()
    }

    console.log("=== STARTUP CREATION COMPLETE ===")

    return NextResponse.json({
      ok: true,
      message: "Startup created successfully",
      credentials: { email, password },
      userId: authData.user.id,
      startupId: startupData.id,
      debug: {
        authUserId: authData.user.id,
        emailConfirmed: authData.user.email_confirmed_at,
        testLoginWorked: !testError,
        profileExists: !!profileCheck,
      },
    })
  } catch (err: any) {
    console.error("=== STARTUP CREATION ERROR ===", err)
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Server error",
      },
      { status: 500 },
    )
  }
}
