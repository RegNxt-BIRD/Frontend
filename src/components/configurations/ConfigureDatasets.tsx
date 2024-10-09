import { SharedColumnFilters } from "@/components/SharedFilters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import DataSkeleton from "../skeletons/DataSkeleton";
import { DatasetAccordion } from "./DatasetAccordion";
import { DatasetFormModal } from "./DatasetFormModal";
import { FrameworkAccordion } from "./FrameworkAccordion";

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
  version_code: string;
  valid_from: string;
  valid_to: string | null;
  is_system_generated: boolean;
}

export const ConfigureDatasets: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasetVersions, setDatasetVersions] = useState<DatasetVersion[]>([]);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDatasetId, setDeletingDatasetId] = useState<number | null>(
    null
  );

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

  const groupedDatasets = useMemo(() => {
    return filteredDatasets.reduce((acc, dataset) => {
      if (!acc[dataset.framework]) {
        acc[dataset.framework] = [];
      }
      acc[dataset.framework].push(dataset);
      return acc;
    }, {} as Record<string, Dataset[]>);
  }, [filteredDatasets]);

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

  const handleCreateDataset = useCallback(
    async (newDataset: Partial<Dataset>) => {
      try {
        const response = await fastApiInstance.post("/api/v1/datasets/", {
          ...newDataset,
          is_system_generated: false, // Explicitly set is_system_generated to false
        });
        setDatasets([...datasets, response.data]);
        toast({
          title: "Success",
          description: "Dataset created successfully.",
        });
        setIsDatasetModalOpen(false); // Only close the modal on success
      } catch (error) {
        console.error("Error creating dataset:", error);
        toast({
          title: "Error",
          description: "Failed to create dataset. Please try again.",
          variant: "destructive",
        });
        // Do not close the modal on error
      }
    },
    [datasets, toast]
  );

  const handleUpdateDataset = useCallback(
    async (updatedDataset: Dataset) => {
      try {
        const response = await fastApiInstance.put(
          `/api/v1/datasets/${updatedDataset.dataset_id}/`,
          updatedDataset
        );
        setDatasets(
          datasets.map((d) =>
            d.dataset_id === updatedDataset.dataset_id ? response.data : d
          )
        );
        toast({
          title: "Success",
          description: "Dataset updated successfully.",
        });
        setIsDatasetModalOpen(false); // Only close the modal on success
        setEditingDataset(null);
      } catch (error) {
        console.error("Error updating dataset:", error);
        toast({
          title: "Error",
          description: "Failed to update dataset. Please try again.",
          variant: "destructive",
        });
        // Do not close the modal on error
      }
    },
    [datasets, toast]
  );

  const handleDeleteDataset = useCallback(async () => {
    if (!deletingDatasetId) return;
    try {
      await fastApiInstance.delete(`/api/v1/datasets/${deletingDatasetId}`);
      setDatasets(datasets.filter((d) => d.dataset_id !== deletingDatasetId));
      toast({ title: "Success", description: "Dataset deleted successfully." });
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast({
        title: "Error",
        description: "Failed to delete dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingDatasetId(null);
    }
  }, [deletingDatasetId, datasets, toast]);

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

  const handleEditVersion = useCallback(async (version: DatasetVersion) => {
    // Implement edit version functionality
    console.log("Edit version:", version);
  }, []);

  const handleDeleteVersion = useCallback(
    async (versionId: number) => {
      try {
        await fastApiInstance.delete(
          `/api/v1/datasets/${selectedDataset?.dataset_id}/versions/${versionId}`
        );
        setDatasetVersions(
          datasetVersions.filter((v) => v.dataset_version_id !== versionId)
        );
        toast({
          title: "Success",
          description: "Version deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting version:", error);
        toast({
          title: "Error",
          description: "Failed to delete version. Please try again.",
          variant: "destructive",
        });
      }
    },
    [selectedDataset, datasetVersions, toast]
  );

  const handleDatasetClick = useCallback(
    async (dataset: Dataset) => {
      setSelectedDataset(dataset);
      try {
        const response = await fastApiInstance.get<DatasetVersion[]>(
          `/api/v1/datasets/${dataset.dataset_id}/versions_all/`
        );
        setDatasetVersions(response.data);
      } catch (error) {
        console.error("Error fetching dataset versions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dataset versions. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  if (isLoading) return <DataSkeleton />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Configure Datasets</h2>
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
      {selectedFramework === NO_FILTER && selectedLayer === NO_FILTER ? (
        <FrameworkAccordion
          groupedDatasets={groupedDatasets}
          handleDatasetClick={handleDatasetClick}
          datasetVersions={datasetVersions}
          selectedDataset={selectedDataset}
          handleCreateVersion={handleCreateVersion}
          handleEditVersion={handleEditVersion}
          handleDeleteVersion={handleDeleteVersion}
        />
      ) : (
        <DatasetAccordion
          datasets={filteredDatasets}
          handleDatasetClick={handleDatasetClick}
          datasetVersions={datasetVersions}
          selectedDataset={selectedDataset}
          handleCreateVersion={handleCreateVersion}
          handleEditVersion={handleEditVersion}
          handleDeleteVersion={handleDeleteVersion}
        />
      )}

      <div className="mt-4">
        <Button onClick={() => setIsDatasetModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Dataset
        </Button>
      </div>

      <DatasetFormModal
        isOpen={isDatasetModalOpen}
        onClose={() => {
          // Only allow closing the modal manually if we're not in the middle of an operation
          if (!editingDataset) {
            setIsDatasetModalOpen(false);
          }
        }}
        onSubmit={(dataset) => {
          if (editingDataset) {
            handleUpdateDataset({ ...editingDataset, ...dataset } as Dataset);
          } else {
            handleCreateDataset(dataset);
          }
        }}
        initialData={editingDataset || undefined}
        frameworks={frameworksWithNoFilter}
        layers={layersWithNoFilter}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this dataset? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteDataset} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
