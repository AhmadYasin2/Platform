"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Ban,
  X,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  supabase,
  type Service,
  type Package,
  type Startup,
} from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import AIChat from "@/components/ai-chat";
import EmailPreferencesModal from "@/components/email-preferences-modal";
import { Toast } from "@radix-ui/react-toast";
import { toast } from "sonner";

interface ServiceWithPackages extends Service {
  packages: Package[];
}

export default function MarketplacePage() {
  const [services, setServices] = useState<ServiceWithPackages[]>([]);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [unselecting, setUnselecting] = useState<string | null>(null);
  const [emailPrefsOpen, setEmailPrefsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      // console.log("=== FETCHING MARKETPLACE DATA ===");

      // Fetch current startup data first
      const { data: startupData, error: startupError } = await supabase
        .from("startups")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (startupError) {
        console.error("Startup fetch error:", startupError);
        throw startupError;
      }

      // console.log("Startup data:", startupData);
      setStartup(startupData);

      // Check if marketplace access is disabled
      if (!startupData.marketplace_access) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch services with packages
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });

      if (servicesError) throw servicesError;

      const { data: packagesData, error: packagesError } = await supabase
        .from("packages")
        .select("*")
        .order("created_at", { ascending: true });

      if (packagesError) throw packagesError;

      // Group packages by service
      const servicesWithPackages =
        servicesData?.map((service) => ({
          ...service,
          packages:
            packagesData?.filter((pkg) => pkg.service_id === service.id) || [],
        })) || [];

      setServices(servicesWithPackages);

      // Fetch selected services with detailed logging
      // console.log("Fetching selected services for startup:", startupData.id);
      const { data: selectedData, error: selectedError } = await supabase
        .from("startup_services")
        .select("*")
        .eq("startup_id", startupData.id);

      if (selectedError) {
        // console.error("Selected services fetch error:", selectedError);
        throw selectedError;
      }

      // console.log("Selected services from DB:", selectedData);
      const selectedPackageIds = selectedData?.map((s) => s.package_id) || [];
      // console.log("Selected package IDs:", selectedPackageIds);
      setSelectedServices(selectedPackageIds);
    } catch (error) {
      console.error("Error fetching marketplace data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectPackage = async (packageId: string, hours: number) => {
    if (!startup || selecting) return;

    if (startup.total_credits - startup.used_credits < hours) {
      alert("Insufficient credits for this package!");
      return;
    }

    setSelecting(packageId);
    try {
      console.log("=== SELECTING PACKAGE ===");
      console.log("Package ID:", packageId);
      console.log("Hours:", hours);
      console.log("Startup ID:", startup.id);

      // Add to startup_services
      const { data: insertData, error: serviceError } = await supabase
        .from("startup_services")
        .insert({
          startup_id: startup.id,
          package_id: packageId,
          hours_used: hours,
        })
        .select();

      if (serviceError) {
        console.error("Service insert error:", serviceError);
        throw serviceError;
      }

      console.log("Service inserted:", insertData);

      // Update used credits
      const newUsedCredits = startup.used_credits + hours;
      console.log("Updating credits:", {
        oldCredits: startup.used_credits,
        newCredits: newUsedCredits,
      });

      const { error: updateError } = await supabase
        .from("startups")
        .update({ used_credits: newUsedCredits })
        .eq("id", startup.id);

      if (updateError) {
        console.error("Credits update error:", updateError);
        throw updateError;
      }

      // Update local state immediately
      setStartup({ ...startup, used_credits: newUsedCredits });
      setSelectedServices([...selectedServices, packageId]);

      console.log("Package selected successfully");
      // alert("Package selected successfully!");
      toast.success("Package selected successfully");
    } catch (error) {
      console.error("Error selecting package:", error);
      alert(`Failed to select package: ${error.message}`);
    } finally {
      setSelecting(null);
    }
  };

  const handleUnselectPackage = async (packageId: string, hours: number) => {
    if (!startup || unselecting) return;

    if (
      !confirm(
        "Are you sure you want to unselect this package? The credits will be returned to your account."
      )
    ) {
      return;
    }

    setUnselecting(packageId);
    try {
      console.log("=== UNSELECTING PACKAGE ===");
      console.log("Package ID:", packageId);
      console.log("Hours to return:", hours);
      console.log("Startup ID:", startup.id);

      // First, let's check what exists in the database
      const { data: existingServices, error: checkError } = await supabase
        .from("startup_services")
        .select("*")
        .eq("startup_id", startup.id)
        .eq("package_id", packageId);

      if (checkError) {
        // console.error("Check existing services error:", checkError);
        throw checkError;
      }

      // console.log("Existing services to delete:", existingServices);

      if (!existingServices || existingServices.length === 0) {
        console.warn("No services found to delete");
        alert("Service not found in database. Refreshing data...");
        await fetchData(true);
        return;
      }

      // Remove from startup_services
      const { error: serviceError } = await supabase
        .from("startup_services")
        .delete()
        .eq("startup_id", startup.id)
        .eq("package_id", packageId);

      if (serviceError) {
        console.error("Service delete error:", serviceError);
        throw serviceError;
      }

      // console.log("Service deleted from database");

      // Update used credits
      const newUsedCredits = Math.max(0, startup.used_credits - hours);
      // console.log("Updating credits after unselect:", {
      //   oldCredits: startup.used_credits,
      //   newCredits: newUsedCredits,
      // });

      const { error: updateError } = await supabase
        .from("startups")
        .update({ used_credits: newUsedCredits })
        .eq("id", startup.id);

      if (updateError) {
        console.error("Credits update error:", updateError);
        throw updateError;
      }

      // Update local state immediately
      setStartup({ ...startup, used_credits: newUsedCredits });
      setSelectedServices(selectedServices.filter((id) => id !== packageId));

      // console.log("Package unselected successfully");
      alert("Package unselected successfully! Credits have been returned.");

      // Refresh data to ensure consistency
      setTimeout(() => fetchData(true), 500);
    } catch (error) {
      console.error("Error unselecting package:", error);
      alert(`Failed to unselect package: ${error.message}`);
    } finally {
      setUnselecting(null);
    }
  };

  const canAfford = (hours: number) => {
    if (!startup) return false;
    return startup.total_credits - startup.used_credits >= hours;
  };

  const isSelected = (packageId: string) =>
    selectedServices.includes(packageId);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF7A00]" />
            <p className="text-[#212121]">Loading services...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <p className="text-[#212121]">Unable to load startup data</p>
        </div>
      </DashboardLayout>
    );
  }

  // Check if marketplace access is disabled
  if (!startup.marketplace_access) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-8 text-center">
                <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-800 mb-2">
                  Marketplace Access Disabled
                </h2>
                <p className="text-red-700 mb-4">
                  Your access to the services marketplace has been temporarily
                  disabled by the program management team.
                </p>
                <p className="text-sm text-red-600">
                  Please contact your program manager if you believe this is an
                  error or if you need to discuss your service requirements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const availableHours = startup.total_credits - startup.used_credits;

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#212121] mb-2">
                Services Marketplace
              </h1>
              <p className="text-[#212121] opacity-70">
                Choose services and get AI-powered recommendations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* <Button
                onClick={() => setEmailPrefsOpen(true)}
                variant="outline"
                className="border-[#1BC9C9] text-[#1BC9C9] hover:bg-[#1BC9C9] hover:text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Email Preferences
              </Button> */}
              {/* <Button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                variant="outline"
                className="border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-white"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button> */}
              {/* <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-[#FF7A00]" />
                    <div>
                      <p className="text-sm text-[#212121] opacity-70">
                        Available Hours
                      </p>
                      <p className="text-xl font-bold text-[#FF7A00]">
                        {availableHours}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          {/* <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger
              value="services"
              className="flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Browse Services</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai-advisor"
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Advisor</span>
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="services">
            {/* Debug info */}
            {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>Debug:</strong> Total: {startup.total_credits}, Used:{" "}
              {startup.used_credits}, Available: {availableHours} | Selected: [
              {selectedServices.join(", ")}]
            </div> */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="bg-white shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#212121]">
                      {service.name}
                    </CardTitle>
                    <p className="text-sm text-[#212121] opacity-70">
                      {service.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {service.packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-[#212121] mb-1">
                                {pkg.name}
                              </h4>
                              <p className="text-sm text-[#212121] opacity-70 mb-2">
                                {pkg.description}
                              </p>
                              {/* <div className="flex items-center space-x-2">
                                <Badge
                                  variant="outline"
                                  className="text-[#FF7A00] border-[#FF7A00]"
                                >
                                  Costs: {pkg.price} Hours
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  ID: {pkg.id.slice(0, 8)}
                                </span>
                              </div> */}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {isSelected(pkg.id) ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    Selected
                                  </span>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleUnselectPackage(pkg.id, pkg.price)
                                  }
                                  disabled={unselecting === pkg.id}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                >
                                  {unselecting === pkg.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                      Removing...
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-4 h-4 mr-1" />
                                      Unselect
                                    </>
                                  )}
                                </Button>
                              </div>
                            ) : canAfford(pkg.price) ? (
                              <Button
                                onClick={() =>
                                  handleSelectPackage(pkg.id, pkg.price)
                                }
                                disabled={selecting === pkg.id}
                                className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
                              >
                                {selecting === pkg.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Selecting...
                                  </>
                                ) : (
                                  "Choose Package"
                                )}
                              </Button>
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-500">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">
                                  Needed more hours
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {service.packages.length === 0 && (
                        <p className="text-center text-[#212121] opacity-70 py-4">
                          No packages available for this service.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {services.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <p className="text-[#212121] opacity-70">
                    No services are currently available.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-advisor">
            <AIChat />
          </TabsContent>
        </Tabs>

        {startup && (
          <EmailPreferencesModal
            open={emailPrefsOpen}
            onClose={() => setEmailPrefsOpen(false)}
            startup={startup}
            onUpdate={setStartup}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
