import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import AuthProvider from "@/components/providers/AuthProvider";
import { ConnectivityProvider } from "@/components/providers/ConnectivityProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "../globals.css";

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  display: "swap",
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
      <html
        lang={locale}
        className={`${arimo.variable} h-full antialiased`}
      >
      <body className="min-h-full bg-background text-foreground font-sans antialiased selection:bg-white selection:text-black">
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <ConnectivityProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </ConnectivityProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
