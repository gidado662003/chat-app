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

import { Button } from '../ui/button';
import { formatCurrency } from "@/helper/currencyFormat"
import { formatDate } from '@/helper/dateFormat';
import { internlRequestAPI } from "@/lib/internalRequestApi"
import { InternalRequisition } from "@/lib/internalRequestTypes"
import RequestTableDropDown from "@/components/internal-requsitions/requestTableDropDown"

type RequestTableProps = {
    data?: InternalRequisition[];
    hasMore?: boolean;
    onNext: () => void;
    onBack: () => void;
};

function RequestTable({ data, hasMore, onNext, onBack }: RequestTableProps) {

    const headers = [
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

    useEffect(() => {
        if (data) {
            setRequestData(data)
        }
    }, [data])
    return (
        <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
                <TableRow>
                    {headers.map((headers) => <TableHead key={headers}>{headers}</TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>

                {requestData?.map((data, index,) => (
                    <TableRow key={data._id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(data.requestedOn)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={data.title}>
                            {data.title}
                        </TableCell>
                        <TableCell>{data.department}</TableCell>
                        <TableCell>{data.location || "Not specified"}</TableCell>
                        <TableCell>{data.category}</TableCell>
                        <TableCell>{data.status}</TableCell>
                        <TableCell>{formatCurrency(data.totalAmount)}</TableCell>
                        <TableCell><RequestTableDropDown itemId={data._id} /></TableCell>
                    </TableRow>

                ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={11} className="p-0">
                        <div className="flex items-center justify-end gap-4 p-4 bg-gray-50/50">
                            <Button onClick={onBack} className="cursor-pointer px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50">
                                Back
                            </Button>
                            <Button onClick={onNext} disabled={!hasMore} className={` cursor-pointer px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors`}>
                                Next
                            </Button >
                        </div>
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
}

export default RequestTable