import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dataset,
  DatasetVersion,
  DatasetVersions,
} from "@/types/databaseTypes";
import React from "react";
import { DatasetAccordion } from "./DatasetAccordion";

interface FrameworkAccordionProps {
  groupedDatasets: Record<string, Dataset[]>;
  handleDatasetClick: (dataset: Dataset) => void;
  datasetVersions?: DatasetVersions;
  selectedDataset: Dataset | null;
  handleCreateVersion: (dataset: Dataset) => void;
  handleUpdateVersion: (version: DatasetVersion) => void;
  handleDeleteVersion: (datasetId: number, versionId: number) => void;
  handleEditDataset: (dataset: Dataset) => void;
  handleDeleteDataset: (datasetId: number) => void;
  isLoadingVersions: boolean;
  selectedVersionId: number | null;
  getDatasetActions: (dataset: Dataset) => React.ReactNode;
  getVersionActions: (
    dataset: Dataset,
    version: DatasetVersion
  ) => React.ReactNode;
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
  getDatasetActions,
  getVersionActions,
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
              getDatasetActions={getDatasetActions}
              getVersionActions={getVersionActions}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
