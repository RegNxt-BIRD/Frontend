import DatabaseDiagram from "@/components/DatabaseDiagram";
import DatasetVersionSelector from "@/components/DatasetVersionSelector";
import DatePicker from "@/components/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fastApiInstance } from "@/lib/axios";
import { Frameworks, Layers } from "@/types/databaseTypes";
import { ReactFlowProvider } from "@xyflow/react";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

const NO_FILTER = "NO_FILTER";

const Relationships = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDatasetVersion, setSelectedDatasetVersion] =
    useState<any>(null);

  const { data: layers, error: layersError } = useSWR<Layers>(
    "/api/v1/layers/",
    fastApiInstance
  );
  const { data: frameworks, error: frameworksError } = useSWR<Frameworks>(
    "/api/v1/frameworks/",
    fastApiInstance
  );

  const isLoading = !layers || !frameworks;
  const error = layersError || frameworksError;

  const layersWithNoFilter = useMemo(
    () => [
      { code: NO_FILTER, name: "No Layer Selected" },
      ...(layers?.data || []),
    ],
    [layers]
  );

  const frameworksWithNoFilter = useMemo(
    () => [
      { code: NO_FILTER, name: "No Framework Selected" },
      ...(frameworks?.data || []),
    ],
    [frameworks]
  );

  const handleFrameworkChange = useCallback((value: string) => {
    setSelectedFramework(value);
    setSelectedDatasetVersion(null);
  }, []);

  const handleLayerChange = useCallback((value: string) => {
    setSelectedLayer(value);
    setSelectedDatasetVersion(null);
  }, []);

  const handleDateChange = useCallback((newDate: Date | undefined) => {
    if (newDate instanceof Date) {
      setSelectedDate(newDate);
      setSelectedDatasetVersion(null);
    }
  }, []);

  const handleDatasetVersionSelect = useCallback((datasetVersion: any) => {
    setSelectedDatasetVersion(datasetVersion);
  }, []);

  return (
    <div className="container mx-auto py-10 h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-bold mb-5">Relationships</h1>
      <div className="flex space-x-4 mb-5">
        <Select onValueChange={handleFrameworkChange} value={selectedFramework}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Framework" />
          </SelectTrigger>
          <SelectContent>
            {frameworksWithNoFilter.map((framework) => (
              <SelectItem key={framework.code} value={framework.code}>
                {framework.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleLayerChange} value={selectedLayer}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Layer" />
          </SelectTrigger>
          <SelectContent>
            {layersWithNoFilter.map((layer) => (
              <SelectItem key={layer.code} value={layer.code}>
                {layer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          onSelect={
            handleDateChange as React.ComponentProps<
              typeof DatePicker
            >["onSelect"]
          }
          initialDate={selectedDate}
        />
        <DatasetVersionSelector
          framework={selectedFramework}
          layer={selectedLayer}
          date={selectedDate}
          onSelect={handleDatasetVersionSelect}
        />
      </div>
      <div className="h-[calc(100%-2rem)] relative">
        <ReactFlowProvider>
          <DatabaseDiagram selectedDatasetVersion={selectedDatasetVersion} />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default Relationships;
