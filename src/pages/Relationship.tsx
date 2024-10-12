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
import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useState } from "react";
import useSWR from "swr";

const NO_FILTER = "NO_FILTER";

const Relationships = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDatasetVersions, setSelectedDatasetVersions] = useState<any[]>(
    []
  );

  const { data: layers } = useSWR("/api/v1/layers/", fastApiInstance);
  const { data: frameworks } = useSWR("/api/v1/frameworks/", fastApiInstance);

  const handleFrameworkChange = useCallback((value: string) => {
    setSelectedFramework(value);
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

  return (
    <div className="container mx-auto py-6 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Relationships</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Select onValueChange={handleFrameworkChange} value={selectedFramework}>
          <SelectTrigger>
            <SelectValue placeholder="Select a Framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_FILTER}>No Framework Selected</SelectItem>
            {frameworks?.data?.map((framework: any) => (
              <SelectItem key={framework.code} value={framework.code}>
                {framework.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleLayerChange} value={selectedLayer}>
          <SelectTrigger>
            <SelectValue placeholder="Select a Layer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_FILTER}>No Layer Selected</SelectItem>
            {layers?.data?.map((layer: any) => (
              <SelectItem key={layer.code} value={layer.code}>
                {layer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker onSelect={handleDateChange} initialDate={selectedDate} />
        <DatasetVersionSelector
          framework={selectedFramework}
          layer={selectedLayer}
          date={selectedDate}
          onSelect={handleDatasetVersionSelect}
          selectedVersions={selectedDatasetVersions.map((v) =>
            v.dataset_version_id.toString()
          )}
        />
      </div>
      <div className="flex-grow relative">
        <ReactFlowProvider>
          <DatabaseDiagram selectedDatasetVersions={selectedDatasetVersions} />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default Relationships;
