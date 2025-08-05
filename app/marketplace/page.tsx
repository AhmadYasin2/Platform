"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, Loader2, Ban, X } from "lucide-react";
import AIChat from "@/components/ai-chat";
import EmailPreferencesModal from "@/components/email-preferences-modal";
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
  price: number;
  hours: number;
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
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (pkgId: string, hours: number) => {
    if (!startup || selecting) return;
    if (startup.total_credits - startup.used_credits < hours) {
      alert("Insufficient credits!");
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
      toast.success("Package selected");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.error || err.message);
    } finally {
      setSelecting(null);
    }
  };

  const handleUnselect = async (pkgId: string, hours: number) => {
    if (!startup || unselecting) return;
    if (!confirm("Unselect this package and return credits?")) {
      return;
    }
    setUnselecting(pkgId);
    try {
      const res = await fetch("/api/marketplace/unselect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkgId, hours }),
      });
      if (!res.ok) throw await res.json();
      toast.success("Package unselected");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.error || err.message);
    } finally {
      setUnselecting(null);
    }
  };

  const isSelected = (pkgId: string) => selectedServices.includes(pkgId);
  const available = startup ? startup.total_credits - startup.used_credits : 0;

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
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                Marketplace Disabled
              </h2>
              <p className="text-red-700">
                Contact your program manager for access.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        {/* Header omitted for brevity */}

        <Tabs defaultValue="services" className="space-y-6">
          <TabsContent value="services">
            <div className="grid lg:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                    <p>{service.description}</p>
                  </CardHeader>
                  <CardContent>
                    {service.packages.map((pkg) => (
                      <div key={pkg.id} className="border rounded p-4 mb-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{pkg.name}</h4>
                            <p className="text-sm opacity-70">
                              {pkg.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          {isSelected(pkg.id) ? (
                            <Button
                              onClick={() => handleUnselect(pkg.id, pkg.price)}
                              variant="outline"
                              size="sm"
                              disabled={unselecting === pkg.id}
                            >
                              {unselecting === pkg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              Unselect
                            </Button>
                          ) : available >= pkg.price ? (
                            <Button
                              onClick={() => handleSelect(pkg.id, pkg.price)}
                              disabled={selecting === pkg.id}
                            >
                              {selecting === pkg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Select"
                              )}
                            </Button>
                          ) : (
                            <div className="text-gray-500 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Insufficient hrs
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {service.packages.length === 0 && (
                      <p className="text-center opacity-70">
                        No packages available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai-advisor">
            <AIChat />
          </TabsContent>
        </Tabs>

        <EmailPreferencesModal
          open={emailPrefsOpen}
          onClose={() => setEmailPrefsOpen(false)}
          startup={startup}
          onUpdate={(updated: Startup) => setStartup(updated)} // wrap it
        />
      </div>
    </DashboardLayout>
  );
}
