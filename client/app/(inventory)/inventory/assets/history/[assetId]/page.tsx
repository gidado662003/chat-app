"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { inventoryAPI } from "@/lib/inventoryApi";
import type { AssetHistory, AssetEventType } from "@/lib/inventoryTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  ArrowRight,
  Repeat2,
  UserPlus,
  Wrench,
  Trash2,
  CornerDownLeft,
} from "lucide-react";
import { format } from "date-fns";



const EVENT_META: Record<
  AssetEventType,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ReactNode;
    color: string; // dot + left-border color
  }
> = {
  ASSIGN: {
    label: "Assigned",
    variant: "default",
    icon: <UserPlus className="h-3.5 w-3.5" />,
    color: "bg-blue-500",
  },
  TRANSFER: {
    label: "Transferred",
    variant: "secondary",
    icon: <Repeat2 className="h-3.5 w-3.5" />,
    color: "bg-violet-500",
  },
  RETURN: {
    label: "Returned",
    variant: "outline",
    icon: <CornerDownLeft className="h-3.5 w-3.5" />,
    color: "bg-emerald-500",
  },
  MAINTENANCE: {
    label: "Maintenance",
    variant: "outline",
    icon: <Wrench className="h-3.5 w-3.5" />,
    color: "bg-amber-500",
  },
  DISPOSE: {
    label: "Disposed",
    variant: "destructive",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    color: "bg-rose-500",
  },
};

function formatDateTime(dateString: string) {
  try {
    return format(new Date(dateString), "MMM d, yyyy · HH:mm");
  } catch {
    return dateString;
  }
}

/** Resolve the display name for a holder from either snapshot or populated ref */
function resolveHolder(event: AssetHistory): string | null {
  if (event.toHolderSnapshot?.name) return event.toHolderSnapshot.name;
  // toHolder is a raw ObjectId string when not populated — not useful to show
  return null;
}

function resolvePerformedBy(event: AssetHistory): string | null {
  if (event.performedBySnapshot?.name) return event.performedBySnapshot.name;
  return null;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AssetHistoryPage() {
  const params = useParams<{ assetId: string }>();
  const router = useRouter();
  const assetId = params?.assetId;

  const [history, setHistory] = useState<AssetHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetId) return;
    const load = async () => {
      try {
        const data = await inventoryAPI.getAssetHistory(assetId);
        setHistory(data || []);
      } catch (err) {
        console.error("Failed to fetch asset history:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assetId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-0 -ml-1 h-8 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Asset History
          </h1>
          <p className="text-sm text-muted-foreground">
            {history.length} event{history.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      {/* Timeline */}
      {history.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-2">
          <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium">No history yet</p>
          <p className="text-xs text-muted-foreground">
            Events will appear here once this asset has activity.
          </p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* vertical rule */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          {history.map((event, idx) => {
            const meta = EVENT_META[event.type] ?? EVENT_META.ASSIGN;
            const holder = resolveHolder(event);
            const performedBy = resolvePerformedBy(event);

            return (
              <div
                key={event._id}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                {/* dot */}
                <div
                  className={`relative z-10 mt-[14px] h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-background ${meta.color}`}
                />

                {/* card */}
                <div className="flex-1 rounded-lg border bg-card px-4 py-3 space-y-3 shadow-sm">
                  {/* top row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={meta.variant}
                        className="gap-1 text-xs py-0.5"
                      >
                        {meta.icon}
                        {meta.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(event.performedAt)}
                    </span>
                  </div>

                  {/* details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                    {/* Status transition */}
                    {(event.fromStatus || event.toStatus) && (
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          Status
                        </p>
                        <div className="flex items-center gap-1.5 font-medium">
                          {event.fromStatus && (
                            <>
                              <span className="text-muted-foreground font-normal">
                                {event.fromStatus.replaceAll("_", " ")}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            </>
                          )}
                          <span>{event.toStatus.replaceAll("_", " ")}</span>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {(event.fromLocation || event.toLocation) && (
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          Location
                        </p>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div className="flex items-center gap-1.5 font-medium">
                            {event.fromLocation && (
                              <>
                                <span className="text-muted-foreground font-normal">
                                  {event.fromLocation}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              </>
                            )}
                            {event.toLocation && (
                              <span>{event.toLocation}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Holder */}
                    {holder && (
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          Assigned to
                        </p>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{holder}</span>
                        </div>
                      </div>
                    )}

                    {/* Performed by */}
                    {performedBy && (
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          By
                        </p>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">{performedBy}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {event.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
