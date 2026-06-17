import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { headers } from "next/headers";
import {
  localeBootstrapScript,
  LOCALE_COOKIE,
  getServerLocale,
} from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/exercises/types";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { UpdateToast } from "@/components/shared/update-toast";
import { ViewportDebug } from "@/components/shared/viewport-debug";
import "./globals.css";
import BlockOne from "@/components/ui/block-one";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitFlow",
  description: "Your intelligent workout companion",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FitFlow" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const initialLocale: Locale = getServerLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get("accept-language")
  );

  return (
    <html
      lang={initialLocale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBootstrapScript }} />
      </head>
      <body className="flex min-h-dvh flex-col text-foreground">
        <Providers initialLocale={initialLocale}>
          <BlockOne />
          <ServiceWorkerRegister />
          <OfflineBanner />
          <UpdateToast />
          <InstallPrompt />
          <ViewportDebug />
          {children}
        </Providers>
      </body>
    </html>
  );
}
