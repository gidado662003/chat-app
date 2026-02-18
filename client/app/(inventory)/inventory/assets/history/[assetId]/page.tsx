"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { inventoryAPI } from "@/lib/inventoryApi";
import type { AssetHistory } from "@/lib/inventoryTypes";
import { formatDate } from "@/helper/dateFormat";
import { ArrowLeft } from "lucide-react";

export default function AssetHistoryPage() {
  const params = useParams<{ assetId: string }>();
  const router = useRouter();
  const assetId = params?.assetId;

  const [history, setHistory] = useState<AssetHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetId) return;
    const fetch = async () => {
      try {
        const data = await inventoryAPI.getAssetHistory(assetId);
        setHistory(data || []);
      } catch (err) {
        console.error("Failed to fetch asset history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [assetId]);

  const rows = useMemo(
    () =>
      history.map((h) => ({
        date: (
          <span className="text-muted-foreground">
            {formatDate(h.createdAt)}
          </span>
        ),
        action: h.action.replaceAll("_", " "),
        status: `${h.previousStatus || "—"} → ${h.newStatus || "—"}`,
        location: `${h.previousLocation || "—"} → ${h.newLocation || "—"}`,
        assignedTo: h.assignedTo?.name || "—",
        performedBy: h.performedBy?.name || h.performedBy?.email || "—",
        notes: h.notes || "—",
      })),
    [history],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading asset history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-right text-sm text-muted-foreground">
          {history.length} event{history.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <DataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "action", label: "Action" },
            { key: "status", label: "Status" },
            { key: "location", label: "Location" },
            { key: "assignedTo", label: "Assigned To" },
            { key: "performedBy", label: "Performed By" },
            { key: "notes", label: "Notes" },
          ]}
          data={rows}
          getRowKey={(_, i) => history[i]?._id ?? i}
          emptyMessage="No history found for this asset"
          striped
        />
      </div>
    </div>
  );
}

