import { Input } from "@/components/ui/input";
import React from "react";

interface SharedColumnFiltersProps {
  filters: {
    framework: string;
    type: string;
    code: string;
    label: string;
    description: string;
  };
  setFilter: (key: string, value: string) => void;
}

export const SharedColumnFilters: React.FC<SharedColumnFiltersProps> = ({
  filters,
  setFilter,
}) => {
  return (
    <div className="grid grid-cols-5 gap-4 mb-4">
      {Object.entries(filters).map(([key, value]) => (
        <Input
          key={key}
          placeholder={`Filter ${key}`}
          value={value}
          onChange={(e) => setFilter(key, e.target.value)}
          className="max-w-sm"
        />
      ))}
    </div>
  );
};
