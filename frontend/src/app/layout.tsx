import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { UserMenu } from "@/components/user-menu";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Revelio — Self-Destructing Encrypted Notes",
  description: "Send secrets that self-destruct after one read. End-to-end encrypted, no login required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b">
              <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                <a href="/" className="text-xl font-bold tracking-tight">
                  Revelio
                </a>
                <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                  <a href="/send" className="hover:text-foreground">Send</a>
                  <a href="/receive" className="hover:text-foreground">Retrieve</a>
                  <UserMenu />
                </nav>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t">
              <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
                ENCRYPTED · EPHEMERAL · GONE
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}