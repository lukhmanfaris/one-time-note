import type { Metadata } from "next";
import { Urbanist, Open_Sans } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-provider";
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
          
          <AuthProvider>
            <Navbar />
            
            <main className="relative z-10">
              {children}
            </main>
          </AuthProvider>
        </div>


      </body>
    </html>
  );
}
