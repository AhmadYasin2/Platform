"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, Users, TrendingUp } from "lucide-react";
import ContractStatusChart from "@/components/contract-status-chart";
import UpcomingMeetings from "@/components/upcoming-meetings";
import RecentActivity from "@/components/recent-activity";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import EmailAnalytics from "@/components/email-analytics";

interface DashboardStats {
  totalStartups: number;
  signedContracts: number;
  thisWeekMeetings: number;
  activeServices: number;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStartups: 0,
    signedContracts: 0,
    thisWeekMeetings: 0,
    activeServices: 0,
  });
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();

  useEffect(() => {
    // Only fetch if we have a user and profile
    if (user && profile) {
      if (profile.role === "manager") {
        fetchDashboardStats();
      } else {
        // Redirect non-managers
        window.location.href = "/startup-dashboard";
      }
    }
  }, [profile, user]);

  const fetchDashboardStats = async () => {
    try {
      console.log("Fetching dashboard stats...");

      // Get total startups with error handling
      let totalStartups = 0;
      try {
        const { count } = await supabase
          .from("startups")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");
        totalStartups = count || 0;
      } catch (error) {
        console.warn("Failed to fetch total startups:", error);
      }

      // Get signed contracts with error handling
      let signedContracts = 0;
      try {
        const { count } = await supabase
          .from("startups")
          .select("*", { count: "exact", head: true })
          .eq("contract_status", "Signed")
          .eq("status", "active");
        signedContracts = count || 0;
      } catch (error) {
        console.warn("Failed to fetch signed contracts:", error);
      }

      // Get this week's meetings with error handling
      let thisWeekMeetings = 0;
      try {
        const today = new Date().toISOString().split("T")[0];
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const { count } = await supabase
          .from("meetings")
          .select("*", { count: "exact", head: true })
          .gte("meeting_date", today)
          .lte("meeting_date", endOfWeek.toISOString().split("T")[0]);
        thisWeekMeetings = count || 0;
      } catch (error) {
        console.warn("Failed to fetch meetings:", error);
      }

      // Get active services with error handling
      let activeServices = 0;
      try {
        const { count } = await supabase
          .from("startup_services")
          .select("*", { count: "exact", head: true });
        activeServices = count || 0;
      } catch (error) {
        console.warn("Failed to fetch active services:", error);
      }

      setStats({
        totalStartups,
        signedContracts,
        thisWeekMeetings,
        activeServices,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is loading
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#FF7A00] rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white rounded-sm relative">
              <div className="absolute top-0 right-0 w-2 h-2 bg-[#FF7A00]"></div>
            </div>
          </div>
          <p className="text-[#212121]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not a manager
  if (profile.role !== "manager") {
    return (
      <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#212121]">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#212121] mb-2">Dashboard</h1>
          <p className="text-[#212121] opacity-70">
            Welcome back! Here's what's happening with your cohort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#212121] opacity-70 mb-1">
                    Total Startups
                  </p>
                  <p className="text-2xl font-bold text-[#212121]">
                    {stats.totalStartups}
                  </p>
                </div>
                <Users className="w-8 h-8 text-[#FF7A00]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#212121] opacity-70 mb-1">
                    Signed Contracts
                  </p>
                  <p className="text-2xl font-bold text-[#212121]">
                    {stats.signedContracts}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-[#1BC9C9]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#212121] opacity-70 mb-1">
                    Upcoming Meetings
                  </p>
                  <p className="text-2xl font-bold text-[#212121]">
                    {stats.thisWeekMeetings}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-[#FF7A00]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#212121] opacity-70 mb-1">
                    Active Services
                  </p>
                  <p className="text-2xl font-bold text-[#212121]">
                    {stats.activeServices}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#1BC9C9]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ContractStatusChart />
          </div>
          <div className="lg:col-span-1">
            <UpcomingMeetings />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>

        {/* Add Email Analytics Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#212121] mb-6">
            Email Analytics
          </h2>
          <EmailAnalytics />
        </div>
      </div>
    </DashboardLayout>
  );
}
