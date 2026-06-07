"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { NoteReveal } from "@/components/note-reveal";
import { decryptNote } from "@/lib/crypto";
import { retrieveNote } from "@/lib/api";

export default function ReceivePage() {
  const [key, setKey] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "not_found">("idle");

  const handleDecrypt = async () => {
    if (!key.trim()) {
      setError("Enter an access key.");
      return;
    }

    setError(null);
    setPlaintext(null);
    setStatus("loading");

    try {
      const encrypted = await retrieveNote(key.trim());

      if (!encrypted) {
        setStatus("not_found");
        return;
      }

      const decrypted = await decryptNote(encrypted, key.trim());
      setPlaintext(decrypted);
      setStatus("success");
    } catch (err) {
      if (err instanceof Error && err.message.includes("decrypt")) {
        setError("Decryption failed. The key may be incorrect or the data was tampered with.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
      setStatus("idle");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold mb-2">Retrieve a Secret Note</h1>
      <p className="text-muted-foreground mb-8">
        Enter the access key. Note decrypts once, then self-destructs.
      </p>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Enter the access key you received"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={status === "loading"}
          />

          <Button onClick={handleDecrypt} disabled={status === "loading" || !key.trim()} className="w-full">
            {status === "loading" ? "Decrypting..." : "DECRYPT & RETRIEVE"}
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