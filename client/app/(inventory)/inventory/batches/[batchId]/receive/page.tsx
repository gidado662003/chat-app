"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inventoryAPI } from "@/lib/inventoryApi";
import { ProcurementBatch } from "@/lib/inventoryTypes";
import { ArrowLeft, Loader2, PackageCheck, Info, Tag } from "lucide-react";
import { toast } from "sonner";

type AssetMeta = {
  serialNumber: string;
  condition: "NEW" | "GOOD" | "FAIR" | "DAMAGED";
  category: "equipment" | "consumable" | "other";
  ownership: "COMPANY" | "CUSTOMER";
  purchaseDate: string;
  notes: string;
};

const defaultMeta = (): AssetMeta => ({
  serialNumber: "",
  condition: "NEW",
  category: "equipment",
  ownership: "COMPANY",
  purchaseDate: new Date().toISOString().split("T")[0],
  notes: "",
});

export default function ReceiveBatchPage() {
  const params = useParams<{ batchId: string }>();
  const router = useRouter();
  const batchId = params?.batchId;

  const [batch, setBatch] = useState<ProcurementBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [assetMetas, setAssetMetas] = useState<AssetMeta[]>([]);

  const remainingToReceive = batch
    ? batch.expectedQuantity - batch.receivedQuantity
    : 0;
  const isAsset = batch?.product?.trackIndividually ?? false;

  useEffect(() => {
    if (!batchId) return;

    const fetchBatch = async () => {
      try {
        const data = await inventoryAPI.getBatchById(batchId);
        setBatch(data);
        setQuantity(Math.min(data.expectedQuantity - data.receivedQuantity, 1));
      } catch {
        toast.error("Failed to load batch");
        router.push("/inventory/batches");
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchId, router]);

  useEffect(() => {
    if (!isAsset) return;

    setAssetMetas((prev) => {
      if (prev.length === quantity) return prev;
      if (!quantity) return [];
      if (prev.length < quantity) {
        return [
          ...prev,
          ...Array(quantity - prev.length)
            .fill(null)
            .map(defaultMeta),
        ];
      }
      return prev.slice(0, quantity);
    });
  }, [quantity, isAsset]);

  const handleQuantityChange = (val: number) => {
    const qty = Math.max(1, Math.min(remainingToReceive, val));
    setQuantity(qty);
  };

  const updateAssetMeta = <K extends keyof AssetMeta>(
    index: number,
    field: K,
    value: AssetMeta[K],
  ) => {
    setAssetMetas((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;
    if (!quantity || quantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (quantity <= 0 || quantity > remainingToReceive) {
      toast.error(`Quantity must be between 1 and ${remainingToReceive}`);
      return;
    }

    if (isAsset) {
      const missingSerial = assetMetas.some(
        (meta) => !meta.serialNumber.trim(),
      );
      if (missingSerial) {
        toast.error("Serial number is required for all units");
        return;
      }
    }

    setSubmitting(true);
    try {
      await inventoryAPI.receiveBatch(batch._id, {
        quantity,
        ...(isAsset && { assetMetas }),
      });
      toast.success("Batch received successfully");
      router.push("/inventory/batches");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? "Failed to receive batch");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div className=" mx-auto space-y-8 p-2">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b ">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="rounded-full"
          >
            <Link href="/inventory/batches">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Tag className="h-3 w-3" />
              {batch.product?.name} •{" "}
              <span className="font-medium text-primary">
                {remainingToReceive} units pending
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="ghost" asChild></Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="shadow-sm"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PackageCheck className="mr-2 h-4 w-4" />
            )}
            Receive {quantity} Unit{quantity > 1 ? "s" : ""}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-8 space-y-6">
          {isAsset && quantity > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Individual Unit Tracking
                </h2>
                <span className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground font-medium">
                  {quantity} Units Total
                </span>
              </div>

              {assetMetas.map((meta, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 py-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Unit Identifier #{i + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                          Serial Number{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={meta.serialNumber}
                          onChange={(e) =>
                            updateAssetMeta(i, "serialNumber", e.target.value)
                          }
                          placeholder="Ex: SN-990234..."
                          className="bg-background"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          Condition
                        </Label>
                        <Select
                          value={meta.condition}
                          onValueChange={(v) =>
                            updateAssetMeta(i, "condition", v as any)
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW"> New</SelectItem>
                            <SelectItem value="GOOD">Good</SelectItem>
                            <SelectItem value="FAIR">Fair</SelectItem>
                            <SelectItem value="DAMAGED">Damaged</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          Category
                        </Label>
                        <Select
                          value={meta.category}
                          onValueChange={(v) =>
                            updateAssetMeta(i, "category", v as any)
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="consumable">
                              Consumable
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          Ownership
                        </Label>
                        <Select
                          value={meta.ownership}
                          onValueChange={(v) =>
                            updateAssetMeta(i, "ownership", v as any)
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMPANY">
                              Company Owned
                            </SelectItem>
                            <SelectItem value="CUSTOMER">
                              Customer Owned
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          Purchase Date
                        </Label>
                        <Input
                          type="date"
                          value={meta.purchaseDate}
                          onChange={(e) =>
                            updateAssetMeta(i, "purchaseDate", e.target.value)
                          }
                          className="bg-background"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          Unit Notes
                        </Label>
                        <Textarea
                          value={meta.notes}
                          onChange={(e) =>
                            updateAssetMeta(i, "notes", e.target.value)
                          }
                          placeholder="Add any specific details for this unit..."
                          className="bg-background resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex items-center justify-center p-12 border-dashed">
              <div className="text-center space-y-2">
                <Info className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground font-medium">
                  Standard inventory item - No serial numbers required.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Configuration & Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quantity Card */}
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
                Reception Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qty" className="text-sm font-medium">
                  Quantity to Receive
                </Label>
                <div className="relative">
                  <Input
                    id="qty"
                    type="number"
                    max={remainingToReceive}
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 0)
                    }
                    className="text-lg font-semibold h-12 pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    UNITS
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  Maximum allowed: {remainingToReceive} units
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="bg-muted/50 border-none shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Batch Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex flex-col border-b border-border/50 pb-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Product Name
                  </span>
                  <span className="text-sm font-medium">
                    {batch.product?.name}
                  </span>
                </div>
                <div className="flex flex-col border-b border-border/50 pb-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Warehouse Location
                  </span>
                  <span className="text-sm font-medium">
                    {batch.location || "Main Warehouse"}
                  </span>
                </div>
                <div className="flex flex-col border-b border-border/50 pb-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Tracking Type
                  </span>
                  <span className="text-sm font-medium">
                    {isAsset
                      ? "✅ Individual Serial Tracking"
                      : "📦 Bulk Inventory"}
                  </span>
                </div>
                {batch.requisition?.requisitionNumber && (
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Reference Requisition
                    </span>
                    <span className="text-sm font-medium text-primary">
                      #{batch.requisition.requisitionNumber}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
