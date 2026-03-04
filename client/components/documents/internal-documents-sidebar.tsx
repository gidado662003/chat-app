"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  ArrowLeftRight,
} from "lucide-react";

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
  const active =
    pathname === href || (href !== "/documents" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-accent text-blue-500 font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      ].join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function DocumentsSidebar() {
  return (
    <div className="hidden w-64 shrink-0 border-r bg-card md:flex flex-col h-screen sticky top-0">
      <div className="flex h-16 items-center px-4 border-b">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500 text-primary-foreground font-bold">
            DL
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Document Library</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Management
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavItem
          href="/documents"
          label="Documents"
          icon={<LayoutDashboard size={18} />}
        />
      </nav>

      <footer className="mt-auto border-t p-4">
        <Link href="/">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <ArrowLeftRight size={18} className="text-blue-500" />
            <span>Switch Module</span>
          </button>
        </Link>
      </footer>
    </div>
  );
}
