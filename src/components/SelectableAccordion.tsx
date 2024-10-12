// components/SelectableAccordion.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";

interface SelectableAccordionProps {
  data: Record<string, Record<string, any[]>>;
  selectedItems: any[];
  onItemSelect: (item: any) => void;
}

const SelectableAccordion: React.FC<SelectableAccordionProps> = ({
  data,
  selectedItems,
  onItemSelect,
}) => {
  const isGroupSelected = (items: any[]) => {
    return items.every((item) =>
      selectedItems.some((selected) => selected.dataset_id === item.dataset_id)
    );
  };

  const handleGroupSelect = (items: any[]) => {
    const allSelected = isGroupSelected(items);
    items.forEach((item) => {
      if (allSelected) {
        onItemSelect(item); // Deselect
      } else if (
        !selectedItems.some(
          (selected) => selected.dataset_id === item.dataset_id
        )
      ) {
        onItemSelect(item); // Select
      }
    });
  };

  return (
    <Accordion type="multiple" className="w-full">
      {Object.entries(data).map(([framework, groups]) => (
        <AccordionItem key={framework} value={framework}>
          <AccordionTrigger>{framework}</AccordionTrigger>
          <AccordionContent>
            <Accordion type="multiple">
              {Object.entries(groups).map(([group, items]) => (
                <AccordionItem key={group} value={group}>
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Checkbox
                        checked={isGroupSelected(items)}
                        onCheckedChange={() => handleGroupSelect(items)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="ml-2">{group}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {items.map((item) => (
                      <div
                        key={item.dataset_id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <Checkbox
                          id={`dataset-${item.dataset_id}`}
                          checked={selectedItems.some(
                            (selected) =>
                              selected.dataset_id === item.dataset_id
                          )}
                          onCheckedChange={() => onItemSelect(item)}
                        />
                        <label htmlFor={`dataset-${item.dataset_id}`}>
                          {item.code}
                        </label>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default SelectableAccordion;
