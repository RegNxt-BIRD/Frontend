import { SharedDataTable } from "@/components/SharedDataTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";

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
    <div className="space-y-2">
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(groupedData).map(([framework, items]) => (
          <AccordionItem
            value={framework}
            key={framework}
            className="border border-gray-200 rounded-md overflow-hidden mb-2"
          >
            <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-base">{framework}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3">
              <SharedDataTable
                data={items}
                columns={columns}
                onRowClick={onTableClick}
                showPagination={false}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
