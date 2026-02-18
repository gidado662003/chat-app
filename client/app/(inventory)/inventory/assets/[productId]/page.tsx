"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/dashboard/data-table";
import { inventoryAPI } from "@/lib/inventoryApi";
import type { Asset } from "@/lib/inventoryTypes";
import { formatDate } from "@/helper/dateFormat";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function statusVariant(status: Asset["status"]) {
  switch (status) {
    case "IN_STOCK":
      return "default" as const;
    case "ASSIGNED":
      return "secondary" as const;
    case "UNDER_MAINTENANCE":
      return "outline" as const;
    case "RETIRED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function AssetProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = params?.productId;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await inventoryAPI.getAssets();
        const filtered = (data || []).filter(
          (a) => a.product?._id === productId,
        );
        setAssets(filtered);
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchAssets();
    }
  }, [productId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return assets;
    const q = search.toLowerCase().trim();
    return assets.filter((a) => {
      const serial = a.serialNumber?.toLowerCase() ?? "";
      const location = a.location?.toLowerCase() ?? "";
      const assigned =
        [a.assignedTo?.name, a.assignedTo?.email, a.assignedTo?.department]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() ?? "";
      const status = String(a.status).toLowerCase();
      return (
        serial.includes(q) ||
        location.includes(q) ||
        assigned.includes(q) ||
        status.includes(q)
      );
    });
  }, [assets, search]);

  const productName = assets[0]?.product?.name || "Product assets";
  const category = assets[0]?.product?.category;

  const inStock = assets.filter((a) => a.status === "IN_STOCK").length;
  const assigned = assets.filter((a) => a.status === "ASSIGNED").length;
  const underMaintenance = assets.filter(
    (a) => a.status === "UNDER_MAINTENANCE",
  ).length;
  const retired = assets.filter((a) => a.status === "RETIRED").length;

  const rows = filtered.map((a) => ({
    serialNumber: <span className="font-mono">{a.serialNumber || "—"}</span>,
    status: (
      <Badge variant={statusVariant(a.status)}>
        {String(a.status).replaceAll("_", " ")}
      </Badge>
    ),
    location: a.location || "Main Warehouse",
    assignedTo: a.assignedTo?.name || "—",
    assignedEmail: a.assignedTo?.email || "—",
    createdAt: (
      <span className="text-muted-foreground">{formatDate(a.createdAt)}</span>
    ),
    updatedAt: (
      <span className="text-muted-foreground">{formatDate(a.updatedAt)}</span>
    ),
    history: (
      <Button variant="link" size="sm" asChild>
        <Link href={`/inventory/assets/history/${a._id}`}>History</Link>
      </Button>
    ),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading product assets...</p>
      </div>
    );
  }

  if (!loading && assets.length === 0) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-0"
          onClick={() => router.push("/inventory/assets")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assets
        </Button>
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">No assets found</h1>
          <p className="text-muted-foreground">
            There are no assets recorded for this product yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-0"
            onClick={() => router.push("/inventory/assets")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assets
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{productName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {category && (
                <Badge variant="secondary" className="uppercase text-[10px]">
                  {category}
                </Badge>
              )}
              <Badge variant="outline">
                {assets.length} asset{assets.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            In Stock
          </p>
          <p className="mt-1 text-xl font-semibold">{inStock}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Assigned
          </p>
          <p className="mt-1 text-xl font-semibold">{assigned}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Maintenance
          </p>
          <p className="mt-1 text-xl font-semibold">{underMaintenance}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Retired
          </p>
          <p className="mt-1 text-xl font-semibold">{retired}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} asset{filtered.length === 1 ? "" : "s"} for this
          product.
        </p>
        <Input
          type="text"
          placeholder="Filter by serial, status, location, or assignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4">
          <DataTable
            columns={[
              { key: "serialNumber", label: "Serial Number" },
              { key: "status", label: "Status" },
              { key: "location", label: "Location" },
              { key: "assignedTo", label: "Assigned To" },
              { key: "assignedEmail", label: "Email" },
              { key: "createdAt", label: "Created" },
              { key: "updatedAt", label: "Updated" },
              { key: "history", label: "" },
            ]}
            data={rows}
            getRowKey={(_, i) => filtered[i]?._id ?? i}
            emptyMessage="No assets found for this product"
            striped
          />
        </div>
      </div>
    </div>
  );
}

