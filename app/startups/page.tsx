// app/startups/page.tsx — fixes type error + add Excel export (keeps your UI)
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, Plus, Trash2, ShoppingBag, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import EmailModal from "@/components/email-modal";
import AddStartupModal from "@/components/add-startup-modal";
import MarketplaceAccessModal from "@/components/marketplace-access-modal";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// IMPORTANT: rename local type to avoid clashing with EmailModal's internal `Startup` type
// and include `notification_email` so structural typing matches EmailModalProps.
export interface StartupRow {
  id: string;
  name: string;
  founder_name: string | null;
  email: string;
  notification_email: string | null; // <-- added to satisfy EmailModal
  logo_url: string | null;
  contract_status: "Pending" | "Sent" | "Signed";
  total_credits: number;
  used_credits: number;
  marketplace_access: boolean;
  user_id: string | null; // allow null
  created_by: string | null; // allow null
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export default function StartupsPage() {
  const [startups, setStartups] = useState<StartupRow[]>([]);
  const [selectedStartups, setSelectedStartups] = useState<string[]>([]);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [addStartupModalOpen, setAddStartupModalOpen] = useState(false);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { data: session, status } = useSession();
  const isManager = status === "authenticated" && (session as any)?.user?.role === "manager";

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/startups?status=active");
      if (!res.ok) throw new Error(await res.text());
      const data: any[] = await res.json();
      // Ensure `notification_email` exists to satisfy EmailModal typing and UX fallback
      const rows: StartupRow[] = data.map((s) => ({
        notification_email: s.notification_email ?? s.email ?? null,
        ...s,
      }));
      setStartups(rows);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Error fetching startup dashboard data:", msg);
      toast.error("Failed to load startups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) fetchStartups();
  }, [status, (session as any)?.user?.role]);

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    const on = checked === true;
    setSelectedStartups(on ? startups.map((s) => s.id) : []);
  };

  const handleSelectStartup = (startupId: string, checked: boolean | "indeterminate") => {
    const on = checked === true;
    setSelectedStartups((prev) => (on ? [...prev, startupId] : prev.filter((id) => id !== startupId)));
  };

  const deactivateStartup = async (startupId: string, startupName: string) => {
    if (
      !confirm(
        `Are you sure you want to deactivate "${startupName}"? This will prevent them from logging in and hide them from the active list. This action can be reversed.`
      )
    )
      return;

    try {
      const res = await fetch("/api/update-startup-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: startupId, status: "inactive" }),
      });
      const payload = await res.json();
      if (!payload.ok) throw new Error(payload.error || "Unknown error");

      setStartups((prev) => prev.filter((s) => s.id !== startupId));
      setSelectedStartups((prev) => prev.filter((id) => id !== startupId));

      toast.success(`"${startupName}" has been deactivated.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to deactivate startup: ${msg}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Signed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Sent":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Pending":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // --- XLSX Export ---
  // Calls a backend route that returns startups + their selected services
  // and then generates an .xlsx file client-side via SheetJS.
  const exportToExcel = async () => {
  try {
    setExporting(true);
    // Navigate to server-generated XLSX to guarantee a download in all browsers
    const url = "/api/startups/export?format=xlsx";
    // Prefer using an anchor for better compatibility
    const a = document.createElement("a");
    a.href = url;
    a.download = "startups_services.xlsx"; // hint; server will set Content-Disposition
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e: any) {
    console.error(e);
    toast.error(e?.message || "Export failed");
  } finally {
    setExporting(false);
  }
};

  if (loading)
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <p className="text-[#212121]">Loading startups...</p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#212121] mb-2">Startups</h1>
            <p className="text-[#212121] opacity-70">Manage your cohort of {startups.length} active startups</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => setAddStartupModalOpen(true)} className="bg-[#1BC9C9] hover:bg-[#17B3B3] text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Startup
            </Button>
            <Button onClick={() => setMarketplaceModalOpen(true)} disabled={selectedStartups.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white">
              <ShoppingBag className="w-4 h-4 mr-2" /> Marketplace Access ({selectedStartups.length})
            </Button>
            <Button onClick={() => setEmailModalOpen(true)} disabled={selectedStartups.length === 0} className="bg-[#FF7A00] hover:bg-[#E66A00] text-white">
              <Mail className="w-4 h-4 mr-2" /> Send Email ({selectedStartups.length})
            </Button>
            <Button onClick={exportToExcel} disabled={exporting} variant="outline" className="border-[#212121]/20">
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {exporting ? "Exporting..." : "Export XLSX"}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9F7F1] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <Checkbox checked={selectedStartups.length === startups.length && startups.length > 0} onCheckedChange={handleSelectAll} />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#212121]">Startup</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#212121]">Founder</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#212121]">Contract Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#212121]">Credits</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#212121]">Marketplace</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#212121]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {startups.map((startup, index) => (
                  <tr key={startup.id} className={index % 2 === 0 ? "bg-white" : "bg-[#F9F7F1]"}>
                    <td className="px-6 py-4">
                      <Checkbox checked={selectedStartups.includes(startup.id)} onCheckedChange={(checked) => handleSelectStartup(startup.id, checked)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={startup.logo_url || "/placeholder.svg?height=40&width=40"} alt={startup.name} className="w-10 h-10 rounded-lg object-cover" />
                        <Link href={`/startups/${startup.id}`} className="text-sm font-medium text-[#212121] hover:text-[#FF7A00] transition-colors">
                          {startup.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#212121]">{startup.founder_name || "Not specified"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getStatusColor(startup.contract_status)} border`}>{startup.contract_status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="text-[#212121]">{startup.total_credits - startup.used_credits}</span>
                        <span className="text-[#212121] opacity-70"> / {startup.total_credits}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`border ${startup.marketplace_access ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                        {startup.marketplace_access ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link href={`/startups/${startup.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#FF7A00] hover:bg-[#FF7A00] hover:text-white">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => deactivateStartup(startup.id, startup.name)} className="text-red-600 hover:bg-red-600 hover:text-white">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Deactivate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {startups.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#212121] opacity-70">No active startups. Click "Add Startup" to get started.</p>
              </div>
            )}
          </div>
        </div>

        <EmailModal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} selectedStartups={startups.filter((s) => selectedStartups.includes(s.id)) as any} />

        <AddStartupModal open={addStartupModalOpen} onClose={() => setAddStartupModalOpen(false)} onStartupAdded={fetchStartups} />

        <MarketplaceAccessModal open={marketplaceModalOpen} onClose={() => setMarketplaceModalOpen(false)} selectedStartups={startups.filter((s) => selectedStartups.includes(s.id))} onAccessUpdated={fetchStartups} />
      </div>
    </DashboardLayout>
  );
}
