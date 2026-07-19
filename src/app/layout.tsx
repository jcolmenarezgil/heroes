import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Heroes - Crisis Response & Missing Persons Locator",
  description:
    "A resilient and optimized platform designed for crisis situations to facilitate the locating of unaccounted individuals, maximizing local persistence, battery efficiency, and secure coordination between families and rescuers.",
};

/**
 * RootLayout acts strictly as the global container for metadata and environment configuration.
 * It excludes Navbar or Sidebar to prevent layout mutations between app sub-contexts.
 */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}