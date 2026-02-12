import "./globals.css";
import type { Metadata } from "next";
import TokenHandler from "../components/TokenHandler";
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "syscodes Tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TokenHandler />

        {children}
        <Toaster />
      </body>
    </html>
  );
}
