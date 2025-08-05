"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Eye,
  MousePointer,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface EmailStats {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  spam: number;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
}

export default function EmailAnalytics() {
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    spam: 0,
  });
  const [recentEmails, setRecentEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmailAnalytics();
  }, []);

  const fetchEmailAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email-analytics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: { stats: EmailStats; recent: EmailLog[] } = await res.json();

      setStats(json.stats);
      setRecentEmails(json.recent);
    } catch (err) {
      console.error("Error fetching email analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "opened":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "clicked":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "bounced":
        return "bg-red-100 text-red-800 border-red-200";
      case "spam":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Mail className="w-4 h-4" />;
      case "opened":
        return <Eye className="w-4 h-4" />;
      case "clicked":
        return <MousePointer className="w-4 h-4" />;
      case "bounced":
      case "spam":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const deliveryRate =
    stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
  const openRate =
    stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0;
  const clickRate =
    stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0;

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF7A00]" />
          <p className="text-[#212121]">Loading email analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70">Total Sent</p>
                <p className="text-2xl font-bold text-[#212121]">
                  {stats.total}
                </p>
              </div>
              <Mail className="w-8 h-8 text-[#FF7A00]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {deliveryRate}%
                </p>
              </div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70">Open Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {openRate}%
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#212121] opacity-70">Click Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {clickRate}%
                </p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Emails */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#212121]">
            Recent Email Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between p-3 bg-[#F9F7F1] rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#212121]">
                    {email.subject}
                  </p>
                  <p className="text-xs text-[#212121] opacity-70">
                    To: {email.recipient_name || email.recipient_email} •{" "}
                    {new Date(email.sent_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={`${getStatusColor(
                    email.status
                  )} border flex items-center space-x-1`}
                >
                  {getStatusIcon(email.status)}
                  <span className="capitalize">{email.status}</span>
                </Badge>
              </div>
            ))}
            {recentEmails.length === 0 && (
              <p className="text-center text-[#212121] opacity-70 py-8">
                No emails sent yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
