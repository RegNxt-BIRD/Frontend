import { SharedDataTable } from "@/components/SharedDataTable";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";

interface Dataset {
  id: number;
  name: string;
  isSystemGenerated: boolean;
}

interface Version {
  id: number;
  datasetId: number;
  version: string;
}

interface Column {
  id: number;
  versionId: number;
  name: string;
  isSystemGenerated: boolean;
}

interface DatasetsTableProps {
  datasets: Dataset[];
  versions: Version[];
  columns: Column[];
}

const datasetColumns: ColumnDef<Dataset>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "isSystemGenerated",
    header: "System Generated",
    cell: ({ row }) => (
      <div>{row.getValue("isSystemGenerated") ? "Yes" : "No"}</div>
    ),
  },
];

const versionColumns: ColumnDef<Version>[] = [
  {
    accessorKey: "version",
    header: "Version",
  },
];

const columnColumns: ColumnDef<Column>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "isSystemGenerated",
    header: "System Generated",
    cell: ({ row }) => (
      <div>{row.getValue("isSystemGenerated") ? "Yes" : "No"}</div>
    ),
  },
];

export const DatasetsTable: React.FC<DatasetsTableProps> = ({
  datasets,
  versions,
  columns,
}) => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Datasets</h3>
        <SharedDataTable
          data={datasets}
          columns={datasetColumns}
          onRowClick={setSelectedDataset}
          showPagination={false}
        />
        <div className="mt-2">
          <Button onClick={() => console.log("Create dataset")}>
            Create Dataset
          </Button>
          {selectedDataset && !selectedDataset.isSystemGenerated && (
            <>
              <Button onClick={() => console.log("Edit dataset")}>
                Edit Dataset
              </Button>
              <Button onClick={() => console.log("Create new version")}>
                Create New Version
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedDataset && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Versions</h3>
          <SharedDataTable
            data={versions.filter((v) => v.datasetId === selectedDataset.id)}
            columns={versionColumns}
            onRowClick={setSelectedVersion}
            showPagination={false}
          />
        </div>
      )}

      {selectedVersion && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Columns</h3>
          <SharedDataTable
            data={columns.filter((c) => c.versionId === selectedVersion.id)}
            columns={columnColumns}
            onRowClick={() => {}}
            showPagination={false}
          />
          <div className="mt-2">
            <Button onClick={() => console.log("Add new column")}>
              Add New Column
            </Button>
            {!selectedVersion.isSystemGenerated && (
              <Button onClick={() => console.log("Edit column")}>
                Edit Column
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
