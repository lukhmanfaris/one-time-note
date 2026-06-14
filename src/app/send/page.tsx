"use client";

import { useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { KeyDisplay } from "@/components/key-display";
import { encryptNote, generateEncryptionKey, deriveLookupId, buildShareUrl } from "@/lib/crypto";
import { createNote } from "@/lib/api";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const TTL_OPTIONS: Record<string, number> = {
  "1 hour": 3600,
  "24 hours": 86400,
  "7 days": 604800,
};

export default function SendPage() {
  const [note, setNote] = useState("");
  const [ttl, setTtl] = useState<string>("1 hour");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresLabel, setExpiresLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleEncrypt = async () => {
    if (!note.trim()) {
      setError("Enter a note before encrypting.");
      return;
    }

    if (!turnstileToken) {
      setError("Bot verification incomplete. Please wait.");
      return;
    }

    setError(null);
    setLoading(true);
    setShareUrl(null);

    try {
      const encryptionKey = generateEncryptionKey();
      const lookupId = await deriveLookupId(encryptionKey);
      const encrypted = await encryptNote(note.trim(), encryptionKey);
      await createNote(encrypted, TTL_OPTIONS[ttl], lookupId, turnstileToken);
      const url = buildShareUrl(lookupId, encryptionKey);
      setShareUrl(url);
      setExpiresLabel(ttl.toUpperCase());
      setNote("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Encryption failed. Try again.";
      if (msg.includes("Unable to reach") || msg.includes("Failed to fetch") || msg.includes("Load failed")) {
        setError("Unable to connect. Check your internet connection and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold mb-2">Send a Secret Note</h1>
      <p className="text-muted-foreground mb-8">
        Write a message. Select expiry. Get a unique link to share.
      </p>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Textarea
            placeholder="Type your secret note here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            disabled={loading}
          />

          <div className="flex items-center gap-4">
            <label htmlFor="ttl" className="text-sm font-medium">
              EXPIRES AFTER
            </label>
            <select
              id="ttl"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-background"
              disabled={loading}
            >
              {Object.keys(TTL_OPTIONS).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {TURNSTILE_SITE_KEY && (
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              options={{ size: "normal" }}
            />
          )}

          <Button onClick={handleEncrypt} disabled={loading || !note.trim() || !turnstileToken} className="w-full">
            {loading ? "Encrypting..." : "GENERATE LINK & ENCRYPT"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {shareUrl && <KeyDisplay shareUrl={shareUrl} expiresLabel={expiresLabel} />}
    </div>
  );
}