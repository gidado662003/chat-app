"use client"
import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { internlRequestAPI } from "@/lib/internalRequestApi"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from "@/helper/currencyFormat"
import { InternalRequisition } from "@/lib/internalRequestTypes"
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
function RequestTableModal({ itemId }: { itemId: string }) {
    const [data, setData] = useState<InternalRequisition | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    useEffect(() => {
        const handleGetItemById = async () => {
            try {
                const response = await internlRequestAPI.dataById(itemId);
                setData(response);
            } catch (error) {
                console.error("Error fetching requisition:", error);
            } finally {
                setLoading(false);
            }
        }
        if (itemId) handleGetItemById();
    }, [itemId])




    return (
        <Dialog>
            <DialogTrigger className=" hover:underline font-medium">
                View Details
            </DialogTrigger>
            <DialogContent className="w-full max-w-[90vw] sm:max-w-[90vw] max-h-[85vh] overflow-y-auto">
                {loading ? (
                    <div className="p-10 text-center">Loading details...</div>
                ) : data ? (
                    <>
                        <DialogHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <DialogTitle className="text-xl font-bold">{data.title}</DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Requisition ID: <span className="font-mono text-primary">{data.requisitionNumber}</span>
                                    </DialogDescription>
                                </div>
                                <div>
                                    <Button variant="outline" onClick={() => router.push(`/internal-requisitions/request/${data._id}`)}>
                                        view more details
                                    </Button>
                                </div>
                                <Badge variant={data.status === 'pending' ? 'outline' : 'default'} className="capitalize">
                                    {data.status}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Requested By</p>
                                <p className="font-medium">{data.user.name} ({data.user.department})</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-muted-foreground">Date Requested</p>
                                <p className="font-medium">{new Date(data.requestedOn).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <ScrollArea className="max-h-[50vh]">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.items.map((item) => (
                                            <TableRow key={item._id}>
                                                <TableCell className="font-medium">{item.description}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/20 font-bold">
                                            <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
                                            <TableCell className="text-right text-primary text-lg">
                                                {formatCurrency(data.totalAmount)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="p-4 rounded-lg bg-slate-50 border">
                                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Payment Details</h4>
                                <div className="space-y-1 text-sm">
                                    {data.accountToPay ? (
                                        <>
                                            <p><span className="text-muted-foreground">Account Name:</span> {data.accountToPay.accountName}</p>
                                            <p><span className="text-muted-foreground">Account Number:</span> {data.accountToPay.accountNumber}</p>
                                            <p><span className="text-muted-foreground">Bank:</span> {data.accountToPay.bankName}</p>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground">No account details</p>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-slate-50 border">
                                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Additional Info</h4>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Location:</span> {data.location}</p>
                                    <p><span className="text-muted-foreground">Category:</span> <span className="capitalize">{data.category}</span></p>
                                    <p><span className="text-muted-foreground">Attachments:</span> {data.attachments.length} file(s)</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-10 text-center text-red-500">Failed to load data.</div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default RequestTableModal