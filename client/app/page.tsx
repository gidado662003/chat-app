"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  User,
  Calendar,
  Moon,
  Sun,
  ShoppingCart,
  ChevronRight,
  Bell,
  Search,
  Grid3X3,
} from "lucide-react";
import { useModuleStore } from "../lib/moduleStore";
import { useDisplayMode } from "@/lib/store";

/* ---------------- Apps Config ---------------- */

const apps = [
  {
    name: "Chat App",
    description: "Realtime team communication across departments",
    icon: MessageSquare,
    href: "/chat/chats",
    module: "chat",
    accent: "#3B82F6",
    accentLight: "#DBEAFE",
    accentDark: "#1e3a5f",
    tag: "Communication",
    featured: true,
  },
  {
    name: "Internal Requisitions",
    description: "Submit and track internal resource requests",
    icon: FileText,
    href: "/internal-requisitions/",
    module: "request",
    accent: "#10B981",
    accentLight: "#D1FAE5",
    accentDark: "#064e3b",
    tag: "Operations",
    featured: true,
  },
  {
    name: "Inventory System",
    description: "Monitor assets, stock levels, and supply chains",
    icon: ShoppingCart,
    href: "/inventory/",
    module: "inventory",
    accent: "#8B5CF6",
    accentLight: "#EDE9FE",
    accentDark: "#3b0764",
    tag: "Logistics",
    featured: false,
  },
  {
    name: "Meeting App",
    description: "Manage team meetings",
    icon: Calendar,
    href: "/meeting-app/",
    module: "meeting",
    accent: "#F59E0B",
    accentLight: "#FEF3C7",
    accentDark: "#451a03",
    tag: "Meeting",
    featured: false,
  },
  {
    name: "Admin Dashboard",
    description: "Manage users, roles, and chat configuration",
    icon: User,
    href: "/admin",
    module: "admin",
    accent: "#EF4444",
    accentLight: "#FEE2E2",
    accentDark: "#450a0a",
    tag: "Administration",
    featured: false,
  },
];

function HomePage() {
  const toggleMode = useDisplayMode((state) => state.toggleMode);
  const mode = useDisplayMode((state) => state.mode);
  const setModule = useModuleStore((state) => state.setModule);

  const isDark = mode === "dark";
  const featured = apps.filter((a) => a.featured);
  const rest = apps.filter((a) => !a.featured);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#080D18]" : "bg-[#F1F5F9]"
      }`}
    >
      {/* ─── Nav ─── */}
      <nav
        className={`sticky top-0 z-50 flex h-[54px] items-center justify-between border-b px-7`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#6366F1]">
            <Grid3X3 size={14} color="white" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-[#F8FAFC]">
            Syscodes Tools
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/7 bg-white/5 text-[#64748B] transition-all hover:bg-white/10 hover:text-[#F1F5F9]"
            aria-label="Toggle theme"
            onClick={toggleMode}
          >
            {mode === "light" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <div className="ml-1 flex h-[30px] w-[30px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-white/12 bg-gradient-to-br from-[#3B82F6] to-[#6366F1] text-[11px] font-semibold text-white">
            SC
          </div>
        </div>
      </nav>

      {/* ─── Content ─── */}
      <main className="mx-auto max-w-[1280px] px-7 pb-16 pt-9">
        <div className="mb-3.5 flex animate-[fadeUp_0.42s_ease_forwards] items-center gap-2 opacity-0 [animation-delay:80ms]">
          <span
            className={`text-[10.5px] font-semibold uppercase tracking-[0.1em] ${
              isDark ? "text-[#3D4F6B]" : "text-[#94A3B8]"
            }`}
          >
            Featured
          </span>
          <div
            className={`h-px flex-1 ${
              isDark ? "bg-[#141E30]" : "bg-[#E2E8F0]"
            }`}
          />
        </div>

        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {featured.map((app, i) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.name}
                href={app.href}
                onClick={() => setModule(app.module)}
                className={`group relative block cursor-pointer overflow-hidden rounded-[14px] border p-7 text-decoration-none transition-all duration-220 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,${isDark ? "0.5" : "0.15"}),0_0_0_1px_${app.accent}] ${
                  isDark
                    ? "border-[#141E30] bg-[#0F1623]"
                    : "border-[#E2E8F0] bg-white"
                }`}
                style={{
                  animationDelay: `${110 + i * 55}ms`,
                }}
                aria-label={`Open ${app.name}`}
              >
                <div
                  className="absolute left-0 right-0 top-0 h-0.5"
                  style={{ background: app.accent }}
                />
                <span
                  className="mb-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.07em]"
                  style={{
                    background: isDark ? app.accentDark : app.accentLight,
                    color: app.accent,
                  }}
                >
                  {app.tag}
                </span>
                <div
                  className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-220 group-hover:scale-110 group-hover:rotate-4"
                  style={{ background: app.accent }}
                >
                  <Icon size={19} color="white" />
                </div>
                <h2
                  className={`mb-1.5 text-base font-semibold leading-tight ${
                    isDark ? "text-[#F1F5F9]" : "text-[#0F172A]"
                  }`}
                >
                  {app.name}
                </h2>
                <p
                  className={`mb-5 text-[12.5px] leading-relaxed ${
                    isDark ? "text-[#94A3B8]" : "text-[#64748B]"
                  }`}
                >
                  {app.description}
                </p>
                <div
                  className="flex items-center gap-1 text-xs font-semibold transition-all duration-180 group-hover:gap-2"
                  style={{ color: app.accent }}
                >
                  Open module <ChevronRight size={13} />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mb-3.5 mt-7 flex animate-[fadeUp_0.42s_ease_forwards] items-center gap-2 opacity-0 [animation-delay:220ms]">
          <span
            className={`text-[10.5px] font-semibold uppercase tracking-[0.1em] ${
              isDark ? "text-[#3D4F6B]" : "text-[#94A3B8]"
            }`}
          >
            All tools
          </span>
          <div
            className={`h-px flex-1 ${
              isDark ? "bg-[#141E30]" : "bg-[#E2E8F0]"
            }`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((app, i) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.name}
                href={app.href}
                onClick={() => setModule(app.module)}
                className={`group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-[14px] border p-5 text-decoration-none transition-all duration-220 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,${isDark ? "0.4" : "0.1"})] ${
                  isDark
                    ? "border-[#141E30] bg-[#0F1623] hover:border-[${app.accent}]"
                    : "border-[#E2E8F0] bg-white hover:border-[${app.accent}]"
                }`}
                style={{
                  animationDelay: `${260 + i * 55}ms`,
                }}
                aria-label={`Open ${app.name}`}
              >
                <div
                  className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] transition-transform duration-220 group-hover:scale-110 group-hover:rotate-4"
                  style={{ background: app.accent }}
                >
                  <Icon size={17} color="white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className="mb-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: app.accent }}
                  >
                    {app.tag}
                  </span>
                  <p
                    className={`mb-0.5 text-[13.5px] font-semibold ${
                      isDark ? "text-[#F1F5F9]" : "text-[#0F172A]"
                    }`}
                  >
                    {app.name}
                  </p>
                  <p
                    className={`text-[12px] leading-relaxed ${
                      isDark ? "text-[#94A3B8]" : "text-[#64748B]"
                    }`}
                  >
                    {app.description}
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className={`mt-0.5 flex-shrink-0 transition-all duration-180 group-hover:translate-x-[3px] ${
                    isDark
                      ? "text-[#3D4F6B] group-hover:text-[${app.accent}]"
                      : "text-[#94A3B8] group-hover:text-[${app.accent}]"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
