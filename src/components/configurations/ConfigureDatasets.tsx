// ConfigureDatasets.tsx
import { SharedDataTable } from "@/components/SharedDataTable";
import { SharedColumnFilters } from "@/components/SharedFilters";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { Frameworks, Layers } from "@/types/databaseTypes";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import DataSkeleton from "../skeletons/DataSkeleton";

const NO_FILTER = "NO_FILTER";

interface Dataset {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
  is_system_generated: boolean;
}

interface DatasetVersion {
  dataset_version_id: number;
  dataset_id: number;
  version_nr: string;
  valid_from: string;
  valid_to: string | null;
}

interface DatasetVersionColumn {
  dataset_version_column_id: number;
  dataset_version_id: number;
  column_order: number;
  code: string;
  label: string;
  description: string;
  role: string;
  dimension_type: string;
  datatype: string;
  datatype_format: string;
  is_mandatory: boolean;
  is_key: boolean;
  value_statement: string;
  is_filter: boolean;
  is_report_snapshot_field: boolean;
  is_system_generated: boolean;
}

export const ConfigureDatasets: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasetVersions, setDatasetVersions] = useState<DatasetVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(
    null
  );
  const [columns, setColumns] = useState<DatasetVersionColumn[]>([]);

  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [columnFilters, setColumnFilters] = useState({
    code: "",
    label: "",
    framework: "",
    type: "",
    description: "",
  });
  const { toast } = useToast();
  const { data: layers, error: layersError } = useSWR<Layers>(
    "/api/v1/layers/",
    fastApiInstance
  );
  const { data: frameworks, error: frameworksError } = useSWR<Frameworks>(
    "/api/v1/frameworks/",
    fastApiInstance
  );
  const { data: dataTableJson, error: dataError } = useSWR<any>(
    "/api/v1/datasets/",
    fastApiInstance
  );

  const isLoading = !layers || !frameworks || !dataTableJson;
  const error = layersError || frameworksError || dataError;

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (dataTableJson?.data) {
      setDatasets(dataTableJson.data);
    }
  }, [dataTableJson]);

  const datasetColumns: ColumnDef<Dataset>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "label", header: "Label" },
    { accessorKey: "framework", header: "Framework" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "is_system_generated",
      header: "System Generated",
      cell: ({ row }) => (row.getValue("is_system_generated") ? "Yes" : "No"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {!row.original.is_system_generated && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditDataset(row.original)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDataset(row.original.dataset_id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateVersion(row.original)}
          >
            <Plus className="h-4 w-4" /> Version
          </Button>
        </div>
      ),
    },
  ];

  const versionColumns: ColumnDef<DatasetVersion>[] = [
    { accessorKey: "version_nr", header: "Version" },
    { accessorKey: "valid_from", header: "Valid From" },
    { accessorKey: "valid_to", header: "Valid To" },
  ];

  const columnColumns: ColumnDef<DatasetVersionColumn>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "label", header: "Label" },
    { accessorKey: "datatype", header: "Data Type" },
    {
      accessorKey: "is_mandatory",
      header: "Mandatory",
      cell: ({ row }) => (row.getValue("is_mandatory") ? "Yes" : "No"),
    },
    {
      accessorKey: "is_key",
      header: "Key",
      cell: ({ row }) => (row.getValue("is_key") ? "Yes" : "No"),
    },
    {
      accessorKey: "is_system_generated",
      header: "System Generated",
      cell: ({ row }) => (row.getValue("is_system_generated") ? "Yes" : "No"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {!row.original.is_system_generated && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditColumn(row.original)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDeleteColumn(row.original.dataset_version_column_id)
                }
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const frameworkMatch =
        selectedFramework === NO_FILTER ||
        dataset.framework === selectedFramework;
      const layerMatch =
        selectedLayer === NO_FILTER || dataset.type === selectedLayer;
      const columnFilterMatch = Object.entries(columnFilters).every(
        ([key, value]) =>
          value === "" ||
          dataset[key as keyof Dataset]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
      );
      return frameworkMatch && layerMatch && columnFilterMatch;
    });
  }, [datasets, selectedFramework, selectedLayer, columnFilters]);

  const layersWithNoFilter = useMemo(
    () => [
      { code: NO_FILTER, name: "No Layer Selected" },
      ...(layers?.data || []),
    ],
    [layers]
  );
  const frameworksWithNoFilter = useMemo(
    () => [
      { code: NO_FILTER, name: "No Framework Selected" },
      ...(frameworks?.data || []),
    ],
    [frameworks]
  );

  const handleFrameworkChange = useCallback((value: string) => {
    setSelectedFramework(value);
    setSelectedDataset(null);
  }, []);

  const handleLayerChange = useCallback((value: string) => {
    setSelectedLayer(value);
    setSelectedDataset(null);
  }, []);

  const handleCreateDataset = useCallback(async () => {
    try {
      const response = await fastApiInstance.post("/api/v1/datasets/", {
        code: `DS00${datasets.length + 1}`,
        label: `New Dataset ${datasets.length + 1}`,
        description: "New dataset description",
        framework: selectedFramework === NO_FILTER ? "" : selectedFramework,
        type: selectedLayer === NO_FILTER ? "" : selectedLayer,
        is_system_generated: false,
      });
      setDatasets([...datasets, response.data]);
      toast({ title: "Success", description: "Dataset created successfully." });
    } catch (error) {
      console.error("Error creating dataset:", error);
      toast({
        title: "Error",
        description: "Failed to create dataset. Please try again.",
        variant: "destructive",
      });
    }
  }, [datasets, selectedFramework, selectedLayer, toast]);

  const handleEditDataset = useCallback(async (dataset: Dataset) => {
    // Implement edit dataset functionality
    console.log("Edit dataset:", dataset);
  }, []);

  const handleDeleteDataset = useCallback(
    async (datasetId: number) => {
      try {
        await fastApiInstance.delete(`/api/v1/datasets/${datasetId}`);
        setDatasets(datasets.filter((d) => d.dataset_id !== datasetId));
        toast({
          title: "Success",
          description: "Dataset deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting dataset:", error);
        toast({
          title: "Error",
          description: "Failed to delete dataset. Please try again.",
          variant: "destructive",
        });
      }
    },
    [datasets, toast]
  );

  const handleCreateVersion = useCallback(
    async (dataset: Dataset) => {
      try {
        const response = await fastApiInstance.post(
          `/api/v1/datasets/${dataset.dataset_id}/versions/`,
          {
            version_nr: `${datasetVersions.length + 1}.0`,
            valid_from: new Date().toISOString().split("T")[0],
          }
        );
        setDatasetVersions([...datasetVersions, response.data]);
        toast({
          title: "Success",
          description: "Version created successfully.",
        });
      } catch (error) {
        console.error("Error creating version:", error);
        toast({
          title: "Error",
          description: "Failed to create version. Please try again.",
          variant: "destructive",
        });
      }
    },
    [datasetVersions, toast]
  );

  const handleAddColumn = useCallback(async () => {
    if (!selectedVersion) return;
    try {
      const response = await fastApiInstance.post(
        `/api/v1/datasets/${selectedDataset?.dataset_id}/columns/`,
        {
          dataset_version_id: selectedVersion.dataset_version_id,
          code: `COL_${columns.length + 1}`,
          label: `New Column ${columns.length + 1}`,
          description: "New column description",
          datatype: "VARCHAR",
          is_mandatory: false,
          is_key: false,
          is_system_generated: false,
        }
      );
      setColumns([...columns, response.data]);
      toast({ title: "Success", description: "Column added successfully." });
    } catch (error) {
      console.error("Error adding column:", error);
      toast({
        title: "Error",
        description: "Failed to add column. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedVersion, selectedDataset, columns, toast]);

  const handleEditColumn = useCallback(async (column: DatasetVersionColumn) => {
    // Implement edit column functionality
    console.log("Edit column:", column);
  }, []);

  const handleDeleteColumn = useCallback(
    async (columnId: number) => {
      try {
        await fastApiInstance.delete(
          `/api/v1/datasets/${selectedDataset?.dataset_id}/columns/${columnId}`
        );
        setColumns(
          columns.filter((c) => c.dataset_version_column_id !== columnId)
        );
        toast({
          title: "Success",
          description: "Column deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting column:", error);
        toast({
          title: "Error",
          description: "Failed to delete column. Please try again.",
          variant: "destructive",
        });
      }
    },
    [selectedDataset, columns, toast]
  );
  if (isLoading) return <DataSkeleton />;
  return (
    <div className="space-y-4">
      <div className="flex space-x-4 mb-4">
        <Select onValueChange={handleFrameworkChange} value={selectedFramework}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Framework" />
          </SelectTrigger>
          <SelectContent>
            {frameworksWithNoFilter.map((framework) => (
              <SelectItem key={framework.code} value={framework.code}>
                {framework.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleLayerChange} value={selectedLayer}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Layer" />
          </SelectTrigger>
          <SelectContent>
            {layersWithNoFilter.map((layer) => (
              <SelectItem key={layer.code} value={layer.code}>
                {layer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SharedColumnFilters
        filters={columnFilters}
        setFilter={(key, value) =>
          setColumnFilters((prev) => ({ ...prev, [key]: value }))
        }
      />
      <div>
        <h3 className="text-lg font-semibold mb-2">Datasets</h3>
        <SharedDataTable
          data={filteredDatasets}
          columns={datasetColumns}
          onRowClick={(dataset) => {
            setSelectedDataset(dataset);
            setSelectedVersion(null);
          }}
        />
        <div className="mt-2">
          <Button onClick={handleCreateDataset}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
        </div>
      </div>
      {selectedDataset && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Versions for {selectedDataset.label}
          </h3>
          <SharedDataTable
            data={datasetVersions.filter(
              (v) => v.dataset_id === selectedDataset.dataset_id
            )}
            columns={versionColumns}
            onRowClick={(version) => {
              setSelectedVersion(version);
            }}
          />
          {!selectedDataset.is_system_generated && (
            <div className="mt-2">
              <Button onClick={() => handleCreateVersion(selectedDataset)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Version
              </Button>
            </div>
          )}
        </div>
      )}
      {selectedVersion && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Columns for Version {selectedVersion.version_nr}
          </h3>
          <SharedDataTable
            data={columns.filter(
              (c) => c.dataset_version_id === selectedVersion.dataset_version_id
            )}
            columns={columnColumns}
            onRowClick={() => {}}
          />
          <div className="mt-2">
            <Button onClick={handleAddColumn}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Column
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
