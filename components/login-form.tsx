"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { profile } = useAuth()

  // Redirect if already logged in
  if (profile) {
    if (profile.role === "manager") {
      router.push("/dashboard")
    } else {
      router.push("/startup-dashboard")
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    try {
      console.log("=== LOGIN ATTEMPT ===")
      console.log("Email:", trimmedEmail)
      console.log("Password length:", trimmedPassword.length)

      // First, try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (error) {
        console.error("Login error:", error)

        // Provide more specific error messages
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials and try again.")
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("Please check your email and confirm your account before logging in.")
        } else if (error.message.includes("Too many requests")) {
          throw new Error("Too many login attempts. Please wait a few minutes and try again.")
        } else {
          throw new Error(`Login failed: ${error.message}`)
        }
      }

      if (!data.user) {
        throw new Error("No user data received. Please try again.")
      }

      console.log("Login successful!")
      console.log("User ID:", data.user?.id)
      console.log("User email:", data.user?.email)
      console.log("User metadata:", data.user?.user_metadata)

      // Wait a moment for the auth state to propagate
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get user profile to determine role and redirect
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, id")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        console.warn("Profile error, using metadata:", profileError)
        // Fallback to user metadata
        const role = data.user.user_metadata?.role || "startup"
        console.log("Using fallback role:", role)

        if (role === "manager") {
          router.push("/dashboard")
        } else {
          // For startups, check if they're active
          const { data: startupData } = await supabase
            .from("startups")
            .select("status")
            .eq("user_id", data.user.id)
            .single()

          if (startupData?.status === "inactive") {
            await supabase.auth.signOut()
            throw new Error("Your account has been deactivated. Please contact the program manager.")
          }

          router.push("/startup-dashboard")
        }
      } else {
        console.log("Profile role:", profile.role)

        if (profile.role === "manager") {
          router.push("/dashboard")
        } else {
          // For startups, check if they're active
          const { data: startupData } = await supabase
            .from("startups")
            .select("status")
            .eq("user_id", data.user.id)
            .single()

          if (startupData?.status === "inactive") {
            await supabase.auth.signOut()
            throw new Error("Your account has been deactivated. Please contact the program manager.")
          }

          router.push("/startup-dashboard")
        }
      }
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(error.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-[#212121]">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#212121] font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-gray-300 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#212121] font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-gray-300 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#FF7A00] hover:bg-[#E66A00] text-white font-medium transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* <div className="mt-6 text-xs text-gray-500 text-center space-y-2">
          <p>Demo credentials:</p>
          <p>
            <strong>Manager:</strong> admin@admin.com / IParkAdmin@123
          </p>
          <p>
            <strong>Startup:</strong> Credentials are provided when startups are added by managers
          </p>
        </div> */}
      </CardContent>
    </Card>
  )
}
