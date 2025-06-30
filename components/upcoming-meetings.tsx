"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Meeting {
  id: string;
  meeting_date: string;
  meeting_time?: string | null;
  startup: {
    name: string;
  };
}

export default function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingMeetings();
  }, []);

  const fetchUpcomingMeetings = async () => {
    const timeoutMs = 10_000;
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Request timed out")),
        timeoutMs
      );
    });

    try {
      const today = new Date().toISOString().split("T")[0];

      const supabasePromise = await supabase
        .from("meetings")
        .select(
          `
    id,
    meeting_date,
    startups!inner(name)
  `
        )
        .gte("meeting_date", today)
        .order("meeting_date", { ascending: true })
        .limit(5);

      const { data, error } = await Promise.race([
        supabasePromise,
        timeoutPromise,
      ]);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedMeetings =
        data?.map((meeting: any) => ({
          id: meeting.id,
          meeting_date: meeting.meeting_date,
          meeting_time: null, // placeholder until column exists
          startup: { name: meeting.startups.name },
        })) || [];

      setMeetings(transformedMeetings);
    } catch (error) {
      console.error("Error fetching upcoming meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#FF7A00]" />
            <span>Upcoming Meetings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#212121] opacity-70">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#212121] flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-[#FF7A00]" />
          <span>Upcoming Meetings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-3 bg-[#F9F7F1] rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-[#212121]">
                    {meeting.startup.name}
                  </p>
                  <p className="text-xs text-[#212121] opacity-70">
                    {meeting.meeting_date}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-[#FF7A00]">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {meeting.meeting_time || "TBD"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#212121] opacity-70 text-center py-4">
              No upcoming meetings scheduled
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
