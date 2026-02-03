"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquareText, Plus, ArrowLeftRight } from "lucide-react";

function NavItem({
    href,
    label,
    icon,
}: {
    href: string;
    label: string;
    icon: React.ReactNode;
}) {
    const pathname = usePathname();
    const active = pathname === href || (href !== "/internal-requisitions" && pathname?.startsWith(href));

    return (
        <Link
            href={href}
            className={[
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-accent text-blue-500 font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            ].join(" ")}
        >
            <span className="shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
        </Link>
    );
}

export default function InternalRequisitionSidebar() {
    return (
        /* Added flex and h-screen to ensure the sidebar fills the height and allows mt-auto to work */
        <div className="hidden w-64 shrink-0 border-r bg-card md:flex flex-col h-screen sticky top-0">
            <div className="flex h-16 items-center px-4 border-b">
                <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500 text-primary-foreground font-bold">
                        IR
                    </div>
                    <div className="leading-tight">
                        <div className="text-sm font-semibold">Internal Requisitions</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Management</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                <NavItem href="/internal-requisitions" label="Dashboard" icon={<LayoutDashboard size={18} />} />
                <NavItem href="/internal-requisitions/requisition-list" label="Requisitions" icon={<Users size={18} />} />
                <NavItem href="/internal-requisitions/departments" label="Departments" icon={<MessageSquareText size={18} />} />
                <NavItem href="/internal-requisitions/create-request" label="Create Request" icon={<Plus size={18} />} />
            </nav>

            {/* Footer fixed: mt-auto pushes it to the bottom, border-t provides separation */}
            <footer className="mt-auto border-t p-4">
                <Link href="/">
                    <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                        <ArrowLeftRight size={18} className="text-blue-500" />
                        <span>Switch Module</span></button>
                </Link>
            </footer>
        </div >
    );
}