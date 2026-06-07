import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold tracking-tight mb-6">
        Revelio
      </h1>
      <p className="text-xl text-muted-foreground mb-4">
        Send secrets that <span className="text-destructive font-semibold">self-destruct</span> after one read.
      </p>
      <p className="text-muted-foreground mb-12">
        End-to-end encrypted notes. No accounts. No logs.
        Your message exists once, then vanishes forever.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/send"
          className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90"
        >
          Send a Note
        </Link>
        <Link
          href="/receive"
          className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
        >
          Retrieve a Note
        </Link>
      </div>
      <div className="mt-20 grid grid-cols-3 gap-8 border-t pt-10">
        <div>
          <div className="text-3xl font-bold">256</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Bit Encryption</div>
        </div>
        <div>
          <div className="text-3xl font-bold">0</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Data Stored</div>
        </div>
        <div>
          <div className="text-3xl font-bold">1</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Time Read Only</div>
        </div>
      </div>
    </div>
  );
}