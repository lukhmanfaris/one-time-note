"use client";

interface NoteRevealProps {
  plaintext: string;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

export function NoteReveal({ plaintext }: NoteRevealProps) {
  return (
    <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="border-l-2 border-destructive rounded-r-lg p-6 space-y-3">
        <div className="text-xs uppercase tracking-wider text-destructive font-mono">
          Decrypted Message — One-Time View
        </div>
        <div
          className="whitespace-pre-wrap break-words text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: escapeHtml(plaintext) }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        THIS NOTE HAS BEEN PERMANENTLY DELETED FROM THE SERVER
      </p>
    </div>
  );
}