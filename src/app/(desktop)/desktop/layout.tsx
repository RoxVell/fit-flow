import type { Metadata } from "next";
import { DesktopShell } from "@/components/desktop/shell/desktop-shell";

export const metadata: Metadata = {
  title: "FitFlow — Workspace",
};

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DesktopShell>{children}</DesktopShell>;
}
