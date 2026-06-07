"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { KeyDisplay } from "@/components/key-display";
import { encryptNote, generateAccessKey } from "@/lib/crypto";
import { createNote } from "@/lib/api";

const TTL_OPTIONS: Record<string, number> = {
  "1 hour": 3600,
  "24 hours": 86400,
  "7 days": 604800,
};

export default function SendPage() {
  const [note, setNote] = useState("");
  const [ttl, setTtl] = useState<string>("1 hour");
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [expiresLabel, setExpiresLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEncrypt = async () => {
    if (!note.trim()) {
      setError("Enter a note before encrypting.");
      return;
    }

    setError(null);
    setLoading(true);
    setAccessKey(null);

    try {
      const key = generateAccessKey();
      const encrypted = await encryptNote(note.trim(), key);
      await createNote(encrypted, TTL_OPTIONS[ttl], key);
      setAccessKey(key);
      setExpiresLabel(ttl.toUpperCase());
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Encryption failed. Try again.");
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
        Write a message. Select expiry. Get a unique access key to share.
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

          <Button onClick={handleEncrypt} disabled={loading || !note.trim()} className="w-full">
            {loading ? "Encrypting..." : "GENERATE KEY & ENCRYPT"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {accessKey && <KeyDisplay accessKey={accessKey} expiresLabel={expiresLabel} />}
    </div>
  );
}