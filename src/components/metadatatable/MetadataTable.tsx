import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MetadataItem, ValidationResult } from "@/types/databaseTypes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ExcelOperations } from "../ExcelOperations";
import { MetadataTableBody } from "./MetadataTableBody";
import { MetadataTableHeader } from "./MetadataTableHeader";

interface MetadataTableProps {
  metadata: MetadataItem[] | null;
  tableData: Record<string, string | null>[];
  isLoading: boolean;
  onSave: (updatedData: Record<string, string | null>[]) => Promise<void>;
  onValidate: (tableData: Record<string, string | null>[]) => void;
  selectedTable: { code: string; label: string };
  datasetVersion: { version_nr: string };
  validationResults: ValidationResult[];
}

export const MetadataTable: React.FC<MetadataTableProps> = ({
  metadata,
  tableData,
  isLoading,
  onSave,
  onValidate,
  selectedTable,
  datasetVersion,
  validationResults,
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
      setLocalTableData(tableData.map((row) => ({ ...row, id: row.id })));
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

  const handleExcelDataLoad = useCallback(
    (excelData: Record<string, string | null>[]) => {
      // Map column codes to match your table structure and add any missing columns
      const mappedData = excelData.map((row) => {
        const mappedRow: Record<string, string | null> = {};
        if (metadata) {
          metadata.forEach((column) => {
            mappedRow[column.code] = row[column.code] || null;
          });
        }
        return mappedRow;
      });

      // Append new data to existing data
      setLocalTableData((prevData) => {
        const combinedData = [...prevData, ...mappedData];

        // Log the number of rows added
        const newRowsCount = mappedData.length;
        toast({
          title: "Data Appended",
          description: `Added ${newRowsCount} new row${
            newRowsCount !== 1 ? "s" : ""
          } to the table`,
        });

        return combinedData;
      });

      setIsDataModified(true);
    },
    [metadata, toast]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(localTableData);
      setIsDataModified(false);
      toast({
        title: "Success",
        description: "All changes saved successfully",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [localTableData, onSave, toast]);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    try {
      await onValidate(localTableData);
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
      <p className="text-gray-500 italic">
        No data available for the selected table.
      </p>
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
          <div className="text-sm text-gray-500">
            {localTableData.length} rows
          </div>
          <ExcelOperations
            objectCode={selectedTable.code.toLowerCase()}
            columns={metadata}
            onUpload={onSave}
            currentData={localTableData}
            isLoading={isSaving || isLoading}
            onDataLoad={handleExcelDataLoad}
          />
        </div>
      </div>

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
