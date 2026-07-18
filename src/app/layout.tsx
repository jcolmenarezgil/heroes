import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Configuración de tipografías optimizadas para lectura fluida en múltiples pantallas
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

// Metadatos globales alineados al propósito crítico de la plataforma en situaciones de emergencia
export const metadata: Metadata = {
  title: "Heroes - Crisis Response & Missing Persons Locator",
  description:
    "A resilient and optimized platform designed for crisis situations to facilitate the locating of unaccounted individuals, maximizing local persistence, battery efficiency, and secure coordination between families and rescuers.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

/**
 * RootLayout actua estrictamente como el contenedor global de metadatos y configuración del entorno.
 * No incluye Navbar o Sidebar para evitar mutaciones de layouts entre los sub-contextos de la app.
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
        {children}
      </body>
    </html>
  );
}