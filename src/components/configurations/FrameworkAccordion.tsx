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

export const FrameworkAccordion: React.FC<{
  groupedDatasets: Record<string, Dataset[]>;
  handleDatasetClick: (dataset: Dataset) => void;
  datasetVersions: DatasetVersion[];
  selectedDataset: Dataset | null;
  handleCreateVersion: (dataset: Dataset) => void;
  handleEditVersion: (version: DatasetVersion) => void;
  handleDeleteVersion: (versionId: number) => void;
  handleEditDataset: (dataset: Dataset) => void;
  handleDeleteDataset: (datasetId: number) => void;
}> = ({
  groupedDatasets,
  handleDatasetClick,
  datasetVersions,
  selectedDataset,
  handleCreateVersion,
  handleEditVersion,
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
              selectedDataset={selectedDataset}
              handleCreateVersion={handleCreateVersion}
              handleEditVersion={handleEditVersion}
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
