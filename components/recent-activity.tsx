"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, FileText, ShoppingBag, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ActivityItem {
  id: string
  text: string
  time: string
  icon: any
  color: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      // Get recent startup services
      const { data: recentServices, error: servicesError } = await supabase
        .from("startup_services")
        .select(`
        id,
        selected_at,
        hours_used,
        startups!inner(name),
        packages!inner(name)
      `)
        .order("selected_at", { ascending: false })
        .limit(3)

      if (servicesError) throw servicesError

      // Get recent startups
      const { data: recentStartups, error: startupsError } = await supabase
        .from("startups")
        .select("id, name, created_at, contract_status")
        .order("created_at", { ascending: false })
        .limit(2)

      if (startupsError) throw startupsError

      const activities: ActivityItem[] = []

      // Add service activities
      recentServices?.forEach((service: any) => {
        activities.push({
          id: service.id,
          text: `${service.startups.name} selected ${service.packages.name} (${service.hours_used} hours)`,
          time: formatTimeAgo(service.selected_at),
          icon: ShoppingBag,
          color: "#FF7A00",
        })
      })

      // Add startup activities
      recentStartups?.forEach((startup: any) => {
        if (startup.contract_status === "Signed") {
          activities.push({
            id: startup.id + "_contract",
            text: `${startup.name} contract signed`,
            time: formatTimeAgo(startup.created_at),
            icon: FileText,
            color: "#28a745",
          })
        } else {
          activities.push({
            id: startup.id + "_added",
            text: `${startup.name} added to cohort`,
            time: formatTimeAgo(startup.created_at),
            icon: Users,
            color: "#1BC9C9",
          })
        }
      })

      // Sort by time and take top 5
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setActivities(activities.slice(0, 5))
    } catch (error) {
      console.error("Error fetching recent activity:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  }

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#FF7A00]" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#212121] opacity-70">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
          <Activity className="w-5 h-5 text-[#FF7A00]" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${activity.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: activity.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#212121]">{activity.text}</p>
                    <p className="text-xs text-[#212121] opacity-70">{activity.time}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-[#212121] opacity-70 text-center py-4">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
