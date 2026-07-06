import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/context/LocaleContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PixelHub - WebGL & HTML5 Games Platform",
  description: "Play high-performance browser games natively in WebGL and HTML5. Upload, play, share, and achieve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen relative bg-background text-gray-100 antialiased selection:bg-primary selection:text-background">
        <LocaleProvider>
          <AuthProvider>
            {/* Cyberpunk Glowing Orbs Background */}
            <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pulse-glow-blue" />
              <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[150px]" />
              <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] rounded-full bg-secondary/5 blur-[100px]" />
              <div className="absolute inset-0 cyber-grid-overlay opacity-30" />
            </div>

            {/* Main App Layout */}
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow container mx-auto px-4 md:px-8 py-6 z-10">
                {children}
              </main>
              
              {/* Platform Footer */}
              <footer className="border-t border-white/5 bg-black/40 py-8 text-center text-sm text-mutedText z-10">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        PixelHub
                      </span>
                      <span className="text-xs text-mutedText">© 2026</span>
                    </div>
                    <div className="flex gap-6 text-xs">
                      <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                      <a href="#" className="hover:text-primary transition-colors">Developer Agreement</a>
                      <a href="#" className="hover:text-primary transition-colors">API Docs</a>
                      <a href="#" className="hover:text-primary transition-colors">Support FAQ</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
