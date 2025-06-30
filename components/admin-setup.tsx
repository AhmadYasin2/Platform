"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// API route does the work server-side (service-role key)

export default function AdminSetup() {
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState("")

  const handleCreateAdmin = async () => {
    setCreating(true)
    setMessage("")

    try {
      const res = await fetch("/api/create-admin", { method: "POST" })

      let payload: any = {}
      try {
        payload = await res.json()
      } catch {
        // fall back to plain-text response
        const text = await res.text()
        payload = { ok: false, error: text }
      }

      if (payload.ok) {
        setMessage("✅ " + payload.message)
      } else {
        setMessage("❌ Error: " + (payload.error || "Unknown error"))
      }
    } catch (e: any) {
      setMessage("❌ Network error: " + e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center text-[#212121]">Admin Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-[#212121] space-y-2">
          <p>
            <strong>Email:</strong> admin@admin.com
          </p>
          <p>
            <strong>Password:</strong> IParkAdmin@123
          </p>
          <p>
            <strong>Role:</strong> Program Manager
          </p>
        </div>

        <Button
          onClick={handleCreateAdmin}
          disabled={creating}
          className="w-full bg-[#FF7A00] hover:bg-[#E66A00] text-white"
        >
          {creating ? "Creating Admin..." : "Create Admin User"}
        </Button>

        {message && (
          <div className="p-3 bg-gray-50 border rounded-md">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
