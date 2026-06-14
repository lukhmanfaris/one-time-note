"use client";

import { Badge } from "@/components/ui/badge";

interface KeyDisplayProps {
  shareUrl: string;
  expiresLabel: string;
}

export function KeyDisplay({ shareUrl, expiresLabel }: KeyDisplayProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="space-y-3 opacity-0 animate-scale-in mt-6">
      <div className="border rounded-lg p-6 text-center space-y-3">
        <Badge variant="secondary">SHARE LINK — SEND TO RECIPIENT</Badge>
        <div className="font-mono text-sm break-all select-all rounded bg-muted p-3 text-left">
          {shareUrl}
        </div>
        <button
          onClick={copyToClipboard}
          className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Copy to clipboard
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        EXPIRES IN {expiresLabel} · ONE-TIME READ · KEEP THIS LINK PRIVATE
      </p>
    </div>
  );
}