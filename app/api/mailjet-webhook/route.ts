import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(request: Request) {
  try {
    const events = await request.json()

    console.log("Mailjet webhook received:", events)

    for (const event of events) {
      const { MessageID, event: eventType, time, email } = event

      // Map Mailjet events to our status
      let status = eventType
      let timestampField = null

      switch (eventType) {
        case "sent":
          status = "sent"
          break
        case "delivered":
          status = "delivered"
          timestampField = "delivered_at"
          break
        case "open":
          status = "opened"
          timestampField = "opened_at"
          break
        case "click":
          status = "clicked"
          break
        case "bounce":
          status = "bounced"
          break
        case "spam":
          status = "spam"
          break
        default:
          console.log("Unknown event type:", eventType)
          continue
      }

      // Update email log
      const updateData: any = { status }
      if (timestampField) {
        updateData[timestampField] = new Date(time * 1000).toISOString()
      }

      const { error } = await supabaseAdmin.from("email_logs").update(updateData).eq("mailjet_message_id", MessageID)

      if (error) {
        console.error("Error updating email log:", error)
      } else {
        console.log(`Updated email ${MessageID} status to ${status}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mailjet webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
