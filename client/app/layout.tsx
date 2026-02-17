import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import LayoutClient from "./LayoutClient";

export const metadata: Metadata = {
  title: "syscodes Tools",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE;

  return (
    <html lang="en">
      <body>
        <LayoutClient authMode={authMode}>{children}</LayoutClient>
        <Toaster />
      </body>
    </html>
  );
}
