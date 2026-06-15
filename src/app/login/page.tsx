"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { login } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage } from "@/lib/api-errors";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError("Bot verification incomplete. Please wait.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password, turnstileToken);
      setUser(result.user);
      router.push("/account");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Log In</CardTitle>
          <CardDescription>Sign in to your Revelio account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {TURNSTILE_SITE_KEY ? (
              <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} onError={() => setTurnstileToken(null)} options={{ size: "normal" }} />
            ) : (
              <p className="text-sm text-destructive">Bot verification isn’t configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and rebuild.</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !turnstileToken}>
              {loading ? "Signing in..." : "Log In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-foreground underline">Sign up</Link>
          </div>
          <div className="mt-2 text-center text-sm">
            <Link href="/reset" className="text-muted-foreground hover:text-foreground">Forgot your password?</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}