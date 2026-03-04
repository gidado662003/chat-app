"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

function DocumentsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      router.replace(`/documents/${user.department}`);
    }
  }, [user]);
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-sm text-zinc-500">Loading...</p>
    </div>
  );
}

export default DocumentsPage;
