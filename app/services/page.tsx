// app/services-setup-page.tsx
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { supabase, type Service, type Package } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

interface ServiceWithPackages extends Service {
  packages: Package[];
}

export default function ServicesSetupPage() {
  const [services, setServices] = useState<ServiceWithPackages[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [showNewService, setShowNewService] = useState(false);
  const { profile } = useAuth();

  // Fetch all services and packages once
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
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

      setServices(
        servicesData.map((service) => ({
          ...service,
          packages: packagesData.filter((pkg) => pkg.service_id === service.id),
        }))
      );
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  const addNewService = async () => {
    if (!newService.name || !newService.description) return;
    setSaving("new-service");
    try {
      const { data, error } = await supabase
        .from("services")
        .insert({ name: newService.name, description: newService.description })
        .select()
        .single();
      if (error) throw error;
      setServices((prev) => [...prev, { ...data, packages: [] }]);
      setNewService({ name: "", description: "" });
      setShowNewService(false);
    } catch (err) {
      console.error("Error adding service:", err);
      alert("Failed to add service");
    } finally {
      setSaving(null);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service and all its packages?"))
      return;

    // Optimistic UI update
    const previous = services;
    setServices(previous.filter((s) => s.id !== serviceId));
    setSaving(serviceId);

    try {
      const { error } = await supabase.from("services").delete().eq("id", serviceId);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting service:", err);
      alert("Failed to delete service");
      setServices(previous); // rollback
    } finally {
      setSaving(null);
    }
  };

  const addPackageToService = async (serviceId: string) => {
    setSaving(`package-${serviceId}`);
    try {
      const { data, error } = await supabase
        .from("packages")
        .insert({
          service_id: serviceId,
          name: "New Package",
          description: "Package description",
          price: 500,
          hours: 10,
        })
        .select()
        .single();
      if (error) throw error;

      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId ? { ...s, packages: [...s.packages, data] } : s
        )
      );
    } catch (err) {
      console.error("Error adding package:", err);
      alert("Failed to add package");
    } finally {
      setSaving(null);
    }
  };

  const updatePackage = async (
    serviceId: string,
    packageId: string,
    updates: Partial<Package>
  ) => {
    try {
      if (updates.price !== undefined) {
        updates.hours = updates.price;
      }
      const { error } = await supabase.from("packages").update(updates).eq("id", packageId);
      if (error) throw error;
    } catch (err) {
      console.error("Error updating package:", err);
    }
  };

  const deletePackage = async (serviceId: string, packageId: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    // Optimistic UI update
    const previous = services;
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, packages: s.packages.filter((p) => p.id !== packageId) }
          : s
      )
    );
    setSaving(packageId);

    try {
      const { error } = await supabase.from("packages").delete().eq("id", packageId);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting package:", err);
      alert("Failed to delete package");
      setServices(previous); // rollback
    } finally {
      setSaving(null);
    }
  };

  const updateService = async (
    serviceId: string,
    updates: { name?: string; description?: string }
  ) => {
    try {
      const { error } = await supabase.from("services").update(updates).eq("id", serviceId);
      if (error) throw error;
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
      );
    } catch (err) {
      console.error("Error updating service:", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7A00]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#212121] mb-2">Services Setup</h1>
            <p className="text-[#212121] opacity-70">
              Configure available services and packages for startups
            </p>
          </div>
          {profile?.role === "manager" && (
            <Button
              onClick={() => setShowNewService(true)}
              className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          )}
        </div>

        {/* New Service Form */}
        {showNewService && profile?.role === "manager" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Technology Consulting"
                />
              </div>
              <div>
                <Label htmlFor="serviceDescription">Description</Label>
                <Textarea
                  id="serviceDescription"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService({ ...newService, description: e.target.value })
                  }
                  placeholder="Brief description of the service category"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={addNewService}
                  disabled={saving === "new-service"}
                  className="bg-[#FF7A00] text-white"
                >
                  {saving === "new-service" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Service
                </Button>
                <Button variant="outline" onClick={() => setShowNewService(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services & Packages */}
        <div className="space-y-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {profile?.role === "manager" ? (
                      <>
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(service.id, { name: e.target.value })}
                          className="text-xl font-bold"
                        />
                        <Textarea
                          value={service.description || ""}
                          onChange={(e) =>
                            updateService(service.id, { description: e.target.value })
                          }
                          rows={1}
                          className="mt-1"
                        />
                      </>
                    ) : (
                      <CardTitle>{service.name}</CardTitle>
                    )}
                  </div>
                  {profile?.role === "manager" && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => addPackageToService(service.id)}
                        disabled={saving === `package-${service.id}`}
                        className="text-[#FF7A00]"
                      >
                        {saving === `package-${service.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => deleteService(service.id)}
                        disabled={saving === service.id}
                        className="text-red-600"
                      >
                        {saving === service.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.packages.map((pkg) => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Package Name */}
                        <div>
                          <Label htmlFor={`package-name-${pkg.id}`}>Package Name</Label>
                          {profile?.role === "manager" ? (
                            <Input
                              id={`package-name-${pkg.id}`}
                              value={pkg.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setServices((prev) =>
                                  prev.map((s) =>
                                    s.id === service.id
                                      ? {
                                          ...s,
                                          packages: s.packages.map((p) =>
                                            p.id === pkg.id ? { ...p, name: newName } : p
                                          ),
                                        }
                                      : s
                                  )
                                );
                                updatePackage(service.id, pkg.id, { name: newName });
                              }}
                            />
                          ) : (
                            <p className="mt-1">{pkg.name}</p>
                          )}
                        </div>

                        {/* Package Price */}
                        <div>
                          <Label htmlFor={`package-price-${pkg.id}`}>Price (JOD)</Label>
                          {profile?.role === "manager" ? (
                            <Input
                              id={`package-price-${pkg.id}`}
                              type="number"
                              value={pkg.price}
                              onChange={(e) => {
                                const newPrice = Number(e.target.value);
                                const newHours = Math.round(newPrice / 50);
                                setServices((prev) =>
                                  prev.map((s) =>
                                    s.id === service.id
                                      ? {
                                          ...s,
                                          packages: s.packages.map((p) =>
                                            p.id === pkg.id
                                              ? { ...p, price: newPrice, hours: newPrice }
                                              : p
                                          ),
                                        }
                                      : s
                                  )
                                );
                                updatePackage(service.id, pkg.id, { price: newPrice });
                              }}
                            />
                          ) : (
                            <p className="mt-1">{pkg.price}</p>
                          )}
                        </div>

                        {/* Delete Package */}
                        {profile?.role === "manager" && (
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePackage(service.id, pkg.id)}
                              disabled={saving === pkg.id}
                              className="text-red-600"
                            >
                              {saving === pkg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mt-3">
                        <Label htmlFor={`package-desc-${pkg.id}`}>Description</Label>
                        {profile?.role === "manager" ? (
                          <Textarea
                            id={`package-desc-${pkg.id}`}
                            value={pkg.description || ""}
                            onChange={(e) => {
                              const newDesc = e.target.value;
                              setServices((prev) =>
                                prev.map((s) =>
                                  s.id === service.id
                                    ? {
                                        ...s,
                                        packages: s.packages.map((p) =>
                                          p.id === pkg.id ? { ...p, description: newDesc } : p
                                        ),
                                      }
                                    : s
                                )
                              ); 
                              updatePackage(service.id, pkg.id, { description: newDesc });
                            }}
                            rows={2}
                          />
                        ) : (
                          <p className="mt-1 opacity-70">{pkg.description}</p>
                        )}
                      </div>

                      {/* Hours Badge */}

                    </div>
                  ))}

                  {service.packages.length === 0 && (
                    <p className="text-center opacity-70 py-4">
                      {profile?.role === "manager"
                        ? 'No packages added yet. Click "Add Package" to get started.'
                        : "No packages available for this service."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
