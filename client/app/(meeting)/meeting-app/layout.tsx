"use client";
import React from "react";
import MeetingAppSidebar from "@/components/meeting-app/meeting-app-sidebar";
import Link from "next/link";

function MeetingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <MeetingAppSidebar />

        {/* Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Link href="/meeting-app" className="text-sm font-semibold">
                Meeting App
              </Link>

              <span className="text-xs text-muted-foreground">/</span>

              <span className="text-xs text-muted-foreground">
                Manage Meetings
              </span>
            </div>

            {/* Right Side Content (Future actions / user profile / etc) */}
            <div className="text-xs text-muted-foreground" />
          </header>

          {/* Page Content */}
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default MeetingLayout;
