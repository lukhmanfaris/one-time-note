"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const turnstileRef = useRef<TurnstileInstance>(null);

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
      console.error("createNote failed:", err);
      const msg = err instanceof Error ? err.message : "Encryption failed. Try again.";
      if (msg.includes("Unable to reach") || msg.includes("Failed to fetch") || msg.includes("Load failed")) {
        setError("Unable to connect. Check your internet connection and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-navbar pb-12">
      <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground mb-8 inline-block transition-smooth">
        &larr; Back
      </Link>

      <h1 className="font-ui text-2xl font-bold mb-2">Send a Secret Note</h1>
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
            <label htmlFor="ttl-trigger" className="text-sm font-mono font-medium tracking-wider uppercase shrink-0">
              Expires After
            </label>
            <Select value={ttl} onValueChange={setTtl} disabled={loading}>
              <SelectTrigger id="ttl-trigger" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(TTL_OPTIONS).map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {TURNSTILE_SITE_KEY ? (
            <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} onError={() => setTurnstileToken(null)} options={{ size: "normal" }} />
          ) : (
            <p className="text-sm text-destructive">Bot verification isn&apos;t configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and rebuild.</p>
          )}

          <Button onClick={handleEncrypt} disabled={loading || !note.trim() || !turnstileToken} className="w-full font-mono tracking-wider uppercase">
            {loading ? "Encrypting..." : "Generate Link & Encrypt"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {shareUrl && <KeyDisplay shareUrl={shareUrl} expiresLabel={expiresLabel} />}
    </div>
  );
}
