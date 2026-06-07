"use client";

import { Badge } from "@/components/ui/badge";

interface KeyDisplayProps {
  accessKey: string;
  expiresLabel: string;
}

export function KeyDisplay({ accessKey, expiresLabel }: KeyDisplayProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(accessKey);
  };

  return (
    <div className="space-y-3">
      <div className="border rounded-lg p-6 text-center space-y-3">
        <Badge variant="secondary">ACCESS KEY — SHARE WITH RECIPIENT</Badge>
        <div className="font-mono text-4xl font-bold tracking-widest break-all select-all">
          {accessKey}
        </div>
        <button
          onClick={copyToClipboard}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Copy to clipboard
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        EXPIRES IN {expiresLabel} · ONE-TIME READ
      </p>
    </div>
  );
}