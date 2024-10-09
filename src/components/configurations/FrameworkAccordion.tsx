import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export const FrameworkAccordion: React.FC<{
  groupedDatasets: Record<string, Dataset[]>;
  handleDatasetClick: (dataset: Dataset) => void;
}> = ({ groupedDatasets, handleDatasetClick }) => {
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
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
