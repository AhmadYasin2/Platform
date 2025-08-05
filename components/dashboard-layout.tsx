"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  // pull the session & loading state from next-auth
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;
  // assume you included `role` & `full_name` on the JWT via your NextAuth callbacks
  const profile = user && {
    role: (user as any).role as string,
    full_name: (user as any).full_name as string,
    email: user.email as string,
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#FF7A00] rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white rounded-sm relative">
              <div className="absolute top-0 right-0 w-2 h-2 bg-[#FF7A00]"></div>
            </div>
          </div>
          <p className="text-[#212121]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const managerNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/startups", label: "Startups", icon: Users },
    { href: "/services", label: "Services Setup", icon: Settings },
  ];

  const startupNavItems = [
    { href: "/startup-dashboard", label: "Dashboard", icon: Home },
    { href: "/marketplace", label: "Services", icon: ShoppingBag },
  ];

  const navItems =
    profile.role === "manager" ? managerNavItems : startupNavItems;

  console.log("Current pathname:", pathname);
  console.log("User role:", profile.role);
  console.log("Nav items:", navItems);

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#FF7A00] rounded flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-sm relative">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-[#FF7A00]"></div>
                </div>
              </div>
              <span className="text-lg font-bold text-[#212121]">
                Orange Corners
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                        ${
                          isActive
                            ? "bg-[#FF7A00] text-white"
                            : "text-[#212121] hover:bg-[#F9F7F1]"
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#212121] opacity-70 capitalize">
                  {profile.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-[#212121] hover:text-[#FF7A00]"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#212121]">
                {profile.full_name || profile.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#FF7A00] rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm relative">
                  <div className="absolute top-0 right-0 w-1 h-1 bg-[#FF7A00]"></div>
                </div>
              </div>
              <span className="text-sm font-medium text-[#212121]">
                Orange Corners
              </span>
            </div>
            <p className="text-xs text-[#212121] opacity-70">
              © 2025 Orange Corners. All Rights Reserved.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-[#212121] rounded-sm"></div>
              <div className="w-4 h-4 bg-[#212121] rounded-sm"></div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
