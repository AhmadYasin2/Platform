"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession, type SignInResponse } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect once logged in
  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      router.push(role === "manager" ? "/dashboard" : "/startup-dashboard");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // call NextAuth credentials provider
    const res = (await signIn("credentials", {
      redirect: false,
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })) as SignInResponse | undefined;

    setIsLoading(false);

    if (!res || res.error) {
      let msg = res?.error ?? "Login failed";
      if (msg.includes("Invalid credentials")) {
        msg = "Invalid email or password.";
      } else if (msg.includes("Email not confirmed")) {
        msg = "Please confirm your email before signing in.";
      }
      setError(msg);
    }
    // successful signIn will update session → effect will redirect
  };

  // while loading or already signed in, render nothing
  if (status === "loading" || status === "authenticated") {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-[#212121]">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FF7A00] hover:bg-[#E66A00] text-white"
            disabled={isLoading}
          >
            {isLoading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
