import React from "react";
import { CreateRequisitionPayload } from "@/lib/internalRequestTypes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/helper/currencyFormat";
import RequestAttachement from "./request-attachment";

type RequisitionViewProps = {
  formData: CreateRequisitionPayload;
  setFormData: React.Dispatch<React.SetStateAction<CreateRequisitionPayload>>;
  handleCreateRequest: () => void;
  onBack: () => void;
  onNext: () => void;
  loading: boolean | undefined;
};

function RequestPreview({
  formData,
  setFormData,
  onBack,
  onNext,
  handleCreateRequest,
  loading,
}: RequisitionViewProps) {
  const {
    title,
    location,
    category,
    requestedOn,
    accountToPay,
    items,
    attachement,
  } = formData;
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Review & Submit</CardTitle>
        <CardDescription className="mt-1 text-sm">
          Confirm the details below before submitting your requisition.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic info */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Title</p>
              <p className="font-medium">{title || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date Requested</p>
              <p className="font-medium">
                {requestedOn ? new Date(requestedOn).toLocaleDateString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Branch</p>
              <p className="font-medium capitalize">{location || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{category || "—"}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-3">
            <h3 className="text-sm font-semibold">Items</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-right">Qty</TableHead>
                <TableHead className="w-[140px] text-right">
                  Unit Price
                </TableHead>
                <TableHead className="w-[140px] text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, ind) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{ind + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length > 0 && (
            <div className="border-t bg-muted/50 px-4 py-3">
              <div className="flex justify-end">
                <span className="text-lg font-semibold">
                  Total: {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payment details */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Details
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Account Name</p>
              <p className="font-medium">{accountToPay.accountName || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Account Number</p>
              <p className="font-medium">{accountToPay.accountNumber || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bank</p>
              <p className="font-medium">{accountToPay.bankName || "—"}</p>
            </div>
          </div>
        </div>
        <div>
          <RequestAttachement
            files={attachement}
            setFormData={setFormData} // if you want to allow deleting from preview
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button disabled={loading} variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button disabled={loading} onClick={handleCreateRequest}>
            {loading ? "Submitting..." : "Submit Requisition"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RequestPreview;
