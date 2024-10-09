import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Dataset {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
  is_system_generated: boolean;
}

export const DatasetAccordion: React.FC<{
  datasets: Dataset[];
  handleDatasetClick: (dataset: Dataset) => void;
}> = ({ datasets, handleDatasetClick }) => {
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
            <div className="flex justify-between w-full">
              <span>{dataset.label}</span>
              <span className="text-sm text-gray-500">
                {dataset.framework} - {dataset.type}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {/* Dataset details and versions will be rendered here */}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
