// app/api/ai-chat/route.ts
import { NextResponse } from "next/server"
import { xai } from "@ai-sdk/xai"
import { generateText } from "ai"
import { pool } from "@/lib/db"
import { buildStartupContext, buildSystemPrompt, buildUserPrompt } from "@/lib/ai-context"
import { grokRateLimiter } from "@/lib/rate-limiter"

export async function POST(request: Request) {
  try {
    const { message, sessionId, startupId } = await request.json()
    if (!message || !sessionId || !startupId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1) Rate limiting
    await grokRateLimiter.waitForSlot()

    // 2) Build context
    const context = await buildStartupContext(startupId)

    // 3) Save user message
    await pool.query(
      `INSERT INTO ai_chat_messages (session_id, role, content)
       VALUES ($1, $2, $3)`,
      [sessionId, "user", message]
    )

    // 4) Generate AI response
    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(message, context),
      maxTokens: 1000,
      temperature: 0.7,
    })

    const filteredResponse = filterPrivateContent(text)

    // 5) Save assistant reply
    await pool.query(
      `INSERT INTO ai_chat_messages (session_id, role, content, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        sessionId,
        "assistant",
        filteredResponse,
        JSON.stringify({
          model: "grok-3-mini",
          tokens_used: text.length,
          context_startup: context.startup.name,
        }),
      ]
    )

    return NextResponse.json({
      response: filteredResponse,
      context: {
        availableCredits: context.startup.total_credits - context.startup.used_credits,
        selectedServices: context.selectedServices.length,
      },
    })
  } catch (error: any) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

function filterPrivateContent(text: string): string {
  const privatePatterns = [
    /manager[- ]?only/gi,
    /private[- ]?note/gi,
    /confidential/gi,
    /internal[- ]?discussion/gi,
    /off[- ]?record/gi,
  ]
  let filtered = text
  for (const pattern of privatePatterns) {
    filtered = filtered.replace(pattern, "[REDACTED]")
  }
  return filtered
}
