"use client";
import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { CreateRequisitionPayload } from "@/lib/internalRequestTypes";

type RequisitionItemsProps = {
    formData: CreateRequisitionPayload;
    setFormData: React.Dispatch<React.SetStateAction<CreateRequisitionPayload>>;
    onBack: () => void;
    onNext: () => void;
};

function RequisitionItems({ formData, setFormData, onBack, onNext }: RequisitionItemsProps) {
    const items = formData.items;
    const accountToPay = formData.accountToPay;

    const [newItem, setNewItem] = useState({
        description: "",
        quantity: "",
        unitPrice: "",
    });

    const newItemTotal =
        (parseFloat(newItem.quantity) || 0) * (parseFloat(newItem.unitPrice) || 0);

    const addItem = () => {
        if (!newItem.description.trim()) return;

        const quantity = parseFloat(newItem.quantity) || 0;
        const unitPrice = parseFloat(newItem.unitPrice) || 0;
        const total = quantity * unitPrice;

        const item = {
            description: newItem.description,
            quantity,
            unitPrice,
            id: Date.now().toString(),
            total,
        };

        setFormData((prev) => ({ ...prev, items: [...prev.items, item] }));
        setNewItem({ description: "", quantity: "", unitPrice: "" });
    };

    const removeItem = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== id),
        }));
    };

    const updateItem = (
        id: string,
        updates: Partial<{ description: string; quantity: string | number; unitPrice: string | number }>
    ) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((it) => {
                if (it.id !== id) return it;
                const merged = { ...it, ...updates };
                const qty =
                    typeof merged.quantity === "string"
                        ? parseFloat(merged.quantity) || 0
                        : merged.quantity;
                const price =
                    typeof merged.unitPrice === "string"
                        ? parseFloat(merged.unitPrice) || 0
                        : merged.unitPrice;
                return {
                    ...merged,
                    quantity: qty,
                    unitPrice: price,
                    total: qty * price,
                };
            }),
        }));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const accountValid =
        Boolean(accountToPay.accountName?.trim()) &&
        Boolean(accountToPay.accountNumber?.trim()) &&
        Boolean(accountToPay.bankName?.trim());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Descriptions</CardTitle>
                <CardDescription>
                    Add items and payment details for the request
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-100 border border-slate-200/80 shadow-sm font-semibold text-slate-800">
                                <TableCell className="font-semibold text-slate-800">
                                    New
                                </TableCell>
                                <TableCell className="border-l border-slate-200/80">
                                    <Input
                                        placeholder="Enter description..."
                                        value={newItem.description}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, description: e.target.value })
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addItem();
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell className="border-l border-slate-200/80">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={newItem.quantity}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, quantity: e.target.value })
                                        }
                                    />
                                </TableCell>
                                <TableCell className="border-l border-slate-200/80">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={newItem.unitPrice}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, unitPrice: e.target.value })
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addItem();
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell className="font-semibold text-slate-800 border-l border-slate-200/80">
                                    {newItem.quantity && newItem.unitPrice ? (
                                        `₦ ${newItemTotal.toLocaleString()}`
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[100px]">Qty</TableHead>
                                <TableHead className="w-[150px]">Unit Price (₦)</TableHead>
                                <TableHead className="w-[150px]">Total (₦)</TableHead>
                                <TableHead className="w-[50px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, ind) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{ind + 1}</TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.description}
                                            onChange={(e) =>
                                                updateItem(item.id, { description: e.target.value })
                                            }
                                            placeholder="Description"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateItem(item.id, {
                                                    quantity: e.target.value,
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={item.unitPrice}
                                            onChange={(e) =>
                                                updateItem(item.id, {
                                                    unitPrice: e.target.value,
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {item.quantity != null && item.unitPrice != null ? (
                                            `₦ ${item.total.toLocaleString()}`
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {items.length > 0 && (
                        <div className="p-4 border-t bg-muted/50">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground" />
                                <div className="text-lg font-semibold">
                                    Total Amount: ₦ {totalAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No items added yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Use the form above to add your first item
                        </p>
                    </div>
                )}

                <div className="border rounded-lg">
                    <div className="p-4 border-b bg-muted/50">
                        <h3 className="font-semibold">Payment Details</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="accountName">Account Name</Label>
                            <Input
                                id="accountName"
                                placeholder="John Doe Enterprises"
                                value={accountToPay.accountName}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountToPay: {
                                            ...prev.accountToPay,
                                            accountName: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input
                                id="accountNumber"
                                placeholder="0123456789"
                                maxLength={10}
                                value={accountToPay.accountNumber}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountToPay: {
                                            ...prev.accountToPay,
                                            accountNumber: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                placeholder="First Bank"
                                value={accountToPay.bankName}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountToPay: {
                                            ...prev.accountToPay,
                                            bankName: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onBack}>
                        Back
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={items.length === 0 || !accountValid}
                    >
                        Next: Submission
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default RequisitionItems;
