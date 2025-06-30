"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, type Profile } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user)
          } else {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error("Failed to get session:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email)

      if (!mounted) return

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (supabaseUser: User) => {
    try {
      console.log("Fetching profile for user:", supabaseUser.id)

      // Try to fetch from database with retries
      let profile = null
      let attempts = 0
      const maxAttempts = 3

      while (!profile && attempts < maxAttempts) {
        attempts++
        console.log(`Profile fetch attempt ${attempts}/${maxAttempts}`)

        const { data, error } = await supabase.from("profiles").select("*").eq("id", supabaseUser.id).maybeSingle()

        if (error) {
          console.warn(`Profile fetch attempt ${attempts} failed:`, error.message)
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempts)) // Exponential backoff
          }
        } else if (data) {
          profile = data
          console.log("Profile loaded from database:", profile)
        } else {
          console.log(`No profile found in database (attempt ${attempts})`)
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
          }
        }
      }

      if (profile) {
        setProfile(profile as Profile)
      } else {
        // Create fallback profile from user metadata
        console.log("Creating fallback profile from metadata")
        const fallbackProfile: Profile = {
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          full_name:
            supabaseUser.user_metadata?.full_name ??
            supabaseUser.user_metadata?.startup_name ??
            supabaseUser.email ??
            "User",
          role: (supabaseUser.user_metadata?.role as "manager" | "startup") ?? "startup",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfile(fallbackProfile)
      }

      // For startup users, check if their account is active
      if (
        supabaseUser.user_metadata?.role === "startup" ||
        (!profile && supabaseUser.user_metadata?.role !== "manager")
      ) {
        const { data: startupData, error: startupError } = await supabase
          .from("startups")
          .select("status")
          .eq("user_id", supabaseUser.id)
          .single()

        if (startupError) {
          console.warn("Could not check startup status:", startupError.message)
        } else if (startupData?.status === "inactive") {
          console.log("Startup account is inactive, signing out")
          await supabase.auth.signOut()
          alert("Your account has been deactivated. Please contact the program manager for assistance.")
          return
        }
      }
    } catch (error) {
      console.error("Profile fetch failed:", error)
      // Use fallback profile
      const fallbackProfile: Profile = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        full_name:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.startup_name ??
          supabaseUser.email ??
          "User",
        role: (supabaseUser.user_metadata?.role as "manager" | "startup") ?? "startup",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setProfile(fallbackProfile)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
    // Force redirect regardless of errors
    window.location.href = "/"
  }

  return <AuthContext.Provider value={{ user, profile, loading, signOut }}>{children}</AuthContext.Provider>
}
