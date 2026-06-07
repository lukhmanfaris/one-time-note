import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-8">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
      >
        Go Home
      </Link>
    </div>
  );
}