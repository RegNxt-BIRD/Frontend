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
import {
  Dataset,
  DatasetVersion,
  Framework,
  Layer,
} from "@/types/databaseTypes";
import { Plus } from "lucide-react";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import DataSkeleton from "../skeletons/DataSkeleton";
import { DatasetAccordion } from "./DatasetAccordion";
import { DatasetFormModal } from "./DatasetFormModal";
import { FrameworkAccordion } from "./FrameworkAccordion";

const NO_FILTER = "NO_FILTER";

export const ConfigureDatasets: React.FC = () => {
  const { toast } = useToast();
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [columnFilters, setColumnFilters] = useState({
    code: "",
    label: "",
    framework: "",
    type: "",
    description: "",
  });

  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDatasetId, setDeletingDatasetId] = useState<number | null>(
    null
  );
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const { data: layers, error: layersError } = useSWR<Layer[]>(
    "/api/v1/layers/",
    fastApiInstance
  );
  const { data: frameworks, error: frameworksError } = useSWR<Framework[]>(
    "/api/v1/frameworks/",
    fastApiInstance
  );
  const {
    data: datasets,
    error: datasetsError,
    mutate: mutateDatasets,
  } = useSWR<Dataset[]>("/api/v1/datasets/", fastApiInstance);

  const {
    data: datasetVersions,
    error: versionsError,
    mutate: mutateVersions,
    isValidating: isLoadingVersions,
  } = useSWR<DatasetVersion[]>(
    selectedDataset
      ? `/api/v1/datasets/${selectedDataset.dataset_id}/versions_all/`
      : null,
    fastApiInstance
  );

  const isLoading = !layers || !frameworks || !datasets;
  const error =
    layersError || frameworksError || datasetsError || versionsError;

  // Filtered and grouped datasets
  const filteredDatasets = useMemo(() => {
    return (
      (datasets &&
        datasets?.data?.filter((dataset) => {
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
        })) ||
      []
    );
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

  // Handlers
  const handleCreateDataset = async (newDataset: Partial<Dataset>) => {
    try {
      console.log("newDataset: ", newDataset);
      await fastApiInstance.post("/api/v1/datasets/", {
        ...newDataset,
        is_system_generated: false,
      });
      await mutateDatasets();
      toast({ title: "Success", description: "Dataset created successfully." });
      setIsDatasetModalOpen(false);
    } catch (error) {
      console.error("Error creating dataset:", error);
      toast({
        title: "Error",
        description: "Failed to create dataset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDataset = async (updatedDataset: Dataset) => {
    if (updatedDataset.is_system_generated) return;
    try {
      await fastApiInstance.put(
        `/api/v1/datasets/${updatedDataset.dataset_id}/`,
        updatedDataset
      );
      await mutateDatasets();
      toast({ title: "Success", description: "Dataset updated successfully." });
      setIsDatasetModalOpen(false);
      setEditingDataset(null);
    } catch (error) {
      console.error("Error updating dataset:", error);
      toast({
        title: "Error",
        description: "Failed to update dataset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDataset = async () => {
    if (!deletingDatasetId) return;
    try {
      await fastApiInstance.delete(`/api/v1/datasets/${deletingDatasetId}/`);
      await mutateDatasets();
      toast({ title: "Success", description: "Dataset deleted successfully." });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast({
        title: "Error",
        description: "Failed to delete dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingDatasetId(null);
    }
  };

  const handleCreateVersion = async (dataset: Dataset) => {
    if (dataset.is_system_generated) return;
    try {
      await fastApiInstance.post(
        `/api/v1/datasets/${dataset.dataset_id}/create_version/`,
        {
          version_nr: dataset.version_nr,
          version_code: dataset.version_code,
          code: dataset.code,
          label: dataset.label,
          description: dataset.description,
          valid_to: dataset.valid_to,
          valid_from: dataset.valid_from,
        }
      );
      await mutateVersions();
      toast({ title: "Success", description: "Version created successfully." });
    } catch (error) {
      console.error("Error creating version:", error);
      toast({
        title: "Error",
        description: "Failed to create version. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVersion = async (version: DatasetVersion) => {
    try {
      await fastApiInstance.put(
        `/api/v1/datasets/${version.dataset_id}/update_version/?version_id=${version.dataset_version_id}`,
        version
      );
      await mutateVersions();
      toast({ title: "Success", description: "Version updated successfully." });
    } catch (error) {
      console.error("Error updating version:", error);
      toast({
        title: "Error",
        description: "Failed to update version. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVersion = async (datasetId: number, versionId: number) => {
    try {
      await fastApiInstance.delete(
        `/api/v1/datasets/${datasetId}/delete_version/?version_id=${versionId}`
      );
      await mutateVersions();
      toast({ title: "Success", description: "Version deleted successfully." });
    } catch (error) {
      console.error("Error deleting version:", error);
      toast({
        title: "Error",
        description: "Failed to delete version. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleEditDataset = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setIsDatasetModalOpen(true);
  };

  if (isLoading) return <DataSkeleton />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Configure Datasets</h2>

      <div className="flex space-x-4 mb-4">
        <Select onValueChange={setSelectedFramework} value={selectedFramework}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_FILTER}>No Framework Selected</SelectItem>
            {frameworks?.data?.map((framework) => (
              <SelectItem key={framework.code} value={framework.code}>
                {framework.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedLayer} value={selectedLayer}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Layer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_FILTER}>No Layer Selected</SelectItem>
            {layers?.data?.map((layer) => (
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

      <div className="mt-4">
        <Button onClick={() => setIsDatasetModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Dataset
        </Button>
      </div>

      {selectedFramework === NO_FILTER && selectedLayer === NO_FILTER ? (
        <FrameworkAccordion
          groupedDatasets={groupedDatasets}
          handleDatasetClick={setSelectedDataset}
          datasetVersions={datasetVersions || []}
          selectedDataset={selectedDataset}
          handleEditDataset={handleEditDataset}
          handleUpdateVersion={handleUpdateVersion}
          isLoadingVersions={isLoadingVersions}
          handleCreateVersion={handleCreateVersion}
          handleDeleteVersion={handleDeleteVersion}
          handleDeleteDataset={(datasetId) => {
            setDeletingDatasetId(datasetId);
            setIsDeleteDialogOpen(true);
          }}
        />
      ) : (
        <DatasetAccordion
          datasets={filteredDatasets}
          handleDatasetClick={setSelectedDataset}
          datasetVersions={datasetVersions || []}
          handleEditDataset={handleEditDataset}
          isLoadingVersions={isLoadingVersions}
          selectedDataset={selectedDataset}
          handleCreateVersion={handleCreateVersion}
          handleUpdateVersion={handleUpdateVersion}
          handleDeleteVersion={handleDeleteVersion}
          handleDeleteDataset={(datasetId) => {
            setDeletingDatasetId(datasetId);
            setIsDeleteDialogOpen(true);
          }}
        />
      )}

      <DatasetFormModal
        isOpen={isDatasetModalOpen}
        onClose={() => {
          setIsDatasetModalOpen(false);
          setEditingDataset(null);
        }}
        onSubmit={(dataset) => {
          if (editingDataset) {
            handleUpdateDataset({ ...editingDataset, ...dataset } as Dataset);
          } else {
            handleCreateDataset(dataset);
          }
        }}
        initialData={editingDataset || undefined}
        frameworks={frameworks?.data || []}
        layers={layers?.data || []}
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
