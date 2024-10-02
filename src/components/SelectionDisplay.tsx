import { Badge } from "@/components/ui/badge";
import React from "react";

interface SelectionDisplayProps {
  filteredDataLength: number;
  selectedFramework: string;
  selectedLayer: string;
}

const NO_FILTER = "NO_FILTER";

export const SelectionDisplay: React.FC<SelectionDisplayProps> = ({
  filteredDataLength,
  selectedFramework,
  selectedLayer,
}) => {
  const isFrameworkSelected = selectedFramework !== NO_FILTER;
  const isLayerSelected = selectedLayer !== NO_FILTER;

  return (
    <div className="text-lg mb-4 flex flex-wrap items-center gap-2">
      <span>{filteredDataLength} tables</span>
      {isFrameworkSelected || isLayerSelected ? (
        <>
          <span>for</span>
          {isFrameworkSelected ? (
            <Badge variant="secondary">Framework: {selectedFramework}</Badge>
          ) : (
            <Badge variant="outline">Framework: Any</Badge>
          )}
          {isLayerSelected ? (
            <Badge variant="secondary">Layer: {selectedLayer}</Badge>
          ) : (
            <Badge variant="outline">Layer: Any</Badge>
          )}
        </>
      ) : (
        <span className="text-gray-500 italic">
          (Select a framework or layer to filter)
        </span>
      )}
    </div>
  );
};
