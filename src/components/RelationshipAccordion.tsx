import DatabaseDiagram from "@/components/DatabaseDiagram";
import DatePicker from "@/components/DatePicker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fastApiInstance } from "@/lib/axios";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

const NO_FILTER = "NO_FILTER";

interface RelationshipsAccordionProps {
  data: Record<string, Record<string, any[]>>;
}

export const RelationshipsAccordion: React.FC<RelationshipsAccordionProps> = ({
  data,
}) => {
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDatasetVersions, setSelectedDatasetVersions] = useState<any[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFramework, setExpandedFramework] = useState<string | null>(
    null
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const { data: layers } = useSWR("/api/v1/layers/", fastApiInstance);
  const { data: frameworks } = useSWR("/api/v1/frameworks/", fastApiInstance);

  const handleFrameworkChange = useCallback((value: string) => {
    setSelectedFramework(value);
    setExpandedFramework(value !== NO_FILTER ? value : null);
  }, []);

  const handleLayerChange = useCallback((value: string) => {
    setSelectedLayer(value);
  }, []);

  const handleDateChange = useCallback((newDate: Date | undefined) => {
    if (newDate instanceof Date) {
      setSelectedDate(newDate);
    }
  }, []);

  const handleDatasetVersionSelect = useCallback((datasetVersion: any) => {
    setSelectedDatasetVersions((prev) =>
      prev.some(
        (v) => v.dataset_version_id === datasetVersion.dataset_version_id
      )
        ? prev.filter(
            (v) => v.dataset_version_id !== datasetVersion.dataset_version_id
          )
        : [...prev, datasetVersion]
    );
  }, []);

  const filteredData = useMemo(() => {
    const filtered: Record<string, Record<string, any[]>> = {};

    Object.entries(data).forEach(([framework, groups]) => {
      if (selectedFramework !== NO_FILTER && framework !== selectedFramework) {
        return;
      }

      filtered[framework] = {};

      Object.entries(groups).forEach(([group, items]) => {
        const filteredItems = items.filter((item) => {
          const layerMatch =
            selectedLayer === NO_FILTER || item.type === selectedLayer;
          const searchMatch = item.label
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          return layerMatch && searchMatch;
        });

        if (filteredItems.length > 0) {
          filtered[framework][group] = filteredItems;
        }
      });

      if (Object.keys(filtered[framework]).length === 0) {
        delete filtered[framework];
      }
    });

    return filtered;
  }, [data, selectedFramework, selectedLayer, searchTerm]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-4">
        <Select onValueChange={handleFrameworkChange} value={selectedFramework}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_FILTER}>All Frameworks</SelectItem>
            {frameworks?.data?.map((framework: any) => (
              <SelectItem key={framework.code} value={framework.code}>
                {framework.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleLayerChange} value={selectedLayer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Layer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_FILTER}>All Layers</SelectItem>
            {layers?.data?.map((layer: any) => (
              <SelectItem key={layer.code} value={layer.code}>
                {layer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker onSelect={handleDateChange} initialDate={selectedDate} />
        <Input
          placeholder="Search datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[200px]"
        />
      </div>
      <Accordion
        type="single"
        collapsible
        value={expandedFramework}
        onValueChange={setExpandedFramework}
        className="w-full"
      >
        {Object.entries(filteredData).map(([framework, groups]) => (
          <AccordionItem key={framework} value={framework}>
            <AccordionTrigger>{framework}</AccordionTrigger>
            <AccordionContent>
              <Accordion
                type="single"
                collapsible
                value={expandedGroup}
                onValueChange={setExpandedGroup}
              >
                {Object.entries(groups).map(([group, items]) => (
                  <AccordionItem key={group} value={group}>
                    <AccordionTrigger>{group}</AccordionTrigger>
                    <AccordionContent>
                      {items.map((item) => (
                        <div
                          key={item.dataset_id}
                          className="flex items-center space-x-2 py-1"
                        >
                          <Checkbox
                            id={`dataset-${item.dataset_id}`}
                            checked={selectedDatasetVersions.some(
                              (v) =>
                                v.dataset_version_id === item.dataset_version_id
                            )}
                            onCheckedChange={() =>
                              handleDatasetVersionSelect(item)
                            }
                          />
                          <label htmlFor={`dataset-${item.dataset_id}`}>
                            {item.label}
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
      <DatabaseDiagram selectedDatasetVersions={selectedDatasetVersions} />
    </div>
  );
};

export default RelationshipsAccordion;
