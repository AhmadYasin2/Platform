"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, signIn } from "next-auth/react";
import { Bot, User, Loader2, MessageSquare, Sparkles, AlertTriangle } from "lucide-react";

type ServiceLite = { id: string; name: string; description?: string };
type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string };
type ChatSession = { id: string; session_title: string; created_at: string };

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

  // Map by PACKAGE id
  const catalogById = useMemo(
    () => Object.fromEntries(servicesCatalog.map((s) => [s.id, s])),
    [servicesCatalog]
  );

  // Robust JSON extractor (handles fenced code)
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

  const parseV2Plan = (text: string): any | null => {
    try {
      const candidate = tryExtractJsonBlock(text) ?? text;
      const obj = JSON.parse(candidate);
      return obj && obj.version === "2.0" && Array.isArray(obj.cards) ? obj : null;
    } catch {
      return null;
    }
  };

  // data fetchers
  const fetchChatSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai-chat-sessions`);
      if (!res.ok) throw new Error(await res.text());
      const data: ChatSession[] = await res.json();
      setSessions(data);
      setCurrentSession((prev) => prev ?? data[0] ?? null);
    } catch (e) {
      setError("Couldn't load chat sessions.");
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!currentSession) return;
    try {
      const res = await fetch(`/api/ai-chat-messages?sessionId=${currentSession.id}`);
      if (!res.ok) throw new Error(await res.text());
      const data: Message[] = await res.json();
      setMessages(data);
    } catch (e) {
      setError("Couldn't load messages.");
    }
  }, [currentSession]);

  const createNewSession = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-chat-sessions", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const newSession: ChatSession = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      setServicesCatalog([]);
    } catch (e) {
      setError("Couldn't create a new chat session.");
    }
  }, []);

  // select (atomic endpoint)
  async function selectPackage(packageId: string) {
    const res = await fetch("/api/ai-chat-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropPackageId: null, addPackageId: packageId }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "Failed to select package");
    }
  }

  // send
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !currentSession || loading) return;
    const msg = inputMessage.trim();
    setInputMessage("");
    setLoading(true);
    setError(null);

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: msg, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: currentSession.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

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
      } else {
        await fetchMessages();
      }
    } catch (e) {
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  }, [currentSession, inputMessage, loading, fetchMessages]);

  // effects
  useEffect(() => {
    if (authStatus === "unauthenticated") signIn();
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === "authenticated") fetchChatSessions();
  }, [authStatus, fetchChatSessions]);

  useEffect(() => {
    if (currentSession) fetchMessages();
  }, [currentSession, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // render
  const renderAssistant = (message: Message) => {
    const plan = parseV2Plan(message.content);
    if (plan) {
      return (
        <div className="flex items-start space-x-3 justify-start">
          <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="w-full">
            {(plan.preface || plan.basedOnRequest) && (
              <div className="mb-3 p-3 rounded-md bg-[#F9F7F1] text-[#212121] text-sm">
                {plan.preface && <div>{plan.preface}</div>}
                {plan.basedOnRequest && (
                  <div className="mt-1 opacity-80">
                    Based on your request: <em>{plan.basedOnRequest}</em>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3">
              {plan.cards.map((c: any) => (
                <div key={c.id} className="p-4 rounded-lg border bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[#212121]">
                        {catalogById[c.id]?.name ?? c.title}
                      </div>
                      {c.description && (
                        <div className="text-sm text-[#212121] opacity-80 mt-1 whitespace-pre-wrap">
                          {c.description}
                        </div>
                      )}
                      <div className="text-xs text-[#212121] opacity-70 mt-2">
                        {c.credits != null ? <>Credits: {c.credits} · </> : null}
                        {c.hours != null ? <>Hours: {c.hours}</> : null}
                      </div>
                      {Array.isArray(c.alignment) && c.alignment.length > 0 && (
                        <ul className="mt-2 text-sm list-disc pl-5 text-[#212121]">
                          {c.alignment.map((a: string, i: number) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
                      onClick={async () => {
                        try {
                          await selectPackage(c.id);
                          // optional: feedback / refresh
                        } catch (e: any) {
                          setError(e.message || "Failed to select package");
                        }
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs opacity-70 mt-3 text-[#212121]">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // plain text fallback (legacy messages)
    return (
      <div className="flex items-start space-x-3 justify-start">
        <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center">
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
      {/* Sessions */}
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

      {/* Chat */}
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
          {error && (
            <div className="mb-3 flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <Button variant="ghost" className="ml-auto h-6 px-2" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-[#FF7A00] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#212121] mb-2">
                  Welcome to your AI Startup Advisor!
                </h3>
                <p className="text-sm text-[#212121] opacity-70 max-w-md mx-auto">
                  I’ll recommend service packages based on your meeting notes and your request.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <Fragment key={m.id}>
                {m.role === "assistant" ? renderAssistant(m) : (
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="max-w-[80%] p-3 rounded-lg bg-[#FF7A00] text-white">
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(m.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-[#1BC9C9] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </Fragment>
            ))}

            <div ref={messagesEndRef} />
          </div>

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
              placeholder={currentSession ? "Ask for a plan (e.g., 'full marketing plan')" : "Creating chat…"}
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
