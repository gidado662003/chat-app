"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/dashboard/data-table";
import { inventoryAPI } from "@/lib/inventoryApi";
import type { Asset } from "@/lib/inventoryTypes";
import { formatDate } from "@/helper/dateFormat";
import { ArrowLeft, Search, Package, Box } from "lucide-react";
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

const statCards = [
  {
    label: "In Stock",
    key: "IN_STOCK",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Assigned",
    key: "ASSIGNED",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Maintenance",
    key: "UNDER_MAINTENANCE",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Retired",
    key: "RETIRED",
    color: "text-rose-600 dark:text-rose-400",
  },
] as const;

export default function AssetProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = params?.productId;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchLoad, setSearchLoad] = useState(false);

  useEffect(() => {
    if (!productId) return;
    const fetchAssets = async () => {
      try {
        setSearchLoad(true);
        const data = await inventoryAPI.getAssetsByProduct(productId, search);
        setAssets(data);
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      } finally {
        setLoading(false);
        setSearchLoad(false);
      }
    };
    fetchAssets();
  }, [productId, search]);

  const productName = assets[0]?.product?.name || "Product Assets";
  const category = assets[0]?.product?.category;

  const counts = Object.fromEntries(
    statCards.map(({ key }) => [
      key,
      assets.filter((a) => a.status === key).length,
    ]),
  );

  const rows = assets.map((a) => ({
    serialNumber: (
      <span className="font-mono text-sm">{a.serialNumber || "—"}</span>
    ),
    status: (
      <Badge variant={statusVariant(a.status)} className="text-xs">
        {String(a.status).replaceAll("_", " ")}
      </Badge>
    ),
    location: <span className="text-sm">{a.location || "Main Warehouse"}</span>,
    assignedTo: (
      <span className="text-sm">
        {a.movements ? a.movements[0].toHolderSnapshot?.name : "—"}
      </span>
    ),
    type: (
      <span className="text-sm text-muted-foreground">
        {a.holderType || "—"}
      </span>
    ),
    createdAt: (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(a.createdAt)}
      </span>
    ),
    updatedAt: (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(a.updatedAt)}
      </span>
    ),
    history: (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href={`/inventory/assets/history/${a._id}`}>History</Link>
      </Button>
    ),
    movement: (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href={`/inventory/assets/movement/${a._id}`}>Movement</Link>
      </Button>
    ),
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading assets...</p>
      </div>
    );
  }

  // Only show the full empty state (with early return) if there's no search active
  if (!loading && assets.length === 0 && !search) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/inventory/assets")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assets
        </Button>
        <div className="rounded-xl border bg-card p-12 text-center space-y-2">
          <Box className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <h1 className="text-base font-semibold">No assets found</h1>
          <p className="text-sm text-muted-foreground">
            There are no assets recorded for this product yet.
          </p>
        </div>
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
          className="gap-1.5 px-0 -ml-1 text-muted-foreground hover:text-foreground h-8"
          onClick={() => router.push("/inventory/assets")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {productName}
            </h1>
            {category && (
              <p className="text-sm text-muted-foreground mt-0.5">{category}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ label, key, color }) => (
          <div
            key={key}
            className="rounded-lg border bg-card px-4 py-3 space-y-1"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-semibold tabular-nums ${color}`}>
              {counts[key]}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground shrink-0">
          {searchLoad ? (
            <span className="italic">Searching...</span>
          ) : (
            <>
              {assets.length} asset{assets.length !== 1 ? "s" : ""}
            </>
          )}
        </p>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Serial, status, location, assignee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {!searchLoad && assets.length === 0 && search ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Search className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm font-medium">
              No results for &ldquo;{search}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground">
              Try a different serial, status, location, or assignee.
            </p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: "serialNumber", label: "Serial" },
              { key: "status", label: "Status" },
              { key: "location", label: "Location" },
              { key: "assignedTo", label: "Assigned To" },
              { key: "type", label: "Type" },
              { key: "createdAt", label: "Created" },
              { key: "updatedAt", label: "Updated" },
              { key: "history", label: "" },
              { key: "movement", label: "" },
            ]}
            data={rows}
            getRowKey={(_, i) => assets[i]?._id ?? i}
            emptyMessage="No assets found for this product"
            striped
          />
        )}
      </div>
    </div>
  );
}
