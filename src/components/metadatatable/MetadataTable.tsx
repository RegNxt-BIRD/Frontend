import { Skeleton } from "@/components/ui/skeleton";
import { MetadataItem, ValidationResult } from "@/types/databaseTypes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ExcelOperations } from "../ExcelOperations";
import { MetadataTableBody } from "./MetadataTableBody";
import { MetadataTableHeader } from "./MetadataTableHeader";

interface MetadataTableProps {
  metadata: MetadataItem[] | null;
  tableData: Record<string, string | null>[];
  isLoading: boolean;
  onSave: (updatedData: Record<string, string | null>[]) => void;
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

  const handleDeleteRow = useCallback((rowIndex: number) => {
    setLocalTableData((prevData) =>
      prevData.filter((_, index) => index !== rowIndex)
    );
    setIsDataModified(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(localTableData);
      setIsDataModified(false);
    } finally {
      setIsSaving(false);
    }
  }, [localTableData, onSave]);

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
        <ExcelOperations
          objectCode={selectedTable.code.toLowerCase()}
          columns={metadata}
          onUpload={handleSave}
          currentData={localTableData}
        />
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
        handleDeleteRow={handleDeleteRow}
        validationResults={validationResults}
      />
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
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
