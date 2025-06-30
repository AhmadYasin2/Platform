"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Plus, Save, Calendar, FileText, CreditCard, Loader2 } from "lucide-react"
import { supabase, type Startup, type Meeting, type StartupService, type Package } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

interface StartupWithServices extends Startup {
  startup_services: (StartupService & { package: Package })[]
  meetings: Meeting[]
}

export default function StartupDetailPage() {
  const params = useParams()
  const startupId = params.id as string
  const { profile } = useAuth()

  const [startup, setStartup] = useState<StartupWithServices | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [newMeeting, setNewMeeting] = useState({
    date: "",
    time: "",
    farahNotes: "",
    guestNotes: "",
  })
  const [showNewMeeting, setShowNewMeeting] = useState(false)

  useEffect(() => {
    if (startupId) {
      fetchStartupDetails()
    }
  }, [startupId])

  const fetchStartupDetails = async () => {
    try {
      // Fetch startup details
      const { data: startupData, error: startupError } = await supabase
        .from("startups")
        .select("*")
        .eq("id", startupId)
        .single()

      if (startupError) throw startupError

      // Fetch meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("meetings")
        .select("*")
        .eq("startup_id", startupId)
        .order("meeting_date", { ascending: false })

      if (meetingsError) throw meetingsError

      // Fetch startup services with package details
      const { data: servicesData, error: servicesError } = await supabase
        .from("startup_services")
        .select(`
          *,
          packages (*)
        `)
        .eq("startup_id", startupId)
        .order("selected_at", { ascending: false })

      if (servicesError) throw servicesError

      const startupWithServices: StartupWithServices = {
        ...startupData,
        meetings: meetingsData || [],
        startup_services:
          servicesData?.map((service: any) => ({
            ...service,
            package: service.packages,
          })) || [],
      }

      setStartup(startupWithServices)
    } catch (error) {
      console.error("Error fetching startup details:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateContractStatus = async (status: string) => {
    if (!startup) return

    setSaving("contract")
    try {
      const { error } = await supabase
        .from("startups")
        .update({ contract_status: status as any })
        .eq("id", startupId)

      if (error) throw error

      setStartup({ ...startup, contract_status: status as any })
    } catch (error) {
      console.error("Error updating contract status:", error)
      alert("Failed to update contract status")
    } finally {
      setSaving(null)
    }
  }

  const updateTotalCredits = async (credits: number) => {
    if (!startup) return

    setSaving("credits")
    try {
      const { error } = await supabase.from("startups").update({ total_credits: credits }).eq("id", startupId)

      if (error) throw error

      setStartup({ ...startup, total_credits: credits })
    } catch (error) {
      console.error("Error updating credits:", error)
      alert("Failed to update credits")
    } finally {
      setSaving(null)
    }
  }

  const addNewMeeting = async () => {
    if (!newMeeting.date || !startup) return

    setSaving("new-meeting")
    try {
      const { data, error } = await supabase
        .from("meetings")
        .insert({
          startup_id: startupId,
          meeting_date: newMeeting.date,
          meeting_time: newMeeting.time || null,
          farah_notes: newMeeting.farahNotes,
          guest_notes: newMeeting.guestNotes,
        })
        .select()
        .single()

      if (error) throw error

      setStartup({
        ...startup,
        meetings: [data, ...startup.meetings],
      })

      setNewMeeting({ date: "", time: "", farahNotes: "", guestNotes: "" })
      setShowNewMeeting(false)
    } catch (error) {
      console.error("Error adding meeting:", error)
      alert("Failed to add meeting")
    } finally {
      setSaving(null)
    }
  }

  const updateMeeting = async (meetingId: string, field: string, value: string) => {
    if (!startup) return

    try {
      const { error } = await supabase
        .from("meetings")
        .update({ [field]: value })
        .eq("id", meetingId)

      if (error) throw error

      setStartup({
        ...startup,
        meetings: startup.meetings.map((meeting) =>
          meeting.id === meetingId ? { ...meeting, [field]: value } : meeting,
        ),
      })
    } catch (error) {
      console.error("Error updating meeting:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Signed":
        return "bg-green-100 text-green-800 border-green-200"
      case "Sent":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Pending":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF7A00]" />
            <p className="text-[#212121]">Loading startup details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <p className="text-[#212121]">Startup not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={startup.logo_url || "/placeholder.svg?height=64&width=64"}
              alt={startup.name}
              className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm"
            />
            <div>
              <h1 className="text-3xl font-bold text-[#212121]">{startup.name}</h1>
              <p className="text-[#212121] opacity-70">
                {startup.founder_name && `Founded by ${startup.founder_name} • `}
                ID: {startup.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="contract" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white">
            <TabsTrigger value="contract" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Contract</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Meetings</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Services & Credits</span>
            </TabsTrigger>
          </TabsList>

          {/* Contract Management Tab */}
          <TabsContent value="contract">
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#212121]">Contract Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contractStatus">Contract Status</Label>
                    {profile?.role === "manager" ? (
                      <Select
                        value={startup.contract_status}
                        onValueChange={updateContractStatus}
                        disabled={saving === "contract"}
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
                    ) : (
                      <div className="mt-2">
                        <Badge className={`${getStatusColor(startup.contract_status)} border`}>
                          {startup.contract_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-[#212121]">Current Status:</span>
                    <Badge className={`${getStatusColor(startup.contract_status)} border`}>
                      {startup.contract_status}
                    </Badge>
                    {saving === "contract" && <Loader2 className="w-4 h-4 animate-spin text-[#FF7A00]" />}
                  </div>
                  <p className="text-xs text-[#212121] opacity-70">
                    {profile?.role === "manager"
                      ? "Changes are saved automatically when you update the status."
                      : "Your contract status is managed by the program team."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meeting Notes Tab */}
          <TabsContent value="meetings">
            <div className="space-y-6">
              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-[#212121]">Meeting Notes</CardTitle>
                    {profile?.role === "manager" && (
                      <Button
                        onClick={() => setShowNewMeeting(true)}
                        className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Meeting
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* New Meeting Form */}
                  {showNewMeeting && profile?.role === "manager" && (
                    <Card className="mb-6 border border-[#FF7A00]">
                      <CardHeader>
                        <CardTitle className="text-lg text-[#212121]">New Meeting</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="meetingDate">Meeting Date</Label>
                            <Input
                              id="meetingDate"
                              type="date"
                              value={newMeeting.date}
                              onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="meetingTime">Meeting Time</Label>
                            <Input
                              id="meetingTime"
                              type="time"
                              value={newMeeting.time || ""}
                              onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="farahNotes">Farah's Notes</Label>
                          <Textarea
                            id="farahNotes"
                            value={newMeeting.farahNotes}
                            onChange={(e) => setNewMeeting({ ...newMeeting, farahNotes: e.target.value })}
                            placeholder="General notes, observations, and action items..."
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label htmlFor="guestNotes">Guest/Internal Notes</Label>
                          <Textarea
                            id="guestNotes"
                            value={newMeeting.guestNotes}
                            onChange={(e) => setNewMeeting({ ...newMeeting, guestNotes: e.target.value })}
                            placeholder="Confidential notes and internal observations..."
                            rows={4}
                          />
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            onClick={addNewMeeting}
                            disabled={saving === "new-meeting"}
                            className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
                          >
                            {saving === "new-meeting" ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Meeting
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewMeeting(false)}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Meetings List */}
                  <div className="space-y-4">
                    {startup.meetings.map((meeting) => (
                      <Collapsible key={meeting.id}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-[#F9F7F1] rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-[#FF7A00]" />
                            <span className="font-medium text-[#212121]">
                              Meeting: {meeting.meeting_date}
                              {meeting.meeting_time && ` at ${meeting.meeting_time}`}
                            </span>
                          </div>
                          <ChevronDown className="w-5 h-5 text-[#212121]" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`farah-${meeting.id}`}>Farah's Notes</Label>
                              {profile?.role === "manager" ? (
                                <Textarea
                                  id={`farah-${meeting.id}`}
                                  value={meeting.farah_notes || ""}
                                  onChange={(e) => updateMeeting(meeting.id, "farah_notes", e.target.value)}
                                  rows={6}
                                  className="mt-1"
                                />
                              ) : (
                                <div className="mt-1 p-3 bg-gray-50 rounded-md min-h-[120px]">
                                  <p className="text-sm text-[#212121] whitespace-pre-wrap">
                                    {meeting.farah_notes || "No notes available"}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div>
                              <Label htmlFor={`guest-${meeting.id}`}>Guest/Internal Notes</Label>
                              {profile?.role === "manager" ? (
                                <Textarea
                                  id={`guest-${meeting.id}`}
                                  value={meeting.guest_notes || ""}
                                  onChange={(e) => updateMeeting(meeting.id, "guest_notes", e.target.value)}
                                  rows={6}
                                  className="mt-1"
                                />
                              ) : (
                                <div className="mt-1 p-3 bg-gray-50 rounded-md min-h-[120px]">
                                  <p className="text-sm text-[#212121] opacity-70">
                                    Internal notes are not visible to startups
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                    {startup.meetings.length === 0 && (
                      <p className="text-center text-[#212121] opacity-70 py-8">
                        {profile?.role === "manager"
                          ? 'No meetings recorded yet. Click "Add New Meeting" to get started.'
                          : "No meetings have been scheduled yet."}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services & Credits Tab */}
          <TabsContent value="services">
            <div className="space-y-6">
              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-[#212121]">Credits Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="totalCredits">Total Credits</Label>
                      {profile?.role === "manager" ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            id="totalCredits"
                            type="number"
                            value={startup.total_credits}
                            onChange={(e) => updateTotalCredits(Number(e.target.value))}
                            className="w-full md:w-64"
                            disabled={saving === "credits"}
                          />
                          {saving === "credits" && <Loader2 className="w-4 h-4 animate-spin text-[#FF7A00]" />}
                        </div>
                      ) : (
                        <p className="mt-1 text-lg font-medium text-[#212121]">{startup.total_credits}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#F9F7F1] rounded-lg">
                      <div>
                        <p className="text-sm text-[#212121] opacity-70">Total Credits</p>
                        <p className="text-2xl font-bold text-[#212121]">{startup.total_credits}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#212121] opacity-70">Used Credits</p>
                        <p className="text-2xl font-bold text-[#FF7A00]">{startup.used_credits}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#212121] opacity-70">Available Credits</p>
                        <p className="text-2xl font-bold text-[#1BC9C9]">
                          {startup.total_credits - startup.used_credits}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-[#212121]">Service Usage History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {startup.startup_services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-[#F9F7F1] rounded-lg">
                        <div>
                          <p className="font-medium text-[#212121]">{service.package.name}</p>
                          <p className="text-sm text-[#212121] opacity-70">
                            Selected on {new Date(service.selected_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[#FF7A00] border-[#FF7A00]">
                          {service.hours_used} credits
                        </Badge>
                      </div>
                    ))}
                    {startup.startup_services.length === 0 && (
                      <p className="text-center text-[#212121] opacity-70 py-8">No services have been selected yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
