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
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash } from "lucide-react";
import React from "react";

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

export const DatasetAccordion: React.FC<{
  datasets: Dataset[];
  handleDatasetClick: (dataset: Dataset) => void;
  datasetVersions: DatasetVersion[];
  selectedDataset: Dataset | null;
  handleCreateVersion: (dataset: Dataset) => void;
  handleEditVersion: (version: DatasetVersion) => void;
  handleDeleteVersion: (versionId: number) => void;
  handleEditDataset: (dataset: Dataset) => void;
  handleDeleteDataset: (datasetId: number) => void;
}> = ({
  datasets,
  handleDatasetClick,
  datasetVersions,
  selectedDataset,
  handleCreateVersion,
  handleEditVersion,
  handleDeleteVersion,
  handleEditDataset,
  handleDeleteDataset,
}) => {
  const versionColumns: ColumnDef<DatasetVersion>[] = [
    { accessorKey: "version_nr", header: "Version" },
    { accessorKey: "version_code", header: "Version Code" },
    { accessorKey: "valid_from", header: "Valid From" },
    { accessorKey: "valid_to", header: "Valid To" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditVersion(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteVersion(row.original.dataset_version_id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      {datasets.map((dataset) => (
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
                    {dataset.is_system_generated && (
                      <TooltipContent>
                        <p>Cannot edit system-generated dataset</p>
                      </TooltipContent>
                    )}
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
                    {dataset.is_system_generated && (
                      <TooltipContent>
                        <p>Cannot delete system-generated dataset</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {selectedDataset &&
              selectedDataset.dataset_id === dataset.dataset_id && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">
                    Versions for {selectedDataset.label}
                  </h3>
                  <SharedDataTable
                    data={datasetVersions.filter(
                      (v) => v.dataset_id === dataset.dataset_id
                    )}
                    columns={versionColumns}
                    onRowClick={() => {}}
                    showPagination={true}
                  />
                  {!dataset.is_system_generated && (
                    <Button
                      className="mt-2"
                      onClick={() => handleCreateVersion(dataset)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Version
                    </Button>
                  )}
                </div>
              )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};