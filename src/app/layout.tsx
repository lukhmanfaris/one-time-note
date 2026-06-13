import type { Metadata } from "next";
import { Urbanist, Open_Sans } from "next/font/google";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "One Time Note — Secret & Private",
  description: "Send secrets that vanish after one read. End-to-end encrypted, no login required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${urbanist.variable} ${openSans.variable} font-sans antialiased`}>
        <div className="min-h-screen relative">
          {/* Background */}
          <div className="absolute inset-0 grid-pattern" />
          <div 
            className="ambient-orb" 
            style={{ 
              width: "500px", 
              height: "500px", 
              background: "rgba(0,0,0,0.02)", 
              top: "-100px", 
              right: "-100px" 
            }} 
          />
          
          <Navbar />
          
          <main className="relative z-10">
            {children}
          </main>
        </div>

        {/* Bottom Specs Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 border-t border-black/5 bg-white/80 backdrop-blur-xl">
          <div className="max-w-content mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs font-mono tracking-wider text-black/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#fafaf9', border: '1px solid rgba(0,0,0,0.1)' }} />
                <span>#FAFAF9</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-black" />
                <span>#000000</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-ui font-semibold text-black/60">Urbanist</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-black/60">Open Sans</span>
              </div>
            </div>
            <div className="text-xs font-mono tracking-wider text-black/20 uppercase">
              Landing Page + Interactive Demo
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
