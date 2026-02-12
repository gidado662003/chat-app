"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { InternalRequisition } from "@/lib/internalRequestTypes";
import { internlRequestAPI } from "@/lib/internalRequestApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/helper/currencyFormat";
import { formatDate } from "@/helper/dateFormat";
import { ArrowLeft, Banknote, History, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

const COMPANY_BANKS = [
  { id: "Wema", name: "Wema Bank" },
  { id: "Fidelity", name: "Fidelity Bank" },
  { id: "Zenith1", name: "Zenith Bank (Main)" },
  { id: "Zenith2", name: "Zenith Bank (Operations)" },
  { id: "Sterling10077", name: "Sterling Bank (10077)" },
  { id: "Sterling76149", name: "Sterling Bank (76149)" },
  { id: "AlertMicro", name: "Alert Microfinance Bank" },
  { id: "Stanbic", name: "Stanbic IBTC Bank" },
  { id: "Petty", name: "Petty Cash" },
];

export default function RequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [request, setRequest] = useState<InternalRequisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [manualAmount, setManualAmount] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cheque">("bank");
  const user = useAuthStore((state) => state.user);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await internlRequestAPI.dataById(id);
      setRequest(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requisition");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Loading Requisition...
        </p>
      </div>
    );

  if (!request)
    return (
      <div className="p-20 text-center">
        <h2 className="text-xl font-semibold text-red-500">
          Request not found
        </h2>
        <Button variant="link" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  console.log();

  // Derived calculations
  const totalPaid = request.paymentHistory.reduce(
    (sum, p) => sum + (p.amount || 0),
    0,
  );
  const amountRemaining = request.amountRemaining;
  const amountToPay =
    manualAmount !== null ? Number(manualAmount) : amountRemaining;
  const isPartialPayment = manualAmount !== null;
  const paymentProgress = Math.min(
    100,
    (totalPaid / request.totalAmount) * 100,
  );
  const canProcess =
    ["pending", "outstanding"].includes(request.status) &&
    (user?.department === "Finance" || user?.role === "admin");
  const isFullyPaid = amountRemaining === 0;

  // Handle approve / reject
  const handleAction = async (
    status: "approved" | "outstanding" | "rejected",
  ) => {
    if (!id) return;
    if (!request) return;
    if (user?.department !== "Finance")
      return toast.error("You are not authorized to update this request");

    if (status !== "rejected") {
      if (!selectedBank) return toast.error("Please select a bank account.");
      if (!amountToPay || amountToPay <= 0)
        return toast.error("Enter a valid amount.");
      if (amountToPay > amountRemaining)
        return toast.error("Amount exceeds remaining balance.");
    }

    try {
      setIsSubmitting(true);
      await internlRequestAPI.updateRequest(id, {
        status,
        financeComment: comment,
        sourceBank: selectedBank,
        amountPaid: status === "rejected" ? 0 : amountToPay,
        paymentMethod,
      });

      toast.success(
        `Request ${status === "rejected" ? "rejected" : "processed"}`,
      );
      setComment("");
      setSelectedBank("");
      setManualAmount(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to process request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {request.title}
            </h1>
            <Badge
              className={`px-3 py-1 capitalize border-2 ${isFullyPaid
                ? "bg-green-100 text-green-700 border-green-200"
                : request.status === "outstanding"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : request.status === "rejected"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
            >
              {isFullyPaid ? "Fully Paid" : request.status}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">
            {request.requisitionNumber}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right px-4 py-2 border-r">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Requested
            </p>
            <p className="text-xl font-bold">
              {formatCurrency(request.totalAmount)}
            </p>
          </div>
          <div className="text-right px-4 py-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Remaining
            </p>
            <p
              className={`text-xl font-black ${amountRemaining > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {formatCurrency(amountRemaining)}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${canProcess ? "lg:grid-cols-12" : "lg:grid-cols-1"} gap-8`}
      >
        {/* LEFT COL */}
        <div className={`${canProcess ? "lg:col-span-8" : "w-full"} space-y-6`}>
          {/* Items */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                REQUEST ITEMS
              </CardTitle>
              <div className="flex flex-col items-end gap-1 w-32 md:w-48">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {Math.round(paymentProgress)}% Payed
                </span>
                <Progress value={paymentProgress} className="h-1.5" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="pl-6">Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right pr-6">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell title={item.description} className="pl-6 font-medium truncate max-w-[200px]">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right pr-6 font-semibold">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50/50 font-bold border-t-2">
                    <TableCell
                      colSpan={2}
                      className="text-right pl-6 uppercase text-xs text-muted-foreground"
                    >
                      Gross Amount
                    </TableCell>
                    <TableCell className="text-right pr-6 text-lg">
                      {formatCurrency(request.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Requester Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">
                    Requested By
                  </Label>
                  <p className="font-semibold text-slate-900">
                    {request.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.user.department} • {request.user.email}
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">
                    Location
                  </Label>
                  <p className="font-medium">{request.location} Office</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">
                    Submission Date
                  </Label>
                  <p className="font-medium">{formatDate(request.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">
                    Category
                  </Label>
                  <Badge variant="secondary" className="capitalize">
                    {request.category.replace("-", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

          </div>
          <div className="mt-4">
            {request.attachments.length > 0 && (
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="border-b bg-slate-50/60 flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    ATTACHMENTS
                    <Badge variant="secondary" className="rounded-full">
                      {request.attachments.length}
                    </Badge>
                  </CardTitle>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Click to preview
                  </span>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="max-h-[22rem] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {request.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
                        >
                          <img
                            src={`http://10.10.253.3:5001${file}`}
                            alt={`Attachment ${idx + 1}`}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          <div className="absolute inset-0 flex flex-col justify-end p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-white/90">
                                Attachment {idx + 1}
                              </span>
                              <a
                                href={`http://10.10.253.3:5001${file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/95 text-slate-900 px-3 py-1 rounded-full text-[10px] font-semibold shadow-sm hover:bg-slate-100"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment History */}
          {!canProcess && (
            <PaymentHistoryTable request={request} totalPaid={totalPaid} />
          )}
        </div>

        {/* RIGHT COL: Finance Actions */}
        {canProcess && (
          <div className="lg:col-span-4">
            <Card className="border-blue-200 shadow-xl ring-1 ring-blue-500/10">
              <CardHeader className="bg-blue-600 text-white rounded-t-xl py-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest"></CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Beneficiary */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <Label className="text-[10px] font-black text-blue-700 uppercase">
                    Beneficiary Details
                  </Label>
                  <p className="text-sm font-bold text-blue-900 truncate">
                    {request.accountToPay?.accountName}
                  </p>
                  <p className="text-lg font-mono font-bold text-blue-950 tracking-tighter">
                    {request.accountToPay?.accountNumber}
                  </p>
                  <p className="text-xs font-medium text-blue-700">
                    {request.accountToPay?.bankName}
                  </p>
                </div>

                <Separator />

                {/* Payment Input */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Source Bank
                  </Label>
                  <Select onValueChange={setSelectedBank} value={selectedBank}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select Source Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_BANKS.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Payment Method
                  </Label>
                  <RadioGroup
                    onValueChange={(value: "bank" | "cheque") =>
                      setPaymentMethod(value as "bank" | "cheque")
                    }
                    value={paymentMethod}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank">Transfer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cheque" id="cheque" />
                      <Label htmlFor="cheque">Cheque</Label>
                    </div>
                  </RadioGroup>

                  {/* Amount */}
                  <div className="p-3 rounded-lg border bg-slate-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase">
                        Amount
                      </Label>
                      <button
                        type="button"
                        onClick={() =>
                          setManualAmount(manualAmount === null ? "" : null)
                        }
                        className="text-[10px] font-bold text-blue-600 underline"
                      >
                        {manualAmount === null ? "Manual" : "Full"}
                      </button>
                    </div>
                    {manualAmount !== null ? (
                      <Input
                        type="number"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                      />
                    ) : (
                      <p className="text-xl font-black">
                        {formatCurrency(amountRemaining)}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Payment Notes
                  </Label>
                  <Textarea
                    placeholder="Enter transaction ID or notes..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    disabled={isSubmitting}
                    onClick={() =>
                      handleAction(
                        isPartialPayment ? "outstanding" : "approved",
                      )
                    }
                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-md"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isPartialPayment ? "Partial Payment" : "Full Payment"}
                  </Button>

                  <Button
                    disabled={isSubmitting}
                    variant="ghost"
                    onClick={() => handleAction("rejected")}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 text-xs font-bold"
                  >
                    Decline Requisition
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Payment History Table if processing */}
      {canProcess && (
        <PaymentHistoryTable request={request} totalPaid={totalPaid} />
      )}
    </div>
  );
}

// Payment History Table Component
function PaymentHistoryTable({
  request,
  totalPaid,
}: {
  request: InternalRequisition;
  totalPaid: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <History className="h-5 w-5 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Payment Ledger
        </h2>
        <Badge variant="secondary" className="rounded-full font-mono">
          {request.paymentHistory?.length || 0}
        </Badge>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Source Bank</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Processed By</TableHead>
              <TableHead className="text-right pr-6">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.paymentHistory.length > 0 ? (
              request.paymentHistory.map((log, idx) => (
                <TableRow
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(log.date)}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">
                    {log.bank || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {log.paymentMethod || "Bank"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.paidBy || "System"}
                  </TableCell>
                  <TableCell className="text-right pr-6 font-mono font-bold text-slate-900">
                    {formatCurrency(log.amount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-4 text-muted-foreground text-sm"
                >
                  No Payment History
                </TableCell>
              </TableRow>
            )}
            <TableRow className="border-t-2 font-bold">
              <TableCell
                colSpan={4}
                className="text-right pr-6 uppercase text-xs text-muted-foreground"
              >
                Total Paid
              </TableCell>
              <TableCell className="text-right pr-6 font-mono">
                {formatCurrency(totalPaid)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
