import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Datasets,
  DatasetVersion,
  Frameworks,
  Layers,
} from "@/types/databaseTypes";
import { Plus } from "lucide-react";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { ConfirmDialog } from "./ConfirmDialog";
import { DatasetAccordion } from "./DatasetAccordion";
import { DatasetFormModal } from "./DatasetFormModal";

const NO_FILTER = "NO_FILTER";

export const ConfigureDatasets: React.FC = () => {
  const { toast } = useToast();
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDatasetId, setDeletingDatasetId] = useState<number | null>(
    null
  );
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const { data: layers } = useSWR<Layers>("/api/v1/layers/", fastApiInstance);
  const { data: frameworks } = useSWR<Frameworks>(
    "/api/v1/frameworks/",
    fastApiInstance
  );
  const { data: datasets, mutate: mutateDatasets } = useSWR<Datasets>(
    "/api/v1/datasets/",
    fastApiInstance
  );
  const {
    data: datasetVersions,
    mutate: mutateVersions,
    isValidating: isLoadingVersions,
  } = useSWR<DatasetVersion[]>(
    selectedDataset
      ? `/api/v1/datasets/${selectedDataset.dataset_id}/versions_all/`
      : null,
    fastApiInstance
  );

  const filteredDatasets = useMemo(() => {
    return (
      datasets?.data?.filter((dataset) => {
        const frameworkMatch =
          selectedFramework === NO_FILTER ||
          dataset.framework === selectedFramework;
        const layerMatch =
          selectedLayer === NO_FILTER || dataset.type === selectedLayer;
        const searchMatch =
          dataset.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dataset.code.toLowerCase().includes(searchTerm.toLowerCase());
        return frameworkMatch && layerMatch && searchMatch;
      }) || []
    );
  }, [datasets, selectedFramework, selectedLayer, searchTerm]);

  const handleCreateOrUpdateDataset = async (newDataset: Partial<Dataset>) => {
    try {
      if (editingDataset) {
        await fastApiInstance.put(
          `/api/v1/datasets/${editingDataset.dataset_id}/`,
          newDataset
        );
        toast({
          title: "Success",
          description: "Dataset updated successfully.",
        });
      } else {
        await fastApiInstance.post("/api/v1/datasets/", {
          ...newDataset,
          is_system_generated: false,
        });
        toast({
          title: "Success",
          description: "Dataset created successfully.",
        });
      }
      await mutateDatasets();
      setIsDatasetModalOpen(false);
      setEditingDataset(null);
    } catch (error) {
      console.error("Error creating/updating dataset:", error);
      toast({
        title: "Error",
        description: "Failed to create/update dataset. Please try again.",
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

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Configure Datasets</h2>

        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <Select
            onValueChange={setSelectedFramework}
            value={selectedFramework}
          >
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Select a Framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>All Frameworks</SelectItem>
              {frameworks?.data?.map((framework) => (
                <SelectItem key={framework.code} value={framework.code}>
                  {framework.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedLayer} value={selectedLayer}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Select a Layer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER}>All Layers</SelectItem>
              {layers?.data?.map((layer) => (
                <SelectItem key={layer.code} value={layer.code}>
                  {layer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[300px]"
          />
        </div>

        <Button onClick={() => setIsDatasetModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Dataset
        </Button>

        <DatasetAccordion
          datasets={filteredDatasets}
          handleDatasetClick={setSelectedDataset}
          datasetVersions={datasetVersions || []}
          selectedDataset={selectedDataset}
          handleCreateVersion={(dataset) => {
            /* Implement create version logic */
          }}
          handleUpdateVersion={(version) => {
            /* Implement update version logic */
          }}
          handleDeleteVersion={(datasetId, versionId) => {
            /* Implement delete version logic */
          }}
          handleEditDataset={(dataset) => {
            setEditingDataset(dataset);
            setIsDatasetModalOpen(true);
          }}
          handleDeleteDataset={(datasetId) => {
            setDeletingDatasetId(datasetId);
            setIsDeleteDialogOpen(true);
          }}
          isLoadingVersions={isLoadingVersions}
        />

        <DatasetFormModal
          isOpen={isDatasetModalOpen}
          onClose={() => {
            setIsDatasetModalOpen(false);
            setEditingDataset(null);
          }}
          onSubmit={handleCreateOrUpdateDataset}
          initialData={editingDataset || undefined}
          frameworks={frameworks?.data || []}
          layers={layers?.data || []}
        />

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteDataset}
          title="Confirm Deletion"
          message="Are you sure you want to delete this dataset? This action cannot be undone."
        />
      </CardContent>
    </Card>
  );
};
