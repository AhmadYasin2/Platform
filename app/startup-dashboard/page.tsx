"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Calendar, ShoppingBag, Award, Loader2 } from "lucide-react";

export interface Startup {
  id: string;
  name: string;
  founder_name: string | null;
  email: string;                        // ← add this
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

  // ← new email-preferences fields:
  notification_email?: string;
  email_preferences?: {
    meeting_reminders: boolean;
    service_updates: boolean;
    general_announcements: boolean;
  };
}


interface StartupService {
  id: string;
  hours_used: number;
  selected_at: string;
  package: {
    name: string;
  };
}

interface Meeting {
  id: string;
  meeting_date: string;
  meeting_time: string | null;
}

interface StartupWithData extends Startup {
  startup_services: StartupService[];
  meetings: Meeting[];
}

export default function StartupDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<StartupWithData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    } else if (status === "authenticated") {
      load();
    }
  }, [status]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/startup-dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7A00]" />
        </div>
      </DashboardLayout>
    );
  }
  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">Unable to load dashboard data</div>
      </DashboardLayout>
    );
  }

  const { startup, startup_services, meetings } = {
    startup: data,
    startup_services: data.startup_services,
    meetings: data.meetings,
  };
  const availableHours = startup.total_credits - startup.used_credits;

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#212121] mb-2">
            Welcome
          </h1>
          <p className="text-[#212121] opacity-70">
            Here's your program overview and available resources.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">Services Used</p>
                <p className="text-3xl font-bold text-[#1BC9C9]">
                  {startup_services.length}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-[#1BC9C9]" />
            </CardContent>
          </Card>


        </div>

        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chosen Services */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#FF7A00]" />
                <span>Your Chosen Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {startup_services.length ? (
                startup_services.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between p-4 bg-[#F9F7F1] rounded-lg mb-3"
                  >
                    <div>
                      <p className="font-medium">{s.package.name}</p>
                      <p className="text-xs opacity-70">
                        {new Date(s.selected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center opacity-70 py-8">
                  No services selected yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#1BC9C9]" />
                <span>Upcoming Meetings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.length ? (
                meetings.map((m) => (
                  <div
                    key={m.id}
                    className="flex justify-between p-4 bg-[#F9F7F1] rounded-lg mb-3"
                  >
                    <div>
                      <p className="font-medium">Program Review</p>
                      <p className="text-xs opacity-70">{m.meeting_date}</p>
                    </div>
                    <span className="font-bold text-[#1BC9C9]">
                      {m.meeting_time ?? "TBD"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center opacity-70 py-8">
                  No upcoming meetings scheduled.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contract Notice */}
      </div>
    </DashboardLayout>
  );
}
