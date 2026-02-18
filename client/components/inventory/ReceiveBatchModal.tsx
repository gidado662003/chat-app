"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProcurementBatch } from "@/lib/inventoryTypes";
import { inventoryAPI } from "@/lib/inventoryApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type ReceiveBatchModalProps = {
  batch: ProcurementBatch | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ReceiveBatchModal({
  batch,
  open,
  onClose,
  onSuccess,
}: ReceiveBatchModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const remainingToReceive = batch
    ? batch.expectedQuantity - batch.receivedQuantity
    : 0;
  const isAsset = batch?.product?.trackIndividually ?? false;

  useEffect(() => {
    if (open && batch) {
      const maxQty = batch.expectedQuantity - batch.receivedQuantity;
      setQuantity(Math.min(maxQty, 1));
      setSerialNumbers(new Array(Math.min(maxQty, 1)).fill(""));
    }
  }, [open, batch]);

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

  const handleSubmit = async () => {
    if (!batch) return;

    if (quantity <= 0 || quantity > remainingToReceive) {
      toast.error("Quantity must be between 1 and " + remainingToReceive);
      return;
    }

    if (isAsset) {
      const filled = serialNumbers.filter((s) => s.trim()).length;
      if (filled !== quantity) {
        toast.error(
          "Please fill all " +
            quantity +
            " serial number field(s) for this asset",
        );
        return;
      }
    }

    setLoading(true);
    try {
      await inventoryAPI.receiveBatch(batch._id, {
        quantity,
        serialNumbers: isAsset ? serialNumbers : undefined,
      });
      toast.success("Batch received successfully");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message ?? "Failed to receive batch";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-7xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Batch</DialogTitle>
          <DialogDescription>
            {batch.product?.name} — receive up to {remainingToReceive} unit(s)
            {isAsset ? " (serial numbers required)" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
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
            <p className="text-xs text-muted-foreground mt-1">
              Max: {remainingToReceive} (expected {batch.expectedQuantity},
              already received {batch.receivedQuantity})
            </p>
          </div>

          {isAsset && (
            <div>
              <Label>Serial numbers ({quantity} required)</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {serialNumbers.map((sn, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm w-6">{i + 1}.</span>
                    <Input
                      placeholder={"Serial " + (i + 1)}
                      value={sn}
                      onChange={(e) => handleSerialChange(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Receive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
