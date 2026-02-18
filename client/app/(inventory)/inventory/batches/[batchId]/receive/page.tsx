"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { inventoryAPI } from "@/lib/inventoryApi";
import { ProcurementBatch } from "@/lib/inventoryTypes";
import { ArrowLeft, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

export default function ReceiveBatchPage() {
  const params = useParams<{ batchId: string }>();
  const router = useRouter();
  const batchId = params?.batchId;

  const [batch, setBatch] = useState<ProcurementBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);

  const remainingToReceive = batch
    ? batch.expectedQuantity - batch.receivedQuantity
    : 0;
  const isAsset = batch?.product?.trackIndividually ?? false;

  useEffect(() => {
    if (!batchId) return;
    const fetch = async () => {
      try {
        const data = await inventoryAPI.getBatchById(batchId);
        setBatch(data);
        setQuantity(Math.min(data.expectedQuantity - data.receivedQuantity, 1));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load batch");
        router.push("/inventory/batches");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [batchId, router]);

  useEffect(() => {
    if (isAsset) {
      setSerialNumbers(new Array(quantity).fill(""));
    }
  }, [quantity, isAsset]);

  const handleQuantityChange = (val: number) => {
    const qty = Math.max(1, Math.min(remainingToReceive, val));
    setQuantity(qty);
  };

  const handleSerialChange = (index: number, value: string) => {
    setSerialNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;

    if (quantity <= 0 || quantity > remainingToReceive) {
      toast.error("Quantity must be between 1 and " + remainingToReceive);
      return;
    }

    if (isAsset) {
      const filled = serialNumbers.filter((s) => s.trim()).length;
      if (filled !== quantity) {
        toast.error(
          "Please fill all " + quantity + " serial number field(s) for this asset"
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await inventoryAPI.receiveBatch(batch._id, {
        quantity,
        serialNumbers: isAsset ? serialNumbers : undefined,
      });
      toast.success("Batch received successfully");
      router.push("/inventory/batches");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error ?? "Failed to receive batch");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading batch...</p>
      </div>
    );
  }

  if (!batch) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory/batches" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receive goods</CardTitle>
          <CardDescription>
            {batch.product?.name} — receive up to {remainingToReceive} unit(s)
            {isAsset ? ". Serial numbers are required for each unit." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to receive</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={remainingToReceive}
                value={quantity}
                onChange={(e) =>
                  handleQuantityChange(parseInt(e.target.value, 10) || 0)
                }
              />
              <p className="text-xs text-muted-foreground">
                Max: {remainingToReceive} (expected {batch.expectedQuantity},
                already received {batch.receivedQuantity})
              </p>
            </div>

            {isAsset && (
              <div className="space-y-2">
                <Label>Serial numbers ({quantity} required)</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {serialNumbers.map((sn, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm w-8">{i + 1}.</span>
                      <Input
                        placeholder={"Serial " + (i + 1)}
                        value={sn}
                        onChange={(e) => handleSerialChange(i, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <PackageCheck className="h-4 w-4" />
                Confirm receive
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/inventory/batches">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Batch summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Product:</span>{" "}
            {batch.product?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Location:</span>{" "}
            {batch.location || "Main Warehouse"}
          </p>
          <p>
            <span className="text-muted-foreground">Type:</span>{" "}
            {isAsset ? "Asset (tracked by serial)" : "Inventory"}
          </p>
          {typeof batch.requisition === "object" &&
            batch.requisition?.requisitionNumber && (
              <p>
                <span className="text-muted-foreground">Requisition:</span>{" "}
                {batch.requisition.requisitionNumber}
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
