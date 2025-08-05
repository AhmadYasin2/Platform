"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

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

interface ServiceWithPackages extends Service {
  packages: Package[];
}

export default function ServicesSetupPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState<ServiceWithPackages[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [showNewService, setShowNewService] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    } else if (status === "authenticated") {
      if (session.user.role !== "manager") {
        window.location.href = "/dashboard";
      } else {
        fetchServices();
      }
    }
  }, [status, session]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed loading services");
      setServices(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addNewService = async () => {
    if (!newService.name || !newService.description) return;
    setSaving("new-service");
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
      });
      if (!res.ok) throw await res.json();
      const created = await res.json();
      setServices((prev) => [...prev, created]);
      setNewService({ name: "", description: "" });
      setShowNewService(false);
    } catch (err: any) {
      console.error(err);
      alert(err.error || "Failed to add service");
    } finally {
      setSaving(null);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    setSaving(id);
    const before = services;
    setServices((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw await res.json();
    } catch (err) {
      console.error(err);
      alert("Failed to delete service");
      setServices(before);
    } finally {
      setSaving(null);
    }
  };

  const updateService = async (
    id: string,
    updates: { name?: string; description?: string }
  ) => {
    try {
      await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const addPackageToService = async (serviceId: string) => {
    setSaving(`pkg-${serviceId}`);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          name: "New Package",
          description: "Package description",
          price: 500,
          hours: 10,
        }),
      });
      if (!res.ok) throw await res.json();
      const pkg = await res.json();
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId ? { ...s, packages: [...s.packages, pkg] } : s
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to add package");
    } finally {
      setSaving(null);
    }
  };

  async function updatePackage(packageId: string, updates: Partial<Package>) {
    const res = await fetch(`/api/packages/${packageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const text = await res.text(); // grab the raw response body
    if (!res.ok) {
      // try to parse JSON, otherwise just use the raw text
      let msg: string;
      try {
        const data = JSON.parse(text);
        msg = data.error || data.message || JSON.stringify(data);
      } catch {
        msg = text;
      }
      throw new Error(msg);
    }

    return JSON.parse(text);
  }

  const deletePackage = async (serviceId: string, pkgId: string) => {
    if (!confirm("Delete this package?")) return;
    setSaving(pkgId);
    const before = services;
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, packages: s.packages.filter((p) => p.id !== pkgId) }
          : s
      )
    );
    try {
      const res = await fetch(`/api/packages/${pkgId}`, { method: "DELETE" });
      if (!res.ok) throw await res.json();
    } catch (err) {
      console.error(err);
      alert("Failed to delete package");
      setServices(before);
    } finally {
      setSaving(null);
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

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#212121] mb-2">
              Services Setup
            </h1>
            <p className="text-[#212121] opacity-70">
              Configure available services and packages for startups
            </p>
          </div>
          <Button
            onClick={() => setShowNewService(true)}
            className="bg-[#FF7A00] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        </div>

        {/* New Service Form */}
        {showNewService && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="svc-name">Name</Label>
                <Input
                  id="svc-name"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="svc-desc">Description</Label>
                <Textarea
                  id="svc-desc"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={addNewService}
                  disabled={saving === "new-service"}
                >
                  {saving === "new-service" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}{" "}
                  Save
                </Button>
                <Button onClick={() => setShowNewService(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services List */}
        <div className="space-y-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Input
                      value={service.name}
                      onChange={(e) =>
                        updateService(service.id, { name: e.target.value })
                      }
                      className="text-xl font-bold w-[80%]"
                    />
                    <Textarea
                      value={service.description || ""}
                      rows={1}
                      className="mt-1 w-[80%]"
                      onChange={(e) =>
                        updateService(service.id, {
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => addPackageToService(service.id)}
                      disabled={saving === `pkg-${service.id}`}
                    >
                      {saving === `pkg-${service.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => deleteService(service.id)}
                      disabled={saving === service.id}
                    >
                      {saving === service.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {service.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border rounded-lg p-4 mb-4 space-y-4"
                  >
                    {/* Name */}
                    <div className="flex items-center space-x-2">
                      <Label className="w-16">Name</Label>
                      <Input
                        value={pkg.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setServices((prev) =>
                            prev.map((s) =>
                              s.id === service.id
                                ? {
                                    ...s,
                                    packages: s.packages.map((x) =>
                                      x.id === pkg.id
                                        ? { ...x, name: newName }
                                        : x
                                    ),
                                  }
                                : s
                            )
                          );
                        }}
                        className="flex-1"
                      />
                    </div>
                    {/* Price */}
                    <div className="flex items-center space-x-2">
                      <Label className="w-16">Price</Label>
                      <Input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value);
                          setServices((prev) =>
                            prev.map((s) =>
                              s.id === service.id
                                ? {
                                    ...s,
                                    packages: s.packages.map((x) =>
                                      x.id === pkg.id
                                        ? {
                                            ...x,
                                            price: newPrice,
                                            hours: newPrice,
                                          }
                                        : x
                                    ),
                                  }
                                : s
                            )
                          );
                        }}
                        className="flex-1"
                      />
                    </div>
                    {/* Description */}
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <div className="flex items-start space-x-2">
                        <Textarea
                          rows={2}
                          value={pkg.description || ""}
                          onChange={(e) => {
                            const desc = e.target.value;
                            setServices((prev) =>
                              prev.map((s) =>
                                s.id === service.id
                                  ? {
                                      ...s,
                                      packages: s.packages.map((x) =>
                                        x.id === pkg.id
                                          ? { ...x, description: desc }
                                          : x
                                      ),
                                    }
                                  : s
                              )
                            );
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Delete + Save Packages */}
                    <div className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#FF7A00] text-white mr-2"
                        onClick={async () => {
                          const before = services; // 1) snapshot full state

                          // 2) optimistic update entire pkg
                          setServices((prev) =>
                            prev.map((s) =>
                              s.id === service.id
                                ? {
                                    ...s,
                                    packages: s.packages.map((x) =>
                                      x.id === pkg.id
                                        ? {
                                            ...x,
                                            name: pkg.name,
                                            price: pkg.price,
                                            description: pkg.description,
                                          }
                                        : x
                                    ),
                                  }
                                : s
                            )
                          );

                          setSaving(pkg.id);

                          try {
                            // 3) send full object
                            await updatePackage(pkg.id, {
                              name: pkg.name,
                              price: pkg.price,
                              description: pkg.description,
                            });
                          } catch (err: any) {
                            console.error(err);
                            setServices(before); // 4) rollback on error
                            alert(err.message || "Failed to save package");
                          } finally {
                            setSaving(null);
                          }
                        }}
                      >
                        Save
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePackage(service.id, pkg.id)}
                        disabled={saving === pkg.id}
                      >
                        {saving === pkg.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {service.packages.length === 0 && (
                  <p className="text-center opacity-70 py-4">
                    No packages yet.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
