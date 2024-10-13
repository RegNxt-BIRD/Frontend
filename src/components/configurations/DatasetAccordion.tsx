import { SharedDataTable } from "@/components/SharedDataTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dataset,
  DatasetVersion,
  DatasetVersions,
} from "@/types/databaseTypes";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Edit, Plus, Trash } from "lucide-react";
import React, { useMemo, useState } from "react";
import { DatasetVersionColumns } from "./DatasetVersionColumns";
import { DatasetVersionFormModal } from "./DatasetVersionFormModal";

interface DatasetAccordionProps {
  datasets: Dataset[];
  handleDatasetClick: (dataset: Dataset) => void;
  datasetVersions?: DatasetVersions;
  selectedDataset: Dataset | null;
  handleCreateVersion: (dataset: Dataset) => void;
  handleUpdateVersion: (version: DatasetVersion) => void;
  handleDeleteVersion: (datasetId: number, versionId: number) => void;
  handleEditDataset: (dataset: Dataset) => void;
  handleDeleteDataset: (datasetId: number) => void;
  isLoadingVersions: boolean;
}

const DATASETS_PER_PAGE = 10;

export const DatasetAccordion: React.FC<DatasetAccordionProps> = ({
  datasets,
  handleDatasetClick,
  datasetVersions,
  selectedDataset,
  handleCreateVersion,
  handleUpdateVersion,
  handleDeleteVersion,
  handleEditDataset,
  handleDeleteDataset,
  isLoadingVersions,
}) => {
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<DatasetVersion | null>(
    null
  );
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(datasets.length / DATASETS_PER_PAGE);
  const paginatedDatasets = useMemo(() => {
    const start = (currentPage - 1) * DATASETS_PER_PAGE;
    const end = start + DATASETS_PER_PAGE;
    return datasets.slice(start, end);
  }, [datasets, currentPage]);

  const versionColumns: ColumnDef<DatasetVersion>[] = [
    { accessorKey: "version_nr", header: "Version" },
    { accessorKey: "version_code", header: "Version Code" },
    { accessorKey: "valid_from", header: "Valid From" },
    { accessorKey: "valid_to", header: "Valid To" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingVersion(row.original);
                    setIsVersionModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Version</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDeleteVersion(
                      row.original.dataset_id,
                      row.original.dataset_version_id
                    )
                  }
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Version</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {paginatedDatasets.map((dataset) => (
          <AccordionItem
            key={dataset.dataset_id}
            value={dataset.dataset_id.toString()}
          >
            <AccordionTrigger
              className="text-left"
              onClick={() => handleDatasetClick(dataset)}
            >
              <div className="flex justify-between w-full items-center">
                <span>{dataset.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {dataset.framework} - {dataset.type}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDataset(dataset);
                          }}
                          disabled={dataset.is_system_generated}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {dataset.is_system_generated
                          ? "Cannot edit system-generated dataset"
                          : "Edit Dataset"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDataset(dataset.dataset_id);
                          }}
                          disabled={dataset.is_system_generated}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {dataset.is_system_generated
                          ? "Cannot delete system-generated dataset"
                          : "Delete Dataset"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {selectedDataset &&
                selectedDataset.dataset_id === dataset.dataset_id && (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">
                        Versions for {selectedDataset.label}
                      </h3>
                      {!dataset.is_system_generated && (
                        <Button
                          className="flex flex-end"
                          onClick={() => {
                            setEditingVersion(null);
                            setIsVersionModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Version
                        </Button>
                      )}
                    </div>
                    {isLoadingVersions ? (
                      <p>Loading versions...</p>
                    ) : datasetVersions && datasetVersions.data.length > 0 ? (
                      <SharedDataTable
                        key={selectedDataset.dataset_id}
                        data={datasetVersions.data.filter(
                          (v) => v.dataset_id === dataset.dataset_id
                        )}
                        columns={versionColumns}
                        onRowClick={(version) => setSelectedVersion(version)}
                        showPagination={true}
                      />
                    ) : (
                      <p>No versions available for this dataset.</p>
                    )}
                    {selectedVersion && (
                      <DatasetVersionColumns
                        datasetId={dataset.dataset_id}
                        versionId={selectedVersion.dataset_version_id}
                      />
                    )}
                  </div>
                )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <DatasetVersionFormModal
        isOpen={isVersionModalOpen}
        onClose={() => {
          setIsVersionModalOpen(false);
          setEditingVersion(null);
        }}
        onSubmit={(version) => {
          if (editingVersion) {
            handleUpdateVersion({
              ...editingVersion,
              ...version,
            } as DatasetVersion);
          } else if (selectedDataset) {
            handleCreateVersion({ ...selectedDataset, ...version } as Dataset);
          }
        }}
        initialData={editingVersion || undefined}
        dataset={selectedDataset || undefined}
      />
    </div>
  );
};
