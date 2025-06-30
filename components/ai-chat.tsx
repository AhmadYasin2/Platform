"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, MessageSquare, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface ChatSession {
  id: string
  session_title: string
  created_at: string
}

export default function AIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [startup, setStartup] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchStartupData()
      fetchChatSessions()
    }
  }, [user])

  useEffect(() => {
    if (currentSession) {
      fetchMessages()
    }
  }, [currentSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchStartupData = async () => {
    try {
      const { data, error } = await supabase.from("startups").select("*").eq("user_id", user?.id).single()

      if (error) throw error
      setStartup(data)
    } catch (error) {
      console.error("Error fetching startup data:", error)
    }
  }

  const fetchChatSessions = async () => {
    if (!startup) return

    try {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .select("*")
        .eq("startup_id", startup.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setSessions(data || [])

      // Auto-select first session or create new one
      if (data && data.length > 0) {
        setCurrentSession(data[0])
      } else {
        createNewSession()
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error)
    }
  }

  const fetchMessages = async () => {
    if (!currentSession) return

    try {
      const { data, error } = await supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("session_id", currentSession.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const createNewSession = async () => {
    if (!startup) return

    try {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .insert({
          startup_id: startup.id,
          session_title: `Chat ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single()

      if (error) throw error

      const newSession = data as ChatSession
      setSessions([newSession, ...sessions])
      setCurrentSession(newSession)
      setMessages([])
    } catch (error) {
      console.error("Error creating new session:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || !startup || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    setLoading(true)

    try {
      // Call AI API
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSession.id,
          startupId: startup.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const { response: aiResponse, context } = await response.json()

      // Refresh messages to show the conversation
      await fetchMessages()

      // Update session timestamp
      await supabase
        .from("ai_chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", currentSession.id)
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!startup) {
    return (
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF7A00]" />
          <p className="text-[#212121]">Loading AI assistant...</p>
        </CardContent>
      </Card>
    )
  }

  const availableCredits = startup.total_credits - startup.used_credits

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
      {/* Sessions Sidebar */}
      <Card className="bg-white shadow-sm border-0 lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[#FF7A00]" />
              <span>Chat History</span>
            </CardTitle>
            <Button onClick={createNewSession} size="sm" className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
              New Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSession(session)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSession?.id === session.id
                    ? "bg-[#FF7A00] text-white"
                    : "bg-[#F9F7F1] hover:bg-gray-200 text-[#212121]"
                }`}
              >
                <p className="text-sm font-medium truncate">{session.session_title}</p>
                <p className="text-xs opacity-70">{new Date(session.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-sm text-[#212121] opacity-70 text-center py-4">No chat history yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="bg-white shadow-sm border-0 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#FF7A00]" />
              <span>AI Startup Advisor</span>
            </CardTitle>
            <Badge variant="outline" className="text-[#FF7A00] border-[#FF7A00]">
              {availableCredits} credits available
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-[#FF7A00] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#212121] mb-2">Welcome to your AI Startup Advisor!</h3>
                <p className="text-sm text-[#212121] opacity-70 max-w-md mx-auto">
                  I'm here to help you choose the best services for your startup based on your needs, budget, and goals.
                  Ask me anything about our available services!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user" ? "bg-[#FF7A00] text-white" : "bg-[#F9F7F1] text-[#212121]"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-[#1BC9C9] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#F9F7F1] p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF7A00]" />
                    <span className="text-sm text-[#212121]">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about services, get recommendations, or discuss your startup needs..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
