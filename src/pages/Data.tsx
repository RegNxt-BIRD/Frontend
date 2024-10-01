import { ConfigurationDataTable } from "@/components/ConfigurationDataTable";
import { DataAccordion } from "@/components/DataAccordion";
import DateRangePicker from "@/components/DateRangePicker";
import { MetadataTable } from "@/components/MetadataTable";
import { SharedColumnFilters } from "@/components/SharedFilters";
import DataSkeleton from "@/components/skeletons/DataSkeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const NO_FILTER = "NO_FILTER";

interface Layer {
  name: string;
  code: string;
}

interface Framework {
  code: string;
  formatted_name: string;
}

interface TableData {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
}

interface DatasetInfo {
  dataset_id: number;
  code: string;
  label: string;
  description: string;
  framework: string;
  type: string;
}

interface MetadataItem {
  dataset_version_column_id: number;
  dataset_version_id: number;
  column_order: number;
  code: string;
  label: string;
  description: string;
  role: string;
  dimension_type: string;
  datatype: string;
  datatype_format: string;
  is_mandatory: boolean;
  is_key: boolean;
  value_statement: string;
  is_filter: boolean;
  is_report_snapshot_field: boolean;
}

const SelectionDisplay: React.FC<{
  filteredDataLength: number;
  selectedFramework: string;
  selectedLayer: string;
}> = ({ filteredDataLength, selectedFramework, selectedLayer }) => {
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

const Data: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [metadata, setMetadata] = useState<MetadataItem[] | null>(null);
  const [metadataTableData, setMetadataTableData] = useState<
    Record<string, string>[]
  >([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const { toast } = useToast();

  const { data: layers, error: layersError } = useSWR<Layer[]>("/BIRD/layer");

  const { data: dataTableJson, error: dataError } = useSWR<TableData[]>(
    "/api/v1/datasets/",
    async (url: string) => {
      const response = await fastApiInstance.get(url);
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error("Unexpected data format received:", response.data);
        return [];
      }
    }
  );

  const { data: frameworks, error: frameworksError } = useSWR<Framework[]>(
    "/api/v1/frameworks/",
    async (url: string) => {
      const response = await fastApiInstance.get(url);
      return response.data;
    }
  );

  const isLoading = !layers || !frameworks || !Array.isArray(dataTableJson);
  const error = layersError || frameworksError || dataError;

  const [columnFilters, setColumnFilters] = useState({
    code: "",
    label: "",
    type: "",
    description: "",
  });
  const setFilter = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch configuration data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const fetchMetadata = useCallback(
    async (dataSetId: number) => {
      setIsMetadataLoading(true);
      try {
        console.log("Fetching metadata for dataSetId:", dataSetId);
        const metadataResponse = await fastApiInstance.get(
          `/api/v1/datasets/${dataSetId}/`
        );

        if (
          typeof metadataResponse.data === "object" &&
          !Array.isArray(metadataResponse.data)
        ) {
          setDatasetInfo(metadataResponse.data);
          // Fetch the actual metadata columns
          const columnsResponse = await fastApiInstance.get(
            `/api/v1/datasets/version-columns/${dataSetId}/`
          );
          if (Array.isArray(columnsResponse.data)) {
            setMetadata(columnsResponse.data);
          } else {
            console.error("Unexpected columns format:", columnsResponse.data);
            setMetadata(null);
          }
        } else {
          console.error("Unexpected metadata format:", metadataResponse.data);
          setDatasetInfo(null);
          setMetadata(null);
          toast({
            title: "Warning",
            description:
              "Metadata format is unexpected. Some features may not work correctly.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setDatasetInfo(null);
        setMetadata(null);
        setMetadataTableData([]);
        toast({
          title: "Error",
          description: "Failed to fetch metadata. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsMetadataLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (selectedTable && selectedTable.dataset_id) {
      console.log("Fetching metadata for:", selectedTable);
      fetchMetadata(selectedTable.dataset_id);
    } else {
      console.log("Selected table or dataset_id is undefined:", selectedTable);
    }
  }, [selectedTable, fetchMetadata]);

  const handleFrameworkChange = useCallback((value: string) => {
    setSelectedFramework(value);
    setSelectedTable(null);
  }, []);

  const handleLayerChange = useCallback((value: string) => {
    setSelectedLayer(value);
    setSelectedTable(null);
  }, []);

  const handleTableClick = useCallback((table: TableData) => {
    setSelectedTable(table);
  }, []);

  const handleSaveMetadata = useCallback(
    async (updatedData: Record<string, string>[]) => {
      if (!selectedTable) {
        console.error("No table selected for saving metadata");
        return;
      }
      try {
        await fastApiInstance.post(
          `/api/v1/datasets/${selectedTable.dataset_id}/save_data/`,
          updatedData
        );
        toast({
          title: "Success",
          description: "Data saved successfully.",
        });
        fetchMetadata(selectedTable.dataset_id);
      } catch (error) {
        console.error("Error saving data:", error);
        toast({
          title: "Error",
          description: "Failed to save data. Please try again.",
          variant: "destructive",
        });
      }
    },
    [selectedTable, toast, fetchMetadata]
  );

  const filteredData = useMemo(() => {
    if (!Array.isArray(dataTableJson)) return [];
    return dataTableJson.filter((item: TableData) => {
      const frameworkMatch =
        selectedFramework === NO_FILTER || item.framework === selectedFramework;
      const layerMatch =
        selectedLayer === NO_FILTER || item.type === selectedLayer;
      const columnFilterMatch = Object.entries(columnFilters).every(
        ([key, value]) =>
          value === "" ||
          item[key as keyof TableData]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
      );
      return frameworkMatch && layerMatch && columnFilterMatch;
    });
  }, [dataTableJson, selectedFramework, selectedLayer, columnFilters]);
  const layersWithNoFilter = useMemo(
    () => [{ name: "No Layer Selected", code: NO_FILTER }, ...(layers || [])],
    [layers]
  );

  const frameworksWithNoFilter = useMemo(() => {
    if (!frameworks) return [];
    return [
      { code: NO_FILTER, formatted_name: "No Framework Selected" },
      ...frameworks,
    ];
  }, [frameworks]);

  if (isLoading) {
    return <DataSkeleton />;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Data</h1>
      <div className="flex space-x-4 mb-5">
        <Select onValueChange={handleFrameworkChange} value={selectedFramework}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Framework" />
          </SelectTrigger>
          <SelectContent>
            {frameworksWithNoFilter.map((framework) => (
              <SelectItem key={framework.code} value={framework.code}>
                {framework.formatted_name}
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
        <DateRangePicker />
      </div>
      <div>
        <SelectionDisplay
          filteredDataLength={filteredData.length}
          selectedFramework={selectedFramework}
          selectedLayer={selectedLayer}
        />
        <SharedColumnFilters filters={columnFilters} setFilter={setFilter} />
        {selectedFramework === NO_FILTER && selectedLayer === NO_FILTER ? (
          <DataAccordion data={filteredData} onTableClick={handleTableClick} />
        ) : (
          <ConfigurationDataTable
            data={filteredData}
            onRowClick={handleTableClick}
          />
        )}
      </div>
      {selectedTable && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            {datasetInfo?.label || selectedTable.label} Metadata
          </h2>
          <MetadataTable
            metadata={metadata}
            tableData={metadataTableData}
            isLoading={isMetadataLoading}
            onSave={handleSaveMetadata}
          />
        </div>
      )}
    </div>
  );
};

export default Data;
