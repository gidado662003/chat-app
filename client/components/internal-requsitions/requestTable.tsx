import React, { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { formatCurrency } from "@/helper/currencyFormat"
import { formatDate } from '@/helper/dateFormat';
import { internlRequestAPI } from "@/lib/internalRequestApi"
import { InternalRequisition } from "@/lib/internalRequestTypes"
import RequestTableDropDown from "@/components/internal-requsitions/requestTableDropDown"
import { Badge } from '../ui/badge';
// import { PDFDownloader } from './PDFDownloader';
import { FileDown, X } from 'lucide-react';

type RequestTableProps = {
    data?: InternalRequisition[];
    hasMore?: boolean;
    onNext: () => void;
    onBack: () => void;
};

function RequestTable({ data, hasMore, onNext, onBack }: RequestTableProps) {

    const headers = [
        "",
        "S/N",
        "Date",
        "Title",
        "Department",
        "Location",
        "Category",
        "Status",
        "Amount Requested",
        "Actions",
    ];
    const [requestData, setRequestData] = useState<InternalRequisition[]>()
    const [selectedRequests, setSelectedRequests] = useState<InternalRequisition[]>([])
    const [showPDFDialog, setShowPDFDialog] = useState(false)

    useEffect(() => {
        if (data) {
            setRequestData(data)
        }
    }, [data])

    const handleSelectRequest = (request: InternalRequisition) => {
        const isAlreadySelected = selectedRequests.some((item) => item._id === request._id);

        if (isAlreadySelected) {
            // Deselect
            setSelectedRequests(selectedRequests.filter((item) => item._id !== request._id));
        } else {
            // Select (max 2)
            if (selectedRequests.length >= 2) {
                return; // Already have 2 selected
            }
            setSelectedRequests([...selectedRequests, request]);
        }
    };

    const clearSelection = () => {
        setSelectedRequests([])
        setShowPDFDialog(false)
    }

    return (
        <div>
            {/* Selection Bar */}
            {selectedRequests.length > 0 && (
                <div className="mb-4 bg-slate-900 text-white px-6 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-white text-slate-900 font-semibold">
                            {selectedRequests.length} / 2 selected
                        </Badge>
                        <span className="text-sm">
                            {selectedRequests.length === 2
                                ? "Maximum selection reached"
                                : "Select up to 2 documents for PDF"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearSelection}
                            className="text-white hover:bg-slate-800"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowPDFDialog(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            Generate PDF
                        </Button>
                    </div>
                </div>
            )}

            <Table>
                <TableCaption>A list of your recent requisitions.</TableCaption>
                <TableHeader>
                    <TableRow>
                        {headers.map((headers) => <TableHead key={headers}>{headers}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requestData && requestData.length > 0 ? (
                        requestData.map((data, index) => {
                            const isSelected = selectedRequests.some((item) => item._id === data._id)
                            const canSelect = selectedRequests.length < 2 || isSelected

                            return (
                                <TableRow
                                    key={data._id}
                                    className={isSelected ? 'bg-blue-50' : ''}
                                >
                                    <TableCell className="w-2">
                                        <Input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectRequest(data)}
                                            disabled={!canSelect}
                                            className="cursor-pointer disabled:opacity-50"
                                        />
                                    </TableCell>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{formatDate(data.requestedOn)}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={data.title}>
                                        {data.title}
                                    </TableCell>
                                    <TableCell>{data.department}</TableCell>
                                    <TableCell>{data.location || "Not specified"}</TableCell>
                                    <TableCell className="capitalize">{data.category}</TableCell>
                                    <TableCell>
                                        <Badge variant={data.status === 'approved' ? 'default' : 'outline'}>
                                            {data.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatCurrency(data.totalAmount)}
                                    </TableCell>
                                    <TableCell>
                                        <RequestTableDropDown itemId={data._id} />
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                No requisitions found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={11} className="p-0">
                            <div className="flex items-center justify-end gap-4 p-4 bg-gray-50/50">
                                <Button
                                    onClick={onBack}
                                    className="cursor-pointer px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={onNext}
                                    disabled={!hasMore}
                                    className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Next
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>

            {/* PDF Downloader Modal */}
            {/* {showPDFDialog && (
                <PDFDownloader
                    selectedDocuments={selectedRequests}
                    onClose={clearSelection}
                />
            )} */}
        </div>
    )
}

export default RequestTable
