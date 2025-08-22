"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent /*, TabsList, TabsTrigger*/ } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Ban,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import AIChat from "@/components/ai-chat";
// import EmailPreferencesModal from "@/components/email-preferences-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Package {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  price: number; // treated as credit hours
  hours: number; // kept for compatibility if used elsewhere
  created_at: string;
  updated_at: string;
}

// Replace your existing "Startup" definition with this full shape:
interface Startup {
  id: string;
  name: string;
  founder_name: string | null;
  email: string;
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

interface ServiceWithPackages extends Service {
  packages: Package[];
}

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState<ServiceWithPackages[]>([]);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [unselecting, setUnselecting] = useState<string | null>(null);
  const [emailPrefsOpen, setEmailPrefsOpen] = useState(false);

  // enhanced UX: search + filter
  const [query, setQuery] = useState("");
  const [showOnlySelectable, setShowOnlySelectable] = useState(false);

  // confirm-unselect dialog state
  const [pendingUnselect, setPendingUnselect] = useState<{
    id: string;
    hours: number;
    name?: string;
  } | null>(null);

  // Fetch on auth
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setLoading(true);
    try {
      const res = await fetch("/api/marketplace");
      if (!res.ok) throw new Error("Failed to load marketplace");
      const json = await res.json();
      setStartup(json.startup);
      setServices(json.services);
      setSelectedServices(json.selectedServices);
    } catch (err) {
      console.error(err);
      toast.error("Couldn’t load the marketplace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (pkgId: string, hours: number) => {
    if (!startup || selecting) return;
    if (startup.total_credits - startup.used_credits < hours) {
      toast.error("Not enough credits to select this package.");
      return;
    }
    setSelecting(pkgId);
    try {
      const res = await fetch("/api/marketplace/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkgId, hours }),
      });
      if (!res.ok) throw await res.json();
      toast.success("Package added to your plan.");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.error || err.message || "Couldn’t select the package.");
    } finally {
      setSelecting(null);
    }
  };

  const confirmUnselect = (pkg: { id: string; hours: number; name?: string }) => {
    if (unselecting) return;
    setPendingUnselect(pkg);
  };

  const handleUnselectConfirmed = async () => {
    if (!startup || !pendingUnselect) return;
    const { id, hours } = pendingUnselect;
    setUnselecting(id);
    try {
      const res = await fetch("/api/marketplace/unselect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: id, hours }),
      });
      if (!res.ok) throw await res.json();
      toast.success("Package removed and credits returned.");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.error || err.message || "Couldn’t unselect the package.");
    } finally {
      setUnselecting(null);
      setPendingUnselect(null);
    }
  };

  const isSelected = (pkgId: string) => selectedServices.includes(pkgId);
  const available = startup ? startup.total_credits - startup.used_credits : 0;
  const usagePct = useMemo(() => {
    if (!startup || startup.total_credits === 0) return 0;
    return Math.min(100, Math.round((startup.used_credits / startup.total_credits) * 100));
  }, [startup]);

  const filteredServices = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return services
      .map((s) => ({
        ...s,
        packages: s.packages.filter((p) => {
          const selectable = !startup || available >= p.price || isSelected(p.id);
          if (showOnlySelectable && !selectable) return false;
          if (!lower) return true;
          return (
            s.name.toLowerCase().includes(lower) ||
            (s.description || "").toLowerCase().includes(lower) ||
            p.name.toLowerCase().includes(lower) ||
            (p.description || "").toLowerCase().includes(lower)
          );
        }),
      }))
      .filter((s) => s.packages.length > 0 || !showOnlySelectable);
  }, [services, query, showOnlySelectable, available, startup]);

  if (loading || status === "loading") {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7A00]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">Unable to load startup data</div>
      </DashboardLayout>
    );
  }

  if (!startup.marketplace_access) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-8 text-center">
              <Ban className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">Marketplace Disabled</h2>
              <p className="text-red-700">Contact your program manager for access.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        {/* controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services & packages"
                className="w-full rounded-xl border bg-white/70 px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={showOnlySelectable ? "default" : "outline"}
              onClick={() => setShowOnlySelectable((v) => !v)}
            >
              {showOnlySelectable ? "Showing selectable" : "Show selectable only"}
            </Button>
            <Button variant="ghost" onClick={() => fetchData(true)} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          {/* <TabsList className="grid grid-cols-2 bg-white">
            <TabsTrigger value="services" className="flex-1">
              Services
            </TabsTrigger>
            <TabsTrigger value="ai-advisor" className="flex-1">
              AI Advisor
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="services">
            <div className="grid lg:grid-cols-2 gap-6">
              {filteredServices.map((service) => (
                <Card key={service.id} className="bg-white/90 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="leading-tight">{service.name}</span>
                      <Badge variant="secondary">{service.packages.length} package{service.packages.length !== 1 ? "s" : ""}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.description?.trim() || "No description yet. Explore available packages below."}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {service.packages.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-6">No packages available.</p>
                    )}

                    <div className="space-y-3">
                      {service.packages.map((pkg) => {
                        const selected = isSelected(pkg.id);
                        const canAfford = available >= pkg.price || selected; // allow unselect regardless

                        return (
                          <div
                            key={pkg.id}
                            className={`group rounded-xl border p-4 transition-all ${
                              selected
                                ? "border-emerald-200 bg-emerald-50/50"
                                : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold truncate">{pkg.name}</h4>
                                  {selected ? (
                                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                                      <CheckCircle className="w-3 h-3 mr-1" /> Selected
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {pkg.description?.trim() || "Focused scope delivery from our experts. Includes planning, execution, and a summary report."}
                                </p>

                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                {selected ? (
                                  <Button
                                    onClick={() => confirmUnselect({ id: pkg.id, hours: pkg.price, name: pkg.name })}
                                    variant="outline"
                                    size="sm"
                                    disabled={unselecting === pkg.id}
                                    className="gap-1"
                                    aria-label={`Unselect ${pkg.name}`}
                                  >
                                    {unselecting === pkg.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                    Unselect
                                  </Button>
                                ) : canAfford ? (
                                  <Button
                                    onClick={() => handleSelect(pkg.id, pkg.price)}
                                    disabled={selecting === pkg.id}
                                    size="sm"
                                    className="gap-2"
                                    aria-label={`Select ${pkg.name}`}
                                  >
                                    {selecting === pkg.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-4 h-4" />
                                    )}
                                    Select
                                  </Button>
                                ) : (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> Not enough credits
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* <TabsContent value="ai-advisor">
            <AIChat />
          </TabsContent> */}
        </Tabs>


        {/* Confirm Unselect Dialog (replaces window.confirm for better UX) */}
        <AlertDialog open={!!pendingUnselect} onOpenChange={(open) => !open && setPendingUnselect(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove package?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingUnselect?.name ? (
                  <>You are about to unselect <strong>{pendingUnselect.name}</strong>. Credits will be returned to your balance.</>
                ) : (
                  <>You are about to unselect this package. Credits will be returned to your balance.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!unselecting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnselectConfirmed} disabled={!!unselecting} className="bg-rose-600 hover:bg-rose-600">
                {unselecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                <span className="ml-2">Unselect</span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
