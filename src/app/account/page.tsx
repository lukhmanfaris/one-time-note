"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { logout, getSessions, revokeSession, revokeAllOtherSessions } from "@/lib/api";
import { getErrorMessage } from "@/lib/api-errors";
import type { SessionInfo } from "@/lib/api";
import Link from "next/link";

export default function AccountPage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  async function loadSessions() {
    try {
      setSessionsLoading(true);
      const data = await getSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      setRevoking(sessionId);
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRevoking(null);
    }
  }

  async function handleRevokeAll() {
    try {
      setRevokingAll(true);
      await revokeAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.current));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRevokingAll(false);
    }
  }

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
  const otherSessions = sessions.filter((s) => !s.current);

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Active Sessions
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAll}
                disabled={revokingAll}
              >
                {revokingAll ? "Signing out..." : "Sign out all other devices"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{session.browser}</span>
                      {session.current && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.os} &middot; {session.ip}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last active: {new Date(session.lastActive).toLocaleString()}
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? "Revoking..." : "Revoke"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
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