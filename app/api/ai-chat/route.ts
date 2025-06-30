import { NextResponse } from "next/server"
import { xai } from "@ai-sdk/xai"
import { generateText } from "ai"
import { supabase } from "@/lib/supabase"
import { buildStartupContext, buildSystemPrompt, buildUserPrompt } from "@/lib/ai-context"
import { grokRateLimiter } from "@/lib/rate-limiter"

export async function POST(request: Request) {
  try {
    const { message, sessionId, startupId } = await request.json()

    if (!message || !sessionId || !startupId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Wait for rate limit slot
    await grokRateLimiter.waitForSlot()

    // Build context for the startup
    const context = await buildStartupContext(startupId)

    // Save user message
    await supabase.from("ai_chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    })

    // Generate AI response
    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(message, context),
      maxTokens: 1000,
      temperature: 0.7,
    })

    // Filter out any potential private information
    const filteredResponse = filterPrivateContent(text)

    // Save AI response
    await supabase.from("ai_chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: filteredResponse,
      metadata: {
        model: "grok-3-mini",
        tokens_used: text.length,
        context_startup: context.startup.name,
      },
    })

    return NextResponse.json({
      response: filteredResponse,
      context: {
        availableCredits: context.startup.total_credits - context.startup.used_credits,
        selectedServices: context.selectedServices.length,
      },
    })
  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

function filterPrivateContent(text: string): string {
  // Remove any potential private information patterns
  const privatePatterns = [
    /manager[- ]?only/gi,
    /private[- ]?note/gi,
    /confidential/gi,
    /internal[- ]?discussion/gi,
    /off[- ]?record/gi,
  ]

  let filtered = text
  privatePatterns.forEach((pattern) => {
    filtered = filtered.replace(pattern, "[REDACTED]")
  })

  return filtered
}
