"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, ShoppingBag, Users } from "lucide-react";

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recent-activity");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: {
        recentServices: Array<{
          id: string;
          selected_at: string;
          hours_used: number;
          startup_name: string;
          package_name: string;
        }>;
        recentStartups: Array<{
          id: string;
          name: string;
          created_at: string;
          contract_status: string;
        }>;
      } = await res.json();

      const items: ActivityItem[] = [];

      // service selections
      json.recentServices.forEach((s) => {
        items.push({
          id: s.id,
          text: `${s.startup_name} selected ${s.package_name} (${s.hours_used} hours)`,
          time: formatTimeAgo(s.selected_at),
          icon: ShoppingBag,
          color: "#FF7A00",
        });
      });

      // startups
      json.recentStartups.forEach((st) => {
        if (st.contract_status === "Signed") {
          items.push({
            id: `${st.id}_contract`,
            text: `${st.name} contract signed`,
            time: formatTimeAgo(st.created_at),
            icon: FileText,
            color: "#28a745",
          });
        } else {
          items.push({
            id: `${st.id}_added`,
            text: `${st.name} added to cohort`,
            time: formatTimeAgo(st.created_at),
            icon: Users,
            color: "#1BC9C9",
          });
        }
      });

      // sort by the original timestamp descending
      items.sort((a, b) => {
        // parseTimeAgo to approximate original date
        const backToDate = (txt: string) => {
          const now = Date.now();
          if (txt === "Just now") return now;
          const [num, unit] = txt.split(" ");
          const n = parseInt(num, 10);
          if (unit.startsWith("hour")) return now - n * 3600_000;
          if (unit.startsWith("day"))  return now - n * 24 * 3600_000;
          return now;
        };
        return backToDate(b.time) - backToDate(a.time);
      });

      setActivities(items.slice(0, 5));
    } catch (err) {
      console.error("Error fetching recent activity:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString).getTime();
    const now = Date.now();
    const diffH = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH} hour${diffH > 1 ? "s" : ""} ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} day${diffD > 1 ? "s" : ""} ago`;
  };

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
    );
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
            activities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${act.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: act.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#212121]">{act.text}</p>
                    <p className="text-xs text-[#212121] opacity-70">
                      {act.time}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[#212121] opacity-70 text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
