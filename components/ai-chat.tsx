"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, signIn } from "next-auth/react";
import { Bot, User, Loader2, MessageSquare, Sparkles, AlertTriangle } from "lucide-react";
import PlanRenderer from "@/components/plan-renderer";
import type { AdvisorPlan } from "@/lib/advisor";

type ServiceLite = { id: string; name: string };

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  session_title: string;
  created_at: string;
}

export default function AIChat() {
  const { status: authStatus } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------- helpers ----------
  const isAdvisorPlan = (obj: any): obj is AdvisorPlan =>
    obj &&
    typeof obj === "object" &&
    obj.version === "1.0" &&
    Array.isArray(obj.recommended) &&
    Array.isArray(obj.phases);

  const tryExtractJsonBlock = (text: string): string | null => {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
    const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
    if (fenced?.[1]) return fenced[1].trim();
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last > first) return text.slice(first, last + 1);
    return null;
  };

  const parseAdvisorPlan = (text: string): AdvisorPlan | null => {
    try {
      const candidate = tryExtractJsonBlock(text) ?? text;
      const parsed = JSON.parse(candidate);
      return isAdvisorPlan(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const catalogById = useMemo(
    () => Object.fromEntries(servicesCatalog.map((s) => [s.id, s])),
    [servicesCatalog]
  );

  // ---------- data fetchers ----------
  const fetchChatSessions = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/ai-chat-sessions`);
      if (!res.ok) throw new Error(await res.text());
      const data: ChatSession[] = await res.json();
      setSessions(data);

      if (data.length > 0) {
        setCurrentSession((prev) => prev ?? data[0]);
      } else {
        // auto-create first session if none exists
        const newRes = await fetch("/api/ai-chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (newRes.ok) {
          const newSession: ChatSession = await newRes.json();
          setSessions([newSession]);
          setCurrentSession(newSession);
        } else {
          setError("Couldn't create a new chat session automatically.");
        }
      }
    } catch (err: any) {
      console.error("Error fetching chat sessions:", err);
      setError("Couldn't load chat sessions.");
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!currentSession) return;
    try {
      setError(null);
      const res = await fetch(`/api/ai-chat-messages?sessionId=${currentSession.id}`);
      if (!res.ok) throw new Error(await res.text());
      const data: Message[] = await res.json();
      setMessages(data);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError("Couldn't load messages.");
    }
  }, [currentSession]);

  const createNewSession = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/ai-chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      const newSession: ChatSession = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      setServicesCatalog([]);
    } catch (err: any) {
      console.error("Error creating new session:", err);
      setError("Couldn't create a new chat session.");
    }
  }, []);

  // ---------- actions: apply swaps ----------
  async function unselectPackage(packageId: string) {
    const res = await fetch("/api/marketplace/unselect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function selectPackage(packageId: string) {
    const res = await fetch("/api/marketplace/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  const applySwap = async (dropId?: string, addId?: string) => {
    try {
      setError(null);
      if (dropId) await unselectPackage(dropId);
      if (addId) await selectPackage(addId);
      await fetchMessages();
      alert("Selection updated.");
    } catch (err: any) {
      console.error("Error applying swap:", err);
      setError("Couldn't apply the suggested change.");
    }
  };

  // ---------- send message ----------
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !currentSession || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setLoading(true);
    setError(null);

    // Optimistic bubble
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSession.id,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Preferred contract: { plan, servicesCatalog }
      if (data?.plan && Array.isArray(data?.servicesCatalog)) {
        setServicesCatalog(data.servicesCatalog as ServiceLite[]);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: JSON.stringify(data.plan),
            created_at: new Date().toISOString(),
          },
        ]);
      } else if (data?.recommendations) {
        // Back-compat with older API shape
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: JSON.stringify(data.recommendations, null, 2),
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        await fetchMessages();
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  }, [currentSession, fetchMessages, inputMessage, loading]);

  // ---------- effects ----------
  useEffect(() => {
    if (authStatus === "unauthenticated") signIn();
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchChatSessions();
    }
  }, [authStatus, fetchChatSessions]);

  useEffect(() => {
    if (currentSession) {
      fetchMessages();
    }
  }, [currentSession, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ---------- render helpers ----------
  const renderAssistantBubble = (message: Message) => {
    const plan = parseAdvisorPlan(message.content);

    if (plan) {
      return (
        <div className="flex items-start space-x-3 justify-start">
          <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="max-w-[100%] w-full">
            <PlanRenderer plan={plan} catalogById={catalogById} />
            {plan.swaps?.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-[#212121]">Suggested changes:</p>
                {plan.swaps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm text-[#212121]">
                      {s.dropId ? `Drop: ${catalogById[s.dropId]?.name ?? s.dropId}` : null}
                      {s.dropId && s.addId ? " → " : ""}
                      {s.addId ? `Add: ${catalogById[s.addId]?.name ?? s.addId}` : null}
                    </span>
                    <Button
                      size="sm"
                      className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
                      onClick={() => applySwap(s.dropId, s.addId)}
                    >
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {}}>
                      Dismiss
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs opacity-70 mt-2 text-[#212121]">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // prose fallback
    return (
      <div className="flex items-start space-x-3 justify-start">
        <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="max-w-[80%] p-3 rounded-lg bg-[#F9F7F1] text-[#212121] whitespace-pre-wrap">
          {message.content}
          <p className="text-xs opacity-70 mt-1">
            {new Date(message.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

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
            <Button
              onClick={createNewSession}
              size="sm"
              className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
            >
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
                <p className="text-xs opacity-70">
                  {new Date(session.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-sm text-[#212121] opacity-70 text-center py-4">
                No chat history yet
              </p>
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
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Error banner */}
          {error && (
            <div className="mb-3 flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <Button variant="ghost" className="ml-auto h-6 px-2" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Session setup banner */}
          {!currentSession && (
            <div className="mb-3 p-3 rounded-md bg-amber-50 text-amber-800 text-sm">
              Setting up your first chat… If this persists, click “New Chat”.
            </div>
          )}

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-[#FF7A00] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#212121] mb-2">
                  Welcome to your AI Startup Advisor!
                </h3>
                <p className="text-sm text-[#212121] opacity-70 max-w-md mx-auto">
                  I’ll help you choose the best services for your startup and turn meeting notes into clear action.
                </p>
              </div>
            )}

            {messages.map((message) => {
              if (message.role === "assistant") {
                return <Fragment key={message.id}>{renderAssistantBubble(message)}</Fragment>;
              }
              // user bubble
              return (
                <div key={message.id} className="flex items-start space-x-3 justify-end">
                  <div className="max-w-[80%] p-3 rounded-lg bg-[#FF7A00] text-white">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-[#1BC9C9] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              );
            })}

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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                currentSession
                  ? "Ask about services, or say “summarize my last meeting”…"
                  : "Creating chat…"
              }
              className="flex-1"
              disabled={loading || !currentSession}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading || !currentSession}
              className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
