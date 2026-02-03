"use client"
import React from 'react'
import Link from 'next/link'
import { MessageSquare, FileText, User } from 'lucide-react'
import { useModuleStore } from "../lib/moduleStore"

function HomePage() {
    const apps = [
        {
            name: "Chat",
            icon: <MessageSquare className="w-6 h-6" />,
            href: "/chat/chats",
            module: "chat",
            color: "bg-blue-100 border-blue-300 text-blue-800"
        },
        {
            name: "Internal Requisitions",
            icon: <FileText className="w-6 h-6" />,
            href: "/internal-requisitions/",
            module: "request",
            color: "bg-green-100 border-green-300 text-green-800"
        },
        {
            name: "Admin Dashboard",
            icon: <User className="w-6 h-6" />,
            href: "/admin",
            module: "admin",
            color: "bg-red-100 border-red-300 text-red-800"
        }
    ]

    const setModule = useModuleStore((state) => state.setModule);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">
                        Syscodes Tools
                    </h1>
                    <p className="text-gray-500">
                        Select an application to get started
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {apps.map((app) => (
                        <Link
                            key={app.name}
                            href={app.href}
                            className="block"
                            onClick={() => setModule(app.module)}
                        >
                            <div className={`${app.color} border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full`}>
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="p-3 bg-white rounded-lg shadow-sm">
                                        {app.icon}
                                    </div>
                                    <span className="font-semibold text-lg">
                                        {app.name}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>


            </div>
        </div>
    )
}

export default HomePage