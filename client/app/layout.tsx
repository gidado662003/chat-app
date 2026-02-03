import "./globals.css";
import TokenHandler from "../components/TokenHandler";
import { Toaster } from "@/components/ui/sonner"
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
