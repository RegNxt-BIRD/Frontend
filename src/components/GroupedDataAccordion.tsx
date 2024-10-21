// GroupedDataAccordion.tsx
import { ConfigurationDataTable } from "@/components/ConfigurationDataTable";
import { DataAccordion } from "@/components/DataAccordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DataItem } from "@/types/databaseTypes";
import React from "react";

interface GroupedDataAccordionProps {
  data: Record<string, Record<string, DataItem[]>>;
  onTableClick: (item: DataItem) => void;
  selectedFramework: string;
  selectedLayer: string;
}

export const GroupedDataAccordion: React.FC<GroupedDataAccordionProps> = ({
  data,
  onTableClick,
  selectedFramework,
  selectedLayer,
}) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      {Object.entries(data).map(([framework, groups]) => (
        <AccordionItem value={framework} key={framework}>
          <AccordionTrigger className="text-left">
            <div className="flex justify-between w-full">
              <span>{framework}</span>
              <span className="text-sm text-gray-500">
                {Object.values(groups).reduce(
                  (sum, items) => sum + items.length,
                  0
                )}{" "}
                dataset(s)
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {selectedLayer === "NO_FILTER" ? (
              <DataAccordion
                data={groups as any}
                onTableClick={onTableClick}
                selectedFramework={selectedFramework}
              />
            ) : (
              <ConfigurationDataTable
                data={{ [framework]: groups } as any}
                onRowClick={onTableClick}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
