"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface Meeting {
  id: string;
  meeting_date: string;
  meeting_time: string | null;
  startup_name: string;
}

export default function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    (async () => {
      try {
        const res = await fetch("/api/upcoming-meetings", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Meeting[] = await res.json();
        setMeetings(data);
      } catch (err) {
        console.error("Error fetching upcoming meetings:", err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    })();
  }, []);

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
            meetings.map((mt) => (
              <div
                key={mt.id}
                className="flex items-center justify-between p-3 bg-[#F9F7F1] rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-[#212121]">
                    {mt.startup_name}
                  </p>
                  <p className="text-xs text-[#212121] opacity-70">
                    {new Date(mt.meeting_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-[#FF7A00]">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {mt.meeting_time ?? "TBD"}
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
