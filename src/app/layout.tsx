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
import { AppViewportHeight, appViewportBootstrapScript } from "@/components/shared/app-viewport-height";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: appViewportBootstrapScript }} />
      </head>
      <body className="flex h-full min-h-0 flex-col overflow-hidden text-foreground">
        <Providers initialLocale={initialLocale}>
          <AppViewportHeight />
          <BlockOne />
          <ServiceWorkerRegister />
          <OfflineBanner />
          <UpdateToast />
          <InstallPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}
