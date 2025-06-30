import { supabase } from "@/lib/supabase"

export async function createAdminUser() {
  try {
    // First check if admin already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "admin@admin.com")
      .single()

    if (existingProfile) {
      console.log("Admin user already exists")
      return { success: true, message: "Admin user already exists" }
    }

    // Create the admin user using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "admin@admin.com",
      password: "IParkAdmin@123",
    })

    if (authError) {
      console.error("Auth error:", authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error("No user data returned")
    }

    // Create the profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: "admin@admin.com",
      full_name: "Program Manager",
      role: "manager",
    })

    if (profileError) {
      console.error("Profile error:", profileError)
      throw profileError
    }

    return { success: true, message: "Admin user created successfully" }
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return { success: false, error: error.message }
  }
}
