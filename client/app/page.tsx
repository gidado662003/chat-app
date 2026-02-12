"use client"
import React from 'react'
import Link from 'next/link'
import { MessageSquare, FileText, User, Calendar } from 'lucide-react'
import { useModuleStore } from "../lib/moduleStore"

function HomePage() {
    const apps = [
        {
            name: "Chat App",
            icon: <MessageSquare className="w-6 h-full" />,
            href: "/chat/chats",
            module: "chat",
            gradient: "from-blue-500 to-blue-600",
            shadow: "shadow-blue-500/20",
            hoverShadow: "hover:shadow-blue-500/40"
        },
        {
            name: "Internal Requisitions",
            icon: <FileText className="w-6 h-full" />,
            href: "/internal-requisitions/",
            module: "request",
            gradient: "from-emerald-500 to-emerald-600",
            shadow: "shadow-emerald-500/20",
            hoverShadow: "hover:shadow-emerald-500/40"
        },
        {
            name: "Meeting App",
            icon: <Calendar className="w-6 h-full" />,
            href: "/meeting-app/",
            module: "meeting",
            gradient: "from-amber-500 to-amber-600",
            shadow: "shadow-amber-500/20",
            hoverShadow: "hover:shadow-amber-500/40"
        },
        {
            name: "Admin Dashboard",
            icon: <User className="w-6 h-full" />,
            href: "/admin",
            module: "admin",
            gradient: "from-rose-500 to-rose-600",
            shadow: "shadow-rose-500/20",
            hoverShadow: "hover:shadow-rose-500/40"
        }
    ]

    const setModule = useModuleStore((state) => state.setModule);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="w-full max-w-6xl">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-block mb-4">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                            <h1 className="text-5xl font-bold mb-2">
                                Syscodes Tools
                            </h1>
                        </div>
                    </div>
                    <p className="text-slate-600 text-lg">
                        Choose your workspace to begin
                    </p>
                </div>

                {/* Apps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {apps.map((app) => (
                        <Link
                            key={app.name}
                            href={app.href}
                            onClick={() => setModule(app.module)}
                            className="group block"
                        >
                            <div className={`
                                relative overflow-hidden
                                bg-white rounded-2xl
                                border border-slate-200
                                p-8
                                transition-all duration-300 ease-out
                                hover:scale-105 hover:-translate-y-2
                                shadow-lg ${app.shadow}
                                ${app.hoverShadow}
                                hover:border-transparent
                            `}>
                                {/* Gradient Background Overlay */}
                                <div className={`
                                    absolute inset-0 bg-gradient-to-br ${app.gradient}
                                    opacity-0 group-hover:opacity-10
                                    transition-opacity duration-300
                                `} />
                                
                                {/* Content */}
                                <div className="relative flex flex-col items-center text-center gap-4">
                                    {/* Icon Container */}
                                    <div className={`
                                        p-4 rounded-xl
                                        bg-gradient-to-br ${app.gradient}
                                        text-white
                                        shadow-lg ${app.shadow}
                                        transform transition-transform duration-300
                                        group-hover:scale-110 group-hover:rotate-3
                                    `}>
                                        {app.icon}
                                    </div>
                                    
                                    {/* App Name */}
                                    <span className="font-semibold text-slate-800 text-lg leading-tight">
                                        {app.name}
                                    </span>
                                </div>

                                {/* Shine Effect */}
                                <div className="
                                    absolute inset-0
                                    bg-gradient-to-r from-transparent via-white to-transparent
                                    opacity-0 group-hover:opacity-20
                                    transform -translate-x-full group-hover:translate-x-full
                                    transition-all duration-700
                                " />
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </div>
    )
}

export default HomePage