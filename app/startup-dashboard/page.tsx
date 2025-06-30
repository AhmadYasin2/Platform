"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar, ShoppingBag, Award, Loader2 } from "lucide-react"
import { supabase, type Startup, type StartupService, type Package, type Meeting } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

interface StartupWithData extends Startup {
  startup_services: (StartupService & { package: Package })[]
  meetings: Meeting[]
}

export default function StartupDashboard() {
  const [startup, setStartup] = useState<StartupWithData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchStartupData()
    }
  }, [user])

  const fetchStartupData = async () => {
    try {
      // Fetch startup details
      const { data: startupData, error: startupError } = await supabase
        .from("startups")
        .select("*")
        .eq("status", "active")
        .eq("user_id", user?.id)
        .single()

      if (startupError) throw startupError

      // Fetch startup services with package details
      const { data: servicesData, error: servicesError } = await supabase
        .from("startup_services")
        .select(`
          *,
          packages (*)
        `)
        .eq("startup_id", startupData.id)
        .order("selected_at", { ascending: false })

      if (servicesError) throw servicesError

      // Fetch upcoming meetings
      const today = new Date().toISOString().split("T")[0]
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("meetings")
        .select("*")
        .eq("startup_id", startupData.id)
        .gte("meeting_date", today)
        .order("meeting_date", { ascending: true })
        .order("meeting_time", { ascending: true })
        .limit(5)

      if (meetingsError) throw meetingsError

      const startupWithData: StartupWithData = {
        ...startupData,
        startup_services:
          servicesData?.map((service: any) => ({
            ...service,
            package: service.packages,
          })) || [],
        meetings: meetingsData || [],
      }

      setStartup(startupWithData)
    } catch (error) {
      console.error("Error fetching startup dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF7A00]" />
            <p className="text-[#212121]">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <p className="text-[#212121]">Unable to load dashboard data</p>
        </div>
      </DashboardLayout>
    )
  }

  const availableHours = startup.total_credits - startup.used_credits

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#212121] mb-2">Welcome, {startup.name}!</h1>
          <p className="text-[#212121] opacity-70">Here's your program overview and available resources.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#212121] opacity-70 mb-1">Available Hours</p>
                  <p className="text-3xl font-bold text-[#FF7A00]">{availableHours}</p>
                </div>
                <Clock className="w-8 h-8 text-[#FF7A00]" />
              </div>
            </CardContent>
          </Card> */}

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#212121] opacity-70 mb-1">Services Used</p>
                  <p className="text-3xl font-bold text-[#1BC9C9]">{startup.startup_services.length}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-[#1BC9C9]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#212121] opacity-70 mb-1">Hours Spent</p>
                  <p className="text-3xl font-bold text-[#212121]">{startup.used_credits}</p>
                </div>
                <Award className="w-8 h-8 text-[#212121]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chosen Services */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#FF7A00]" />
                <span>Your Chosen Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {startup.startup_services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-[#F9F7F1] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#212121]">{service.package.name}</p>
                      <p className="text-xs text-[#212121] opacity-70">
                        Selected on {new Date(service.selected_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#FF7A00]">{service.hours_used} hours</span>
                    </div>
                  </div>
                ))}
                {startup.startup_services.length === 0 && (
                  <p className="text-sm text-[#212121] opacity-70 text-center py-8">
                    No services selected yet. Visit the Services page to get started!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#1BC9C9]" />
                <span>Upcoming Meetings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {startup.meetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 bg-[#F9F7F1] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#212121]">Program Review</p>
                      <p className="text-xs text-[#212121] opacity-70">{meeting.meeting_date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#1BC9C9]">{meeting.meeting_time || "TBD"}</span>
                    </div>
                  </div>
                ))}
                {startup.meetings.length === 0 && (
                  <p className="text-sm text-[#212121] opacity-70 text-center py-8">No upcoming meetings scheduled.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Status Banner */}
        {startup.contract_status !== "Signed" && (
          <Card className="bg-yellow-50 border-yellow-200 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Contract Status: {startup.contract_status}</p>
                  <p className="text-xs text-yellow-700">
                    {startup.contract_status === "Pending"
                      ? "Your contract is being prepared by our team."
                      : "Please check your email and return the signed contract."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
