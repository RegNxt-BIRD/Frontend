import { format, isValid } from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { ConfigurationDataTable } from "@/components/ConfigurationDataTable";
import { DataAccordion } from "@/components/DataAccordion";
import DatePicker from "@/components/DatePicker";
import { MetadataTable } from "@/components/MetadataTable";
import { SelectionDisplay } from "@/components/SelectionDisplay";
import { SharedColumnFilters } from "@/components/SharedFilters";
import DataSkeleton from "@/components/skeletons/DataSkeleton";
import { TableInfoHeader } from "@/components/TableInfoHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { Frameworks, Layer } from "@/types/databaseTypes";

const NO_FILTER = "NO_FILTER";

interface ValidationResult {
  dataset_version_column_id: number;
  row_id: number | string;
  severity_level: string;
  validation_msg: string;
  column_name: string;
}

const Data: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>(NO_FILTER);
  const [selectedLayer, setSelectedLayer] = useState<string>(NO_FILTER);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [metadata, setMetadata] = useState<any[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datasetVersion, setDatasetVersion] = useState<any>(null);
  const [metadataTableData, setMetadataTableData] = useState<
    Record<string, string>[]
  >([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    code: "",
    label: "",
    type: "",
    description: "",
  });
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const { toast } = useToast();

  const { data: layers, error: layersError } = useSWR<Layer[]>("/BIRD/layer");
  const { data: frameworks, error: frameworksError } = useSWR<Frameworks>(
    "/api/v1/frameworks/",
    fastApiInstance
  );
  const { data: dataTableJson, error: dataError } = useSWR<any>(
    "/api/v1/datasets/",
    fastApiInstance
  );

  const isLoading = !layers || !frameworks || !dataTableJson;
  const error = layersError || frameworksError || dataError;

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDateChange = useCallback((newDate: Date | undefined) => {
    if (newDate instanceof Date) {
      setSelectedDate(newDate);
      setDatasetVersion(null);
    }
  }, []);

  const fetchDatasetVersion = useCallback(async () => {
    if (!selectedTable) return;
    try {
      const response = await fastApiInstance.get(
        `/api/v1/datasets/${selectedTable.dataset_id}/versions/`,
        {
          params: { date: format(selectedDate, "yyyy-MM-dd") },
        }
      );
      setDatasetVersion(
        response.data && Object.keys(response.data).length > 0
          ? response.data
          : null
      );
      if (!response.data || Object.keys(response.data).length === 0) {
        toast({
          title: "No Version Available",
          description: `No version history exists for the selected table on ${format(
            selectedDate,
            "yyyy-MM-dd"
          )}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching dataset version:", error);
      setDatasetVersion(null);
      toast({
        title: "Error",
        description: "Failed to fetch dataset version. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedTable, selectedDate, toast]);

  useEffect(() => {
    fetchDatasetVersion();
  }, [fetchDatasetVersion]);

  const fetchTableData = useCallback(async () => {
    if (!selectedTable || !datasetVersion) return;
    try {
      const response = await fastApiInstance.get(
        `/api/v1/datasets/${selectedTable.dataset_id}/get_data/?version_id=${datasetVersion?.dataset_version_id}`
      );
      setMetadataTableData(response.data);
    } catch (error) {
      console.error("Error fetching table data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch table data. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedTable, datasetVersion, toast]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const fetchMetadata = useCallback(async () => {
    if (!selectedTable || !datasetVersion) return;
    setIsMetadataLoading(true);
    try {
      const columnsResponse = await fastApiInstance.get(
        `/api/v1/datasets/${selectedTable.dataset_id}/columns/`,
        {
          params: { version_id: datasetVersion.dataset_version_id },
        }
      );
      setMetadata(
        Array.isArray(columnsResponse.data) ? columnsResponse.data : null
      );
    } catch (error) {
      console.error("Error fetching metadata:", error);
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
  }, [selectedTable, datasetVersion, toast]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const handleFrameworkChange = useCallback((value: string) => {
    setSelectedFramework(value);
    setSelectedTable(null);
  }, []);

  const handleLayerChange = useCallback((value: string) => {
    setSelectedLayer(value);
    setSelectedTable(null);
  }, []);

  const handleTableClick = useCallback((table: any) => {
    setSelectedTable(table);
  }, []);

  const handleSaveMetadata = useCallback(
    async (updatedData: Record<string, string | null>[]) => {
      if (!selectedTable) return;
      try {
        await fastApiInstance.post(
          `/api/v1/datasets/${selectedTable.dataset_id}/save_data/`,
          updatedData
        );
        toast({ title: "Success", description: "Data saved successfully." });
        fetchTableData();
      } catch (error) {
        console.error("Error saving data:", error);
        toast({
          title: "Error",
          description: "Failed to save data. Please try again.",
          variant: "destructive",
        });
      }
    },
    [selectedTable, toast, fetchTableData]
  );

  const handleValidate = useCallback(async () => {
    if (!selectedTable || !datasetVersion) return;

    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    if (!isValid(new Date(formattedDate))) {
      toast({
        title: "Invalid Date",
        description:
          "The selected date is not valid. Please choose a valid date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fastApiInstance.get<ValidationResult[]>(
        `/api/v1/datasets/${selectedTable.dataset_id}/validate/`,
        {
          params: {
            dataset_version_id: datasetVersion.dataset_version_id,
            version_code: datasetVersion.version_code,
          },
        }
      );

      setValidationResults(response.data);
      toast({
        title: "Validation Complete",
        description: `Found ${response.data.length} validation issue(s).`,
        variant: response.data.length > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      console.error("Validation error:", error);
      let errorMessage =
        "Failed to fetch validation results. Please try again.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [selectedTable, datasetVersion, selectedDate, toast]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(dataTableJson?.data)) return [];
    return dataTableJson?.data?.filter((item: any) => {
      const frameworkMatch =
        selectedFramework === NO_FILTER || item.framework === selectedFramework;
      const layerMatch =
        selectedLayer === NO_FILTER || item.type === selectedLayer;
      const columnFilterMatch = Object.entries(columnFilters).every(
        ([key, value]) =>
          value === "" ||
          item[key as keyof any]
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
  const frameworksWithNoFilter = useMemo(
    () => [
      { code: NO_FILTER, formatted_name: "No Framework Selected" },
      ...(frameworks?.data || []),
    ],
    [frameworks]
  );

  if (isLoading) return <DataSkeleton />;

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
        <DatePicker
          onSelect={
            handleDateChange as React.ComponentProps<
              typeof DatePicker
            >["onSelect"]
          }
          initialDate={selectedDate}
        />
      </div>
      <SelectionDisplay
        filteredDataLength={filteredData.length}
        selectedFramework={selectedFramework}
        selectedLayer={selectedLayer}
      />
      <SharedColumnFilters
        filters={columnFilters}
        setFilter={(key, value) =>
          setColumnFilters((prev) => ({ ...prev, [key]: value }))
        }
      />
      {selectedFramework === NO_FILTER && selectedLayer === NO_FILTER ? (
        <DataAccordion data={filteredData} onTableClick={handleTableClick} />
      ) : (
        <ConfigurationDataTable
          data={filteredData}
          onRowClick={handleTableClick}
        />
      )}
      {selectedTable && (
        <div className="mt-8">
          <TableInfoHeader
            selectedTable={selectedTable}
            datasetVersion={datasetVersion}
          />
          {datasetVersion ? (
            <>
              <p className="mb-4">
                Valid from: {datasetVersion.valid_from} to{" "}
                {datasetVersion.valid_to || "Present"}
              </p>
              <MetadataTable
                metadata={metadata}
                tableData={metadataTableData}
                isLoading={isMetadataLoading}
                onSave={handleSaveMetadata}
                onValidate={handleValidate}
                selectedTable={selectedTable}
                datasetVersion={datasetVersion}
                validationResults={validationResults}
              />
            </>
          ) : (
            <p className="text-gray-500 italic">
              No version history available for the selected date.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Data;
