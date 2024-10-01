import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  dataSetId: number;
  category: string;
  businessId: string;
  code: string;
  name: string;
  description: string;
  maintenanceAgency: string;
  framework: string;
  version: string;
  entityType: string;
}

interface DataAccordionProps {
  data: DataItem[];
  onTableClick: (item: DataItem) => void;
}

const ALL_FRAMEWORKS = "ALL";

const columns: ColumnDef<DataItem>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => <div>{row.getValue("code")}</div>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "entityType",
    header: "Entity Type",
    cell: ({ row }) => <div>{row.getValue("entityType")}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div>{row.getValue("description")}</div>,
  },
  {
    accessorKey: "maintenanceAgency",
    header: "Maintenance Agency",
    cell: ({ row }) => <div>{row.getValue("maintenanceAgency")}</div>,
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => <div>{row.getValue("version")}</div>,
  },
];

export const DataAccordion: React.FC<DataAccordionProps> = ({
  data,
  onTableClick,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState(ALL_FRAMEWORKS);

  const frameworks = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.framework)));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesGlobal = Object.values(item).some(
        (val) =>
          val &&
          val.toString().toLowerCase().includes(globalFilter.toLowerCase())
      );
      const matchesFramework =
        frameworkFilter === ALL_FRAMEWORKS ||
        item.framework === frameworkFilter;
      return matchesGlobal && matchesFramework;
    });
  }, [data, globalFilter, frameworkFilter]);

  const groupedData = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      if (!acc[item.framework]) {
        acc[item.framework] = [];
      }
      acc[item.framework].push(item);
      return acc;
    }, {} as Record<string, DataItem[]>);
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Input
          placeholder="Search all fields..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FRAMEWORKS}>All Frameworks</SelectItem>
            {frameworks.map((framework) => (
              <SelectItem key={framework} value={framework}>
                {framework}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                    {header.column.getCanFilter() ? (
                      <div>
                        <Input
                          value={
                            (header.column.getFilterValue() ?? "") as string
                          }
                          onChange={(event) =>
                            header.column.setFilterValue(event.target.value)
                          }
                          placeholder={`Filter ${header.column.id}`}
                          className="max-w-sm mt-2"
                        />
                      </div>
                    ) : null}
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
