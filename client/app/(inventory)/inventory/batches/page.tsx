"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inventoryAPI } from "@/lib/inventoryApi";
import { ProcurementBatch } from "@/lib/inventoryTypes";
import { PackageCheck } from "lucide-react";

export default function BatchesPage() {
  const [batches, setBatches] = useState<ProcurementBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      const data = await inventoryAPI.getBatches();
      setBatches(data || []);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const awaitingBatches = batches.filter(
    (b) =>
      b.status === "awaiting_receipt" || b.status === "partially_received"
  );

  const statusVariant = (status: string) => {
    if (status === "received") return "default";
    if (status === "partially_received") return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading batches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receive Goods</h1>
        <p className="text-muted-foreground">
          Receive items from approved procurement batches
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Batches Awaiting Receipt</h2>
          <p className="text-sm text-muted-foreground">
            {awaitingBatches.length} batch(es) ready to receive
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Expected</TableHead>
                <TableHead className="font-semibold">Received</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Requisition</TableHead>
                <TableHead className="font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {awaitingBatches.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No batches awaiting receipt
                  </TableCell>
                </TableRow>
              ) : (
                awaitingBatches.map((batch) => (
                  <TableRow key={batch._id}>
                    <TableCell className="font-medium">
                      {batch.product?.name || "—"}
                    </TableCell>
                    <TableCell>{batch.expectedQuantity}</TableCell>
                    <TableCell>{batch.receivedQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(batch.status)}>
                        {batch.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch.location || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {typeof batch.requisition === "object" &&
                      batch.requisition?.requisitionNumber
                        ? batch.requisition.requisitionNumber
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" asChild className="gap-1">
                        <Link href={`/inventory/batches/${batch._id}/receive`}>
                          <PackageCheck className="h-4 w-4" />
                          Receive
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
