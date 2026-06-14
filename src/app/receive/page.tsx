"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { NoteReveal } from "@/components/note-reveal";
import { decryptNote, deriveLookupId, parseShareUrl } from "@/lib/crypto";
import { retrieveNote } from "@/lib/api";

export default function ReceivePage() {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "not_found">("idle");
  const [manualKey, setManualKey] = useState("");
  const [autoAttempted, setAutoAttempted] = useState(false);

  useEffect(() => {
    const parsed = parseShareUrl();
    if (parsed && !autoAttempted) {
      setAutoAttempted(true);
      handleDecrypt(parsed.lookupId, parsed.encryptionKey);
    }
  }, []);

  const handleDecrypt = async (lookupId: string, encryptionKey: string) => {
    setError(null);
    setPlaintext(null);
    setStatus("loading");

    try {
      const encrypted = await retrieveNote(lookupId);

      if (!encrypted) {
        setStatus("not_found");
        return;
      }

      const decrypted = await decryptNote(encrypted, encryptionKey);
      setPlaintext(decrypted);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.includes("Unable to reach") || msg.includes("Failed to fetch") || msg.includes("Load failed") || msg.includes("NetworkError")) {
        setError("Unable to connect. Check your internet connection and try again.");
      } else if (msg.includes("decrypt") || msg.includes("AES-GCM") || msg.includes("CryptoKey") || msg.includes("PBKDF2")) {
        setError("Decryption failed. The link may be invalid or the note was tampered with.");
      } else {
        setError(msg);
      }
      setStatus("idle");
    }
  };

  const handleManualDecrypt = async () => {
    if (!manualKey.trim()) {
      setError("Enter the encryption key from the share link.");
      return;
    }

    try {
      const encryptionKey = manualKey.trim();
      const lookupId = await deriveLookupId(encryptionKey);
      await handleDecrypt(lookupId, encryptionKey);
    } catch {
      setError("Invalid encryption key format.");
      setStatus("idle");
    }
  };

  const derivedStatusText = status === "loading"
    ? "Decrypting..."
    : "DECRYPT & RETRIEVE";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold mb-2">Retrieve a Secret Note</h1>
      <p className="text-muted-foreground mb-8">
        Open the share link to auto-decrypt, or paste the encryption key manually.
      </p>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Paste the encryption key from the share link"
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value)}
            disabled={status === "loading"}
          />

          <Button onClick={handleManualDecrypt} disabled={status === "loading" || !manualKey.trim()} className="w-full">
            {derivedStatusText}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {status === "not_found" && (
            <p className="text-sm text-destructive">
              [NOT FOUND] Invalid key or the note has already been read.
            </p>
          )}
        </CardContent>
      </Card>

      {plaintext && <NoteReveal plaintext={plaintext} />}
    </div>
  );
}