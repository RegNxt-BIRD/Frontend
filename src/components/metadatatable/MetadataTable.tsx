import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MetadataItem, ValidationResult } from "@/types/databaseTypes";
import { AlertCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ExcelOperations } from "../ExcelOperations";
import { NoResults } from "../NoResults";
import { MetadataTableBody } from "./MetadataTableBody";
import { MetadataTableHeader } from "./MetadataTableHeader";

interface MetadataTableProps {
  metadata: MetadataItem[] | null;
  tableData: Record<string, string | null>[];
  isLoading: boolean;
  hasAppliedFilters: boolean;
  onSave: any;
  onValidate: (tableData: Record<string, string | null>[]) => void;
  selectedTable: { code: string; label: string };
  datasetVersion: { version_nr: string };
  validationResults: ValidationResult[];
  hasMandatoryFilters: any;
}

export const MetadataTable: React.FC<MetadataTableProps> = ({
  metadata,
  tableData,
  isLoading,
  onSave,
  onValidate,
  selectedTable,
  hasAppliedFilters,
  datasetVersion,
  validationResults,
  hasMandatoryFilters,
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [localTableData, setLocalTableData] = useState<
    Record<string, string | null>[]
  >([]);
  const [isDataModified, setIsDataModified] = useState(false);

  useEffect(() => {
    if (tableData && tableData.length > 0) {
      const initialData = tableData.map((row) => ({ ...row, id: row.id }));
      setLocalTableData(initialData);
    } else {
      setLocalTableData([]);
    }
    setIsDataModified(false);
  }, [tableData]);

  const handleCellChange = useCallback(
    (rowIndex: number, columnName: string, value: string | null) => {
      setLocalTableData((prevData) => {
        const newData = [...prevData];
        newData[rowIndex] = {
          ...newData[rowIndex],
          [columnName]: value === "" ? null : value,
        };
        return newData;
      });
      setIsDataModified(true);
    },
    []
  );

  const handleAddRow = useCallback(() => {
    if (!metadata) return;
    const newRow = Object.fromEntries(
      metadata.map((column) => [column.code, null])
    );
    setLocalTableData((prevData) => [...prevData, newRow]);
    setIsDataModified(true);
  }, [metadata]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Get IDs of rows in the current localTableData
      const currentIds = new Set(
        localTableData.map((row) => row.id).filter(Boolean)
      );

      const originalIds = new Set(
        tableData.map((row) => row.id).filter(Boolean)
      );
      const deletedIds = [...originalIds].filter((id) => !currentIds.has(id));
      const savePayload = {
        data: localTableData,
        deletions: deletedIds,
      } as any;

      await onSave(savePayload);
      setIsDataModified(false);
      toast({
        title: "Success",
        description: "All changes saved successfully",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [localTableData, tableData, onSave, toast]);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    try {
      const validationResults = (await onValidate(localTableData)) as any;
      if (validationResults && validationResults.length > 0) {
        const firstErrorElement = document.querySelector(
          '[data-validation-error="true"]'
        );
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  }, [onValidate, localTableData]);

  const filteredMetadata = useMemo(() => {
    return (
      metadata?.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    );
  }, [metadata, searchTerm]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!metadata || metadata.length === 0) {
    return (
      <NoResults
        title="No Data Available"
        message="No data available for the selected filters."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between flex-end">
        <h3 className="text-xl font-semibold">
          Data for table {selectedTable.code} | {selectedTable.label}{" "}
          {datasetVersion && `| Version ${datasetVersion.version_nr}`}
        </h3>

        <div className="flex items-center space-x-2">
          <ExcelOperations
            objectCode={selectedTable.code.toLowerCase()}
            columns={metadata}
            onUpload={onSave}
            currentData={localTableData}
            isLoading={isSaving || isLoading}
          />
        </div>
      </div>

      {hasMandatoryFilters() && !hasAppliedFilters ? (
        <NoResults
          title="Mandatory Filters Required"
          message="Please apply the required filters above to view the data."
          icon={AlertCircle}
        />
      ) : (
        <>
          <MetadataTableHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleAddRow={handleAddRow}
            handleSave={handleSave}
            onValidate={handleValidate}
            isDataModified={isDataModified}
            isSaving={isSaving}
            isValidating={isValidating}
          />

          <MetadataTableBody
            filteredMetadata={filteredMetadata}
            localTableData={localTableData}
            handleCellChange={handleCellChange}
            handleDeleteRow={(rowIndex) => {
              setLocalTableData((prevData) =>
                prevData.filter((_, index) => index !== rowIndex)
              );
              setIsDataModified(true);
            }}
            validationResults={validationResults}
          />
        </>
      )}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <div className="flex justify-between">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-10 w-1/4" />
    </div>
    <div className="space-y-2">
      {[...Array(5)].map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

export default MetadataTable;
