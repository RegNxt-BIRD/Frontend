import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import React from "react";
import { DatasetAccordion } from "./DatasetAccordion";

interface Dataset {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
  is_system_generated: boolean;
  version_nr?: string;
  version_code?: string;
  valid_to?: string;
  valid_from?: string;
}

export interface DatasetVersion {
  dataset_version_id: number;
  dataset_id: number;
  version_nr: string;
  version_code: string;
  valid_from: string;
  valid_to: string | null;
  is_system_generated: boolean;
  code: string;
  label: string;
  description: string;
}

interface FrameworkAccordionProps {
  groupedDatasets: Record<string, Dataset[]>;
  handleDatasetClick: (dataset: Dataset) => void;
  datasetVersions: DatasetVersion[];
  selectedDataset: Dataset | null;
  handleCreateVersion: (dataset: Dataset) => void;
  handleUpdateVersion: (version: DatasetVersion) => void;
  handleDeleteVersion: (datasetId: number, versionId: number) => void;
  handleEditDataset: (dataset: Dataset) => void;
  handleDeleteDataset: (datasetId: number) => void;
  isLoadingVersions: boolean;
}

export const FrameworkAccordion: React.FC<FrameworkAccordionProps> = ({
  groupedDatasets,
  handleDatasetClick,
  datasetVersions,
  selectedDataset,
  isLoadingVersions,
  handleUpdateVersion,
  handleCreateVersion,
  handleDeleteVersion,
  handleEditDataset,
  handleDeleteDataset,
}) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      {Object.entries(groupedDatasets).map(([framework, datasets]) => (
        <AccordionItem value={framework} key={framework}>
          <AccordionTrigger className="text-left">
            <div className="flex justify-between w-full">
              <span>{framework}</span>
              <span className="text-sm text-gray-500">
                {datasets.length} dataset(s)
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <DatasetAccordion
              datasets={datasets}
              handleDatasetClick={handleDatasetClick}
              datasetVersions={datasetVersions}
              isLoadingVersions={isLoadingVersions}
              selectedDataset={selectedDataset}
              handleUpdateVersion={handleUpdateVersion}
              handleCreateVersion={handleCreateVersion}
              handleDeleteVersion={handleDeleteVersion}
              handleEditDataset={handleEditDataset}
              handleDeleteDataset={handleDeleteDataset}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
