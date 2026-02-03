"use client"
import InternalRequisitionSidebar from "@/components/internal-requsitions/internal-requsition-sidebar";
import Link from "next/link";


export default function AdminLayout({ children }: { children: React.ReactNode }) {


    return (

        <div className="min-h-screen bg-background">
            <div className="flex min-h-screen">
                <InternalRequisitionSidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* top bar */}
                    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
                        <div className="flex items-center gap-2">
                            <Link href="/internal-requisitions" className="text-sm font-semibold">
                                Internal Requisitions
                            </Link>
                            <span className="text-xs text-muted-foreground">/</span>
                            <span className="text-xs text-muted-foreground">Manage requisitions</span>
                        </div>
                        <div className="text-xs text-muted-foreground"></div>
                    </header>
                    <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
