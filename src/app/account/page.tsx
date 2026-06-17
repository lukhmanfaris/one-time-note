"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { logout, getSessions, revokeSession, revokeAllOtherSessions } from "@/lib/api";
import { getErrorMessage } from "@/lib/api-errors";
import type { SessionInfo } from "@/lib/api";

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
      <div className="max-w-lg mx-auto px-4 pt-navbar pb-12 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
            <div className="h-4 bg-foreground/10 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              <div className="h-3 bg-foreground/5 rounded w-full" />
              <div className="h-3 bg-foreground/5 rounded w-4/5" />
              <div className="h-3 bg-foreground/5 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPro = user.tier === "pro" || user.tier === "enterprise";
  const otherSessions = sessions.filter((s) => !s.current);

  return (
    <div className="max-w-lg mx-auto px-4 pt-navbar pb-12">
      <h1 className="font-ui text-2xl font-bold mb-6">Account</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-ui flex items-center gap-2">
            Profile
            <Badge variant={isPro ? "default" : "secondary"}>
              {isPro ? "Pro" : "Free"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-mono">{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active notes</span>
            <span className="font-mono">{user.active_notes}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-ui">Plan</CardTitle>
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
                  <span className="text-destructive font-mono">✗</span>
                  <span>1-hour TTL only</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive font-mono">✗</span>
                  <span>1 active note at a time</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-success font-mono">✓</span>
                  <span>24-hour and 7-day TTL</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-success font-mono">✓</span>
                  <span>Unlimited active notes</span>
                </div>
              </div>
            </>
          )}
          {!isPro && (
            <Button className="w-full mt-4 font-ui">Upgrade to Pro &mdash; $5/month</Button>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-ui flex items-center justify-between">
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
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-border p-3 animate-pulse">
                  <div className="h-3 bg-foreground/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-foreground/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <Monitor className="w-8 h-8 opacity-30" />
              <p className="text-sm">No active sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{session.browser}</span>
                      {session.current && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
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
        <Button variant="outline" render={<Link href="/send" />}>
          Send a Note
        </Button>
        <Button variant="destructive" onClick={handleLogout}>Log Out</Button>
      </div>
    </div>
  );
}
