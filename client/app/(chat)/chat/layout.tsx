"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { useAuthStore } from "@/lib/store";
import SocketInitializer from "@/components/SocketInitializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isLandingPage = pathname === "/";
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    // Redirect to landing if not authenticated (user must open app via Laravel ERP link with token)
    if (!isLoading && !isAuthenticated && !isLandingPage && !isAdminRoute) {
      // router.push("/");
    }
  }, [isAuthenticated, isLoading, pathname, router, isAdminRoute]);

  // Show loading while checking auth
  if (isLoading && pathname !== "/" && !isAdminRoute) {
    return (
      <html lang="en">
        <body>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Loading...</div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <>
      {!isAdminRoute && <SocketInitializer />}
      {isAdminRoute ? (
        <div className="h-full">{children}</div>
      ) : isLandingPage ? (
        <div className="h-full">{children}</div>
      ) : (
        // App pages with permanent sidebar
        <div className="flex h-screen">
          <AppSidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">{children}</div>
          </main>
        </div>
      )}
    </>
  );
}
