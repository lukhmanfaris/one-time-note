"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { logout } from "@/lib/api";
import Link from "next/link";

export default function AccountPage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <p className="text-muted-foreground text-center">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPro = user.tier === "pro" || user.tier === "enterprise";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Account</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Profile
            <Badge variant={isPro ? "default" : "secondary"}>
              {isPro ? "Pro" : "Free"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active notes</span>
            <span>{user.active_notes}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPro ? (
            <div className="text-sm text-muted-foreground">
              You have access to all features including extended note TTL (24h, 7 days) and unlimited active notes.
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Free accounts are limited to 1-hour note TTL and 1 active note at a time.
              </div>
              <div className="space-y-2 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-destructive">&#x2717;</span>
                  <span>1-hour TTL only</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">&#x2717;</span>
                  <span>1 active note at a time</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-green-600">&#x2713;</span>
                  <span>24-hour and 7-day TTL</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-green-600">&#x2713;</span>
                  <span>Unlimited active notes</span>
                </div>
              </div>
            </>
          )}
          {!isPro && (
            <Button className="w-full mt-4">Upgrade to Pro &mdash; $5/month</Button>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/send" className="inline-flex items-center justify-center rounded-lg border border-border bg-background h-8 px-2.5 text-sm font-medium hover:bg-muted hover:text-foreground">
          Send a Note
        </Link>
        <Button variant="destructive" onClick={handleLogout}>Log Out</Button>
      </div>
    </div>
  );
}