import { ConfigurationDataTable } from "@/components/ConfigurationDataTable";
import { DataAccordion } from "@/components/DataAccordion";
import { MetadataTable } from "@/components/MetadataTable";
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
import axiosInstance, { fastApiInstance } from "@/lib/axios";
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
  dataSetId: number;
  category: string;
  businessId: string;
  code: string;
  name: string;
  description: string;
  maintenanceAgency: string;
  frameworkCode: string;
  version: string;
  entityType: string;
}

interface MetadataItem {
  dataSetId: number;
  columnId: number;
  columnName: string;
  columnLabel: string;
  columnDataType: string;
  isMandatory: boolean;
  isKey: boolean;
  isFilter: boolean;
  filterStatement: string;
  existPhysically: boolean;
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
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [metadataTableData, setMetadataTableData] = useState<
    Record<string, string>[]
  >([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const { toast } = useToast();

  const { data: layers, error: layersError } = useSWR<Layer[]>("/BIRD/layer");
  const { data: dataTableJson, error: dataError } =
    useSWR<TableData[]>("/BIRD/table?");
  const { data: frameworks, error: frameworksError } = useSWR<Framework[]>(
    "/api/v1/frameworks/",
    async (url) => {
      const response = await fastApiInstance.get(url);
      return response.data;
    }
  );

  const isLoading = !layers || !frameworks || !dataTableJson;
  const error = layersError || frameworksError || dataError;

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
        const metadataResponse = await axiosInstance.get(
          `/BIRD/MetaData?dataSetId=${dataSetId}`
        );
        setMetadata(metadataResponse.data);

        const tableDataResponse = await axiosInstance.post("/BIRD/Data", {
          processId: dataSetId,
          parameters: [{ name: "1", value: "1" }],
        });
        setMetadataTableData(tableDataResponse.data);
      } catch (error) {
        console.error("Error fetching metadata:", error);
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
    if (selectedTable) {
      fetchMetadata(selectedTable.dataSetId);
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
      try {
        await fastApiInstance.post(
          `/api/v1/datasets/${selectedTable?.dataSetId}/save_data/`,
          updatedData
        );
        toast({
          title: "Success",
          description: "Data saved successfully.",
        });
        if (selectedTable) {
          fetchMetadata(selectedTable.dataSetId);
        }
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
    if (!dataTableJson) return [];
    return dataTableJson.filter((item: TableData) => {
      const frameworkMatch =
        selectedFramework === NO_FILTER ||
        item.frameworkCode === selectedFramework;
      const layerMatch =
        selectedLayer === NO_FILTER || item.entityType === selectedLayer;
      return frameworkMatch && layerMatch;
    });
  }, [dataTableJson, selectedFramework, selectedLayer]);

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
      </div>
      <div>
        <SelectionDisplay
          filteredDataLength={filteredData.length}
          selectedFramework={selectedFramework}
          selectedLayer={selectedLayer}
        />
        {selectedFramework === NO_FILTER && selectedLayer === NO_FILTER ? (
          <DataAccordion data={dataTableJson} onTableClick={handleTableClick} />
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
            {selectedTable.name} Metadata
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
