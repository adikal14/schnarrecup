import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The Cup | Tournament HQ",
  description: "Draft, score, and track the annual cup.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-parchment-100 text-ink`}
      >
        <div className="min-h-screen">
          <header className="border-b-2 border-turf-900/15">
            <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
              <a href="/" className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-700 tracking-tight text-turf-950">
                  The Cup
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-turf-500">
                  Tournament HQ
                </span>
              </a>
              <nav className="font-mono text-xs uppercase tracking-widest text-turf-700 flex gap-6">
                <a href="/admin/players" className="hover:text-flag transition-colors">
                  Players
                </a>
                <a href="/admin/tournaments" className="hover:text-flag transition-colors">
                  Tournaments
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
