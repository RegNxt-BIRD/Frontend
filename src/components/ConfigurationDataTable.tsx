import { SharedDataTable } from "@/components/SharedDataTable";
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

interface ConfigurationDataTableProps {
  data: Record<string, Record<string, DataItem[]>>;
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
  const flattenedData = useMemo(() => {
    return Object.entries(data).flatMap(([framework, groups]) =>
      Object.values(groups).flatMap((items) =>
        items.map((item) => ({ ...item, framework }))
      )
    );
  }, [data]);

  return (
    <SharedDataTable
      data={flattenedData}
      columns={columns}
      onRowClick={onRowClick}
      showPagination={true}
    />
  );
};
