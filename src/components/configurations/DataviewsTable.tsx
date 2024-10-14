import { SharedDataTable } from "@/components/SharedDataTable";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";

interface Dataview {
  id: number;
  name: string;
  description: string;
  baseDataset: string;
}

interface DataviewsTableProps {
  dataviews: Dataview[];
}

const dataviewColumns: ColumnDef<Dataview>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "baseDataset",
    header: "Base Dataset",
  },
];

export const DataviewsTable: React.FC<DataviewsTableProps> = ({
  dataviews,
}) => {
  return (
    <div className="space-y-4">
      <SharedDataTable
        data={dataviews}
        columns={dataviewColumns}
        onRowClick={() => {}}
        showPagination={true}
      />
      <Button onClick={() => console.log("Create new dataview")}>
        Create New Dataview
      </Button>
    </div>
  );
};
