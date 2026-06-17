"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface KeyDisplayProps {
  shareUrl: string;
  expiresLabel: string;
}

export function KeyDisplay({ shareUrl, expiresLabel }: KeyDisplayProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="space-y-3 mt-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="border border-border rounded-xl p-6 text-center space-y-3">
        <Badge variant="secondary">SHARE LINK — SEND TO RECIPIENT</Badge>
        <div className="font-mono text-sm break-all select-all rounded-lg bg-muted p-3 text-left">
          {shareUrl}
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={copyToClipboard}
          className="text-muted-foreground hover:text-foreground"
        >
          Copy to clipboard
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center font-mono tracking-wider">
        EXPIRES IN {expiresLabel} · ONE-TIME READ · KEEP THIS LINK PRIVATE
      </p>
    </div>
  );
}
