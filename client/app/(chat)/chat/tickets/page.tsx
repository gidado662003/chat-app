"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { listTickets } from "@/app/api";

type Ticket = {
  _id: string;
  ticketId: string;
  title?: string;
  clientName?: string;
  faultType?: string;
  status?: string;
  updatedAt?: string;
};

export default function TicketsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pages, setPages] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, any> = { page, limit: 20 };
    if (q.trim()) p.q = q.trim();
    if (status) p.status = status;
    return p;
  }, [page, q, status]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await listTickets(params);
        if (cancelled) return;
        const data = res?.data;
        setTickets(data?.tickets || []);
        setPages(data?.pagination?.pages || 1);
      } catch (e: any) {
        if (cancelled) return;
        setError("Failed to load tickets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="h-full bg-white">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <SidebarTrigger className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tickets</h1>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search ticketId, title, client, fault type..."
            className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Loading tickets...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-600">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No tickets found.
          </div>
        ) : (
          <div className="grid gap-3">
            {tickets.map((t) => (
              <Link
                key={t._id}
                href={`/chat/tickets/${encodeURIComponent(t.ticketId)}`}
                className="block border rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-blue-600">
                      {t.ticketId}
                    </div>
                    <div className="font-semibold text-gray-900 truncate">
                      {t.title || "Untitled ticket"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {(t.clientName && `Client: ${t.clientName}`) || ""}
                      {t.clientName && t.faultType ? " • " : ""}
                      {(t.faultType && `Fault: ${t.faultType}`) || ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-semibold text-gray-700">
                      {t.status || "Open"}
                    </div>
                    {t.updatedAt && (
                      <div className="text-[11px] text-gray-400">
                        {new Date(t.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div className="text-xs text-gray-500">
            Page {page} of {pages}
          </div>
          <button
            className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
