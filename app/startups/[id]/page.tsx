"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Plus,
  Save,
  Calendar as CalIcon,
  FileText,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Startup {
  id: string;
  name: string;
  founder_name: string | null;
  email: string;
  logo_url: string | null;
  contract_status: "Pending" | "Sent" | "Signed";
  total_credits: number;
  used_credits: number;
  marketplace_access: boolean;
  user_id: string | null;
  created_by: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface Meeting {
  id: string;
  meeting_date: string;
  meeting_time: string | null;
  farah_notes: string | null;
  guest_notes: string | null;
}

interface StartupService {
  id: string;
  hours_used: number;
  selected_at: string;
  package: { name: string };
}

interface StartupWithServices extends Startup {
  meetings: Meeting[];
  startup_services: StartupService[];
}

type NoteFields = { farah_notes: string; guest_notes: string };
type EditableMap = Record<string, NoteFields>;

export default function StartupDetailPage() {
  const [creditInput, setCreditInput] = useState<string>("");
  const { id: startupId } = useParams();
  const { data: session, status } = useSession();

  const [startup, setStartup] = useState<StartupWithServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [newMeeting, setNewMeeting] = useState({
    date: "",
    time: "",
    farahNotes: "",
    guestNotes: "",
  });
  const [showNewMeeting, setShowNewMeeting] = useState(false);

  // Debounced notes buffers + flags
  const [editableNotes, setEditableNotes] = useState<EditableMap>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const saveTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
      return;
    }
    if (status === "authenticated") {
      fetchDetails();
    }
  }, [status]);

  // Seed editable buffers whenever startup changes
  useEffect(() => {
    if (!startup) return;
    const init: EditableMap = {};
    for (const m of startup.meetings) {
      init[m.id] = {
        farah_notes: m.farah_notes ?? "",
        guest_notes: m.guest_notes ?? "",
      };
    }
    setEditableNotes(init);
  }, [startup]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      for (const id of saveTimers.current.values()) {
        window.clearTimeout(id);
      }
      saveTimers.current.clear();
    };
  }, []);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/startups/${startupId}`);
      if (!res.ok) throw new Error("Failed");
      setStartup(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update contract or credits
  const updateField = async (field: string, value: any) => {
    setSaving(field);
    try {
      await fetch(`/api/startups/${startupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      setStartup((s) => (s ? ({ ...s, [field]: value } as any) : s));
    } finally {
      setSaving(null);
    }
  };

  // Add meeting
  const addNewMeeting = async () => {
    setSaving("new-meeting");
    const { date, time, farahNotes, guestNotes } = newMeeting;
    try {
      const res = await fetch(`/api/startups/${startupId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, farahNotes, guestNotes }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Create meeting failed:", text);
        throw new Error(text || "Failed to create meeting");
      }
      const saved: Meeting = await res.json();
      setStartup((s) => (s ? { ...s, meetings: [saved, ...s.meetings] } : s));
      setNewMeeting({ date: "", time: "", farahNotes: "", guestNotes: "" });
      setShowNewMeeting(false);
    } finally {
      setSaving(null);
    }
  };

  // Delete meeting
  const deleteMeeting = async (meetingId: string) => {
    const res = await fetch(`/api/meetings/${meetingId}`, { method: "DELETE" });
    if (res.ok) {
      setStartup((s) =>
        s ? { ...s, meetings: s.meetings.filter((m) => m.id !== meetingId) } : s
      );
      // cleanup any timers/buffers for this meeting
      const keys = [...saveTimers.current.keys()].filter((k) =>
        k.startsWith(`${meetingId}:`)
      );
      for (const k of keys) {
        const t = saveTimers.current.get(k);
        if (t) window.clearTimeout(t);
        saveTimers.current.delete(k);
      }
      setEditableNotes((prev) => {
        const copy = { ...prev };
        delete copy[meetingId];
        return copy;
      });
    } else {
      console.error("Delete failed:", await res.text());
      alert("Failed to delete meeting.");
    }
  };

  // Debounced save to server
  const saveMeetingField = async (
    meetingId: string,
    field: keyof Meeting,
    value: string
  ) => {
    setSavingNote((s) => ({ ...s, [`${meetingId}:${field}`]: true }));
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      // Reflect saved value in main startup state
      setStartup((s) =>
        s
          ? {
              ...s,
              meetings: s.meetings.map((m) =>
                m.id === meetingId ? { ...m, [field]: value } : m
              ),
            }
          : s
      );
    } catch (e) {
      console.error("Autosave failed", e);
    } finally {
      setSavingNote((s) => ({ ...s, [`${meetingId}:${field}`]: false }));
    }
  };

  const handleNoteChange = (
    meetingId: string,
    field: "farah_notes" | "guest_notes",
    value: string
  ) => {
    // Update local buffer immediately
    setEditableNotes((prev) => ({
      ...prev,
      [meetingId]: {
        ...(prev[meetingId] ?? { farah_notes: "", guest_notes: "" }),
        [field]: value,
      } as NoteFields,
    }));

    const key = `${meetingId}:${field}`;
    const prior = saveTimers.current.get(key);
    if (prior) window.clearTimeout(prior);
    const t = window.setTimeout(() => {
      saveMeetingField(meetingId, field, value);
      saveTimers.current.delete(key);
    }, 600);
    saveTimers.current.set(key, t);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Signed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Sent":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Pending":
      default:
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  if (loading || status === "loading") {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7A00]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">Startup not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        {/* Header */}
        <div className="mb-6 flex items-center space-x-4">
          <img
            src={startup.logo_url || "/placeholder.svg"}
            className="w-16 h-16 rounded-lg"
          />
          <div>
            <h1 className="text-3xl font-bold">{startup.name}</h1>
            <p className="opacity-70">
              {startup.founder_name && `Founded by ${startup.founder_name} • `}ID:{" "}
              {startup.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="contract" className="space-y-6">
          <TabsList className="grid grid-cols-3 bg-white">
            <TabsTrigger value="contract" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" /> <span>Contract</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center space-x-2">
              <CalIcon className="w-4 h-4" /> <span>Meetings</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" /> <span>Services & Credits</span>
            </TabsTrigger>
          </TabsList>

          {/* Contract */}
          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Contract Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Contract Status</Label>
                  <Select
                    value={startup.contract_status}
                    onValueChange={(v) => updateField("contract_status", v)}
                    disabled={saving === "contract_status"}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Signed">Signed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(startup.contract_status)} border`}>
                    {startup.contract_status}
                  </Badge>
                  {saving === "contract_status" && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF7A00]" />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings */}
          <TabsContent value="meetings">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>Meeting Notes</CardTitle>
                  <Button onClick={() => setShowNewMeeting(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Meeting
                  </Button>
                </CardHeader>
                <CardContent>
                  {showNewMeeting && (
                    <Card className="mb-4 border border-[#FF7A00]">
                      <CardHeader>
                        <CardTitle>New Meeting</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={newMeeting.date}
                              onChange={(e) =>
                                setNewMeeting((p) => ({ ...p, date: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Time</Label>
                            <Input
                              type="time"
                              value={newMeeting.time || ""}
                              onChange={(e) =>
                                setNewMeeting((p) => ({ ...p, time: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Farah’s Notes</Label>
                          <Textarea
                            rows={3}
                            value={newMeeting.farahNotes}
                            onChange={(e) =>
                              setNewMeeting((p) => ({ ...p, farahNotes: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Guest Notes</Label>
                          <Textarea
                            rows={3}
                            value={newMeeting.guestNotes}
                            onChange={(e) =>
                              setNewMeeting((p) => ({ ...p, guestNotes: e.target.value }))
                            }
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={addNewMeeting} disabled={saving === "new-meeting"}>
                            {saving === "new-meeting" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewMeeting(false)}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {startup.meetings.map((m) => (
                      <Collapsible key={m.id}>
                        <CollapsibleTrigger className="flex justify-between p-4 bg-[#F9F7F1] rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CalIcon className="w-5 h-5 text-[#FF7A00]" />
                            <span>
                              {m.meeting_date} {m.meeting_time ?? ""}
                            </span>
                          </div>
                          <ChevronDown className="w-5 h-5" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 space-y-4">
                          <div>
                            <Label>Farah’s Notes</Label>
                            <Textarea
                              rows={4}
                              value={
                                editableNotes[m.id]?.farah_notes ??
                                m.farah_notes ??
                                ""
                              }
                              onChange={(e) =>
                                handleNoteChange(m.id, "farah_notes", e.target.value)
                              }
                              onBlur={(e) =>
                                saveMeetingField(m.id, "farah_notes", e.target.value)
                              }
                            />
                            <div className="h-5">
                              {savingNote[`${m.id}:farah_notes`] && (
                                <span className="text-xs text-[#FF7A00] inline-flex items-center">
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Saving…
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Guest Notes</Label>
                            <Textarea
                              rows={4}
                              value={
                                editableNotes[m.id]?.guest_notes ??
                                m.guest_notes ??
                                ""
                              }
                              onChange={(e) =>
                                handleNoteChange(m.id, "guest_notes", e.target.value)
                              }
                              onBlur={(e) =>
                                saveMeetingField(m.id, "guest_notes", e.target.value)
                              }
                            />
                            <div className="h-5">
                              {savingNote[`${m.id}:guest_notes`] && (
                                <span className="text-xs text-[#FF7A00] inline-flex items-center">
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Saving…
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this meeting?")) {
                                deleteMeeting(m.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                    {startup.meetings.length === 0 && (
                      <p className="text-center opacity-70 py-8">
                        No meetings recorded yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services & Credits */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Credits Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Total Credits</Label>
                  <Input
                    type="number"
                    placeholder={startup.total_credits.toString()}
                    value={creditInput}
                    onChange={(e) => setCreditInput(e.target.value)}
                    onBlur={() => {
                      const parsed = Number(creditInput);
                      if (!isNaN(parsed) && parsed !== startup!.total_credits) {
                        updateField("total_credits", parsed);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    disabled={saving === "total_credits"}
                    className="w-32"
                  />
                  <p className="text-xs text-gray-500">Press Enter to change</p>
                  {saving === "total_credits" && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF7A00] mt-1" />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 bg-[#F9F7F1] rounded-lg">
                  <div>
                    <p className="text-sm opacity-70">Total</p>
                    <p className="text-2xl">{startup.total_credits}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Used</p>
                    <p className="text-2xl">{startup.used_credits}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Available</p>
                    <p className="text-2xl">
                      {startup.total_credits - startup.used_credits}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Usage History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {startup.startup_services.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between p-3 bg-[#F9F7F1] rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{s.package.name}</p>
                      <p className="text-xs opacity-70">
                        {new Date(s.selected_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[#FF7A00]">{s.hours_used}h</span>
                  </div>
                ))}
                {startup.startup_services.length === 0 && (
                  <p className="text-center opacity-70 py-8">
                    No services selected yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
