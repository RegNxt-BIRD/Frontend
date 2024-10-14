import DatabaseDiagram from "@/components/DatabaseDiagram";
import DatePicker from "@/components/DatePicker";
import SelectableAccordion from "@/components/SelectableAccordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fastApiInstance } from "@/lib/axios";
import { DatasetResponse, Frameworks, Layers } from "@/types/databaseTypes";
import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const NO_FILTER = "NO_FILTER";
const PAGE_SIZE = 10000; // Adjust this value as needed

export default function Relationship() {
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDatasetVersions, setSelectedDatasetVersions] = useState<any[]>(
    []
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: layers } = useSWR<Layers>("/api/v1/layers/", fastApiInstance);
  const { data: frameworks } = useSWR<Frameworks>(
    "/api/v1/frameworks/",
    fastApiInstance
  );
  const { data: dataTableJson } = useSWR<DatasetResponse>(
    `/api/v1/datasets/?page=${currentPage}&page_size=${PAGE_SIZE}`,
    fastApiInstance,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );

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

  const handleDatasetVersionSelect = useCallback((item: any) => {
    console.log("item: ", item);
    setSelectedDatasetVersions((prev) =>
      prev.some((v) => v.dataset_version_id === item.dataset_version_id)
        ? prev.filter((v) => v.dataset_version_id !== item.dataset_version_id)
        : [...prev, item]
    );
  }, []);

  const filteredData = useMemo(() => {
    if (!dataTableJson?.data?.results) return {};

    const filtered: Record<string, Record<string, any[]>> = {};
    dataTableJson.data.results.forEach((item: any) => {
      if (
        selectedFramework !== NO_FILTER &&
        item.framework !== selectedFramework
      )
        return;
      if (selectedLayer !== NO_FILTER && item.type !== selectedLayer) return;

      const framework = item.framework;
      const group =
        item.groups.length > 0 ? item.groups[0].code : "Ungrouped Datasets";

      if (!filtered[framework]) filtered[framework] = {};
      if (!filtered[framework][group]) filtered[framework][group] = [];
      filtered[framework][group].push(item);
    });

    return filtered;
  }, [dataTableJson, selectedFramework, selectedLayer]);

  const handleDiagramSelectionChange = useCallback((selectedNodes: any[]) => {
    setSelectedDatasetVersions(selectedNodes);
  }, []);

  useEffect(() => {
    // If there are more pages, fetch them
    if (dataTableJson && currentPage < dataTableJson.data.num_pages) {
      setCurrentPage(currentPage + 1);
    }
  }, [dataTableJson, currentPage]);

  return (
    <div className="flex h-screen">
      <div className="w-full p-4">
        <div className="flex space-x-4 mb-4">
          <Select
            onValueChange={handleFrameworkChange}
            value={selectedFramework}
          >
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
          <DatePicker
            onSelect={
              handleDateChange as React.ComponentProps<
                typeof DatePicker
              >["onSelect"]
            }
            initialDate={selectedDate}
          />
        </div>
        <ReactFlowProvider>
          <DatabaseDiagram
            selectedDatasetVersions={selectedDatasetVersions}
            onSelectionChange={handleDiagramSelectionChange}
          />
        </ReactFlowProvider>
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button className="fixed right-4 top-4 z-10">
            Open Dataset List
          </Button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto max-h-screen">
          <SheetHeader>
            <SheetTitle>Selected Datasets</SheetTitle>
            <SheetDescription>
              View and manage your selected datasets here.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <Input
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <SelectableAccordion
              data={filteredData}
              selectedItems={selectedDatasetVersions}
              onItemSelect={handleDatasetVersionSelect}
              searchTerm={searchTerm}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
