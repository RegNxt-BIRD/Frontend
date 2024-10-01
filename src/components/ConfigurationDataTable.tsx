import { SharedDataTable } from "@/components/SharedDataTable";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";

interface DataItem {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
}

interface ConfigurationDataTableProps {
  data: DataItem[];
  onRowClick: (row: DataItem) => void;
}

const columns: ColumnDef<DataItem>[] = [
  {
    accessorKey: "framework",
    header: "Framework",
    cell: ({ row }) => <div>{row.getValue("framework")}</div>,
  },
  {
    accessorKey: "type",
    header: "Layer/Type",
    cell: ({ row }) => <div>{row.getValue("type")}</div>,
  },
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
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div>{row.getValue("description")}</div>,
  },
];

export const ConfigurationDataTable: React.FC<ConfigurationDataTableProps> = ({
  data,
  onRowClick,
}) => {
  return (
    <SharedDataTable
      data={data}
      columns={columns}
      onRowClick={onRowClick}
      showPagination={true}
    />
  );
};
