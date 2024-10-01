import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo, useState } from "react";

interface DataItem {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
}

interface DataAccordionProps {
  data: DataItem[];
  onTableClick: (item: DataItem) => void;
}

const columns: ColumnDef<DataItem>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => <div>{row.getValue("code")}</div>,
  },
  {
    accessorKey: "label",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("label")}</div>,
  },
  {
    accessorKey: "type",
    header: "Entity Type",
    cell: ({ row }) => <div>{row.getValue("type")}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div>{row.getValue("description")}</div>,
  },
];

export const DataAccordion: React.FC<DataAccordionProps> = ({
  data,
  onTableClick,
}) => {
  const groupedData = useMemo(() => {
    return data.reduce((acc, item) => {
      if (!acc[item.framework]) {
        acc[item.framework] = [];
      }
      acc[item.framework].push(item);
      return acc;
    }, {} as Record<string, DataItem[]>);
  }, [data]);

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full space-y-2">
        {Object.entries(groupedData).map(([framework, items]) => (
          <AccordionItem value={framework} key={framework}>
            <AccordionTrigger className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
              <span className="font-semibold">{framework}</span>
              <span className="ml-2 text-sm text-gray-500">
                ({items.length} items)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <DataTable
                data={items}
                columns={columns}
                onRowClick={onTableClick}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

function DataTable({
  data,
  columns,
  onRowClick,
}: {
  data: DataItem[];
  columns: ColumnDef<DataItem>[];
  onRowClick: (item: DataItem) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows?.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick(row.original)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
