import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TableColumn = {
  /** Unique key used to read from each row object */
  key: string;
  /** Header label to display */
  label: string;
  /** Optional extra classes for the header cell */
  className?: string;
};

export type TableRowData = {
  [key: string]: React.ReactNode;
};

export interface DataTableProps {
  /** Column configuration for the table */
  columns: TableColumn[];
  /** Array of row objects. Values can be plain text or JSX */
  data: TableRowData[];
  /** Optional function to generate a unique key per row */
  getRowKey?: (row: TableRowData, index: number) => React.Key;
  /** Optional message when there is no data */
  emptyMessage?: string;
  /** Apply zebra striping to rows */
  striped?: boolean;
}

export function DataTable({
  columns,
  data,
  getRowKey,
  emptyMessage = "No data available",
  striped = false,
}: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`font-semibold ${column.className ?? ""}`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={getRowKey ? getRowKey(row, index) : index}
              className={
                striped && index % 2 === 0 ? "bg-muted/20" : undefined
              }
            >
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {row[column.key] ?? ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

