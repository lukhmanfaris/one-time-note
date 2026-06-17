import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-navbar pb-12 text-center">
      <div className="font-ui text-6xl font-bold text-muted-foreground/20 mb-4">404</div>
      <h1 className="font-ui text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button render={<Link href="/" />}>
        Back to Home
      </Button>
    </div>
  );
}
