import { SharedDataTable } from "@/components/SharedDataTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";

interface DataItem {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
}

interface DataAccordionProps {
  data: Record<string, Record<string, DataItem[]>>;
  onTableClick: (item: DataItem) => void;
  selectedFramework: string;
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

const ITEMS_PER_PAGE = 10;

export const DataAccordion: React.FC<DataAccordionProps> = ({
  data,
  onTableClick,
  selectedFramework,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const frameworks = Object.keys(data);
  const totalPages = Math.ceil(frameworks.length / ITEMS_PER_PAGE);
  const paginatedFrameworks = frameworks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderFrameworks =
    selectedFramework !== "NO_FILTER"
      ? [selectedFramework]
      : paginatedFrameworks;

  return (
    <div>
      <Accordion type="single" collapsible className="w-full">
        {renderFrameworks.map((framework) => (
          <AccordionItem
            key={framework}
            value={framework}
            className="border border-gray-200 rounded-md overflow-hidden mb-2"
          >
            <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-base">{framework}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-md text-gray-600 mx-auto">
                    {Object.values(data[framework]).reduce(
                      (acc, items) => acc + items.length,
                      0
                    )}{" "}
                    item(s)
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(data[framework]).map(([group, items]) => (
                  <AccordionItem key={group} value={group}>
                    <AccordionTrigger className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{group}</span>
                        <span className="text-sm text-gray-600">
                          {items.length} item(s)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <SharedDataTable
                        data={items}
                        columns={columns}
                        onRowClick={onTableClick}
                        showPagination={true}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
