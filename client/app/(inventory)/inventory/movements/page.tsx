"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { inventoryAPI } from "@/lib/inventoryApi";
import type { InventoryMovement } from "@/lib/inventoryTypes";
import { formatDate } from "@/helper/dateFormat";

function typeLabel(type: InventoryMovement["type"]) {
  switch (type) {
    case "PROCUREMENT":
      return "Procurement";
    case "SALE":
      return "Sale";
    case "TRANSFER":
      return "Transfer";
    case "ADJUSTMENT":
      return "Adjustment";
    case "RETURN":
      return "Return";
    default:
      return type;
  }
}

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await inventoryAPI.getInventoryMovements();
        setMovements(data || []);
      } catch (err) {
        console.error("Failed to fetch inventory movements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return movements;
    const q = search.toLowerCase().trim();
    return movements.filter((m) => {
      const productName = m.product?.name?.toLowerCase() ?? "";
      const type = m.type.toLowerCase();
      const location = m.location?.toLowerCase() ?? "";
      const performer =
        [m.performedBy?.name, m.performedBy?.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() ?? "";
      return (
        productName.includes(q) ||
        type.includes(q) ||
        location.includes(q) ||
        performer.includes(q)
      );
    });
  }, [movements, search]);

  const rows = filtered.map((m) => ({
    date: (
      <span className="text-muted-foreground">
        {formatDate(m.createdAt)}
      </span>
    ),
    product: <span className="font-medium">{m.product?.name || "—"}</span>,
    type: (
      <Badge variant="secondary" className="capitalize">
        {typeLabel(m.type)}
      </Badge>
    ),
    quantity: (
      <span className="font-semibold">
        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
      </span>
    ),
    previous: m.previousQuantity,
    newQuantity: m.newQuantity,
    location: m.location || "—",
    performedBy: m.performedBy?.name || m.performedBy?.email || "—",
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading inventory movements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory Movements</h1>
        <p className="text-muted-foreground">
          Recent changes to inventory quantities across products and locations.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing latest {filtered.length} movements.
        </p>
        <Input
          type="text"
          placeholder="Search by product, type, location, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4">
          <DataTable
            columns={[
              { key: "date", label: "Date" },
              { key: "product", label: "Product" },
              { key: "type", label: "Type" },
              { key: "quantity", label: "Qty" },
              { key: "previous", label: "Prev Qty" },
              { key: "newQuantity", label: "New Qty" },
              { key: "location", label: "Location" },
              { key: "performedBy", label: "Performed By" },
            ]}
            data={rows}
            getRowKey={(_, i) => filtered[i]?._id ?? i}
            emptyMessage="No inventory movements found"
            striped
          />
        </div>
      </div>
    </div>
  );
}

