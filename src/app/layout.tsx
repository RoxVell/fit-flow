import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { localeBootstrapScript } from "@/lib/i18n/locale-cookie";
import { appHeightBootstrapScript } from "@/lib/pwa/app-height";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { UpdateToast } from "@/components/shared/update-toast";
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

// Pages are prerendered as static HTML in the default locale. The bootstrap
// script below sets `lang` before the first paint; translated strings switch
// in LocaleProvider right after hydration.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: appHeightBootstrapScript }} />
      </head>
      <body className="flex min-h-dvh flex-col text-foreground">
        <Providers>
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
