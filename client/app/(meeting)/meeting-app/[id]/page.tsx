"use client";
import React, { useEffect, useState } from "react";
import { mettingAppAPI } from "@/lib/mettingAppApi";
import { useParams } from "next/navigation";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ActionItem {
  _id: string;
  desc: string;
  penalty: string;
  owner: string;
  due: string;
  status: "pending" | "completed" | "overdue";
}

interface Meeting {
  _id: string;
  title: string;
  date: string;
  attendees: string[];
  agenda: string;
  minutes: string;
  department: string;
  actionItems: ActionItem[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

function Page() {
  const { id } = useParams();
  const [data, setData] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleGetDataById = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const res = await mettingAppAPI.getMeetingsById(id);
        setData(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    handleGetDataById();
  }, [id]);

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId);
      return newSet;
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const statusStyles = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    overdue: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const statusIcons = {
    completed: <CheckCircle2 className="w-4 h-4" />,
    pending: <Clock className="w-4 h-4" />,
    overdue: <AlertCircle className="w-4 h-4" />,
  };

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-14 w-14 rounded-full border-b-4 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Failed to load meeting
      </div>
    );
  }

  return (
    <div className="min-h-scree">
      <div className=" mx-auto space-y-8">
        {/* ---------------- Header ---------------- */}

        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="badge bg-blue-100 text-blue-700">
                  {data.department}
                </span>

                <span className="badge bg-slate-100 text-slate-700 capitalize">
                  {data.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoTile
                icon={<Calendar />}
                label="Meeting Date"
                value={formatDate(data.date)}
              />
              <InfoTile
                icon={<Users />}
                label="Attendees"
                value={`${data.attendees.length} participants`}
              />
            </div>
          </div>
        </div>

        {/* ---------------- Attendees ---------------- */}

        <Section title="Attendees" icon={<Users />}>
          <div className="flex flex-wrap gap-2">
            {data.attendees.map((attendee) => (
              <span
                key={attendee}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full"
              >
                {attendee}
              </span>
            ))}
          </div>
        </Section>

        {/* ---------------- Agenda + Minutes ---------------- */}

        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Agenda" icon={<FileText />}>
            <p className="text-gray-600 whitespace-pre-line">
              {data.agenda || "No agenda provided"}
            </p>
          </Section>

          <Section title="Minutes" icon={<FileText />}>
            <div className="max-h-72 overflow-y-auto pr-1 text-gray-600 whitespace-pre-line">
              {data.minutes || "No minutes recorded"}
            </div>
          </Section>
        </div>

        {/* ---------------- Action Items ---------------- */}

        <Section
          title="Action Items"
          icon={<CheckCircle2 />}
          rightContent={
            <span className="badge bg-blue-100 text-blue-700">
              {data.actionItems.length} Tasks
            </span>
          }
        >
          {data.actionItems.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {data.actionItems.map((item, index) => {
                const expanded = expandedItems.has(item._id);

                return (
                  <div
                    key={item._id}
                    className="border rounded-xl bg-white hover:shadow-md transition"
                  >
                    <button
                      onClick={() => toggleItem(item._id)}
                      className="w-full text-left p-5 space-y-3"
                    >
                      <div className="flex justify-between">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
                          {index + 1}
                        </span>

                        {expanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      <p className="font-medium text-gray-900">{item.desc}</p>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <span
                          className={`badge border ${
                            statusStyles[item.status]
                          }`}
                        >
                          {statusIcons[item.status]}
                          {item.status}
                        </span>

                        <span className="text-gray-500">
                          Owner: {item.owner}
                        </span>

                        <span className="text-gray-500">
                          Due: {formatDate(item.due)}
                        </span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t px-5 py-4 bg-gray-50 text-sm space-y-2">
                        <Row label="Task ID" value={item._id} mono />
                        <Row label="Penalty" value={item.penalty || "—"} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Utility Styles */}
      <style jsx global>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

function Section({
  title,
  icon,
  children,
  rightContent,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  rightContent?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl">
          {icon}
          {title}
        </div>

        {rightContent}
      </div>

      {children}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
      <div className="text-blue-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-400">
      No action items created yet
    </div>
  );
}

export default Page;
