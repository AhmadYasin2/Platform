"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, Users, TrendingUp } from "lucide-react";
import ContractStatusChart from "@/components/contract-status-chart";
import UpcomingMeetings from "@/components/upcoming-meetings";
import RecentActivity from "@/components/recent-activity";
import EmailAnalytics from "@/components/email-analytics";

interface DashboardStats {
  totalStartups: number;
  signedContracts: number;
  thisWeekMeetings: number;
  activeServices: number;
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalStartups: 0,
    signedContracts: 0,
    thisWeekMeetings: 0,
    activeServices: 0,
  });
  const [loading, setLoading] = useState(true);

  // 1) Redirect or fetch once auth is settled
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(); // kicks off NextAuth signin
    } else if (status === "authenticated") {
      if (session.user.role !== "manager") {
        // non-managers go to their dashboard
        window.location.href = "/startup-dashboard";
      } else {
        fetchStats();
      }
    }
  }, [status, session]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard-stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2) Basic loading UI
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#FF7A00] rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white rounded-sm relative">
              <div className="absolute top-0 right-0 w-2 h-2 bg-[#FF7A00]" />
            </div>
          </div>
          <p className="text-[#212121]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // 3) Final render
  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#212121] mb-2">
            Dashboard
          </h1>
          <p className="text-[#212121] opacity-70">
            Welcome back! Here's what's happening with your cohort.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70 mb-1">
                  Total Startups
                </p>
                <p className="text-2xl font-bold text-[#212121]">
                  {stats.totalStartups}
                </p>
              </div>
              <Users className="w-8 h-8 text-[#FF7A00]" />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70 mb-1">
                  Signed Contracts
                </p>
                <p className="text-2xl font-bold text-[#212121]">
                  {stats.signedContracts}
                </p>
              </div>
              <FileText className="w-8 h-8 text-[#1BC9C9]" />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70 mb-1">
                  Upcoming Meetings
                </p>
                <p className="text-2xl font-bold text-[#212121]">
                  {stats.thisWeekMeetings}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#FF7A00]" />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70 mb-1">
                  Active Services
                </p>
                <p className="text-2xl font-bold text-[#212121]">
                  {stats.activeServices}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#1BC9C9]" />
            </CardContent>
          </Card>
        </div>

        {/* Charts & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <UpcomingMeetings />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>

        {/* Email Analytics */}
        {/* <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#212121] mb-6">
            Email Analytics
          </h2>
          <EmailAnalytics />
        </div> */}
      </div>
    </DashboardLayout>
  );
}
