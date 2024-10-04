import { Skeleton } from "@/components/ui/skeleton";
import { MetadataItem, ValidationResult } from "@/types/databaseTypes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  const handleSave = useCallback(() => {
    onSave(localTableData);
    setIsDataModified(false);
  }, [localTableData, onSave]);

  const handleValidate = useCallback(() => {
    onValidate(localTableData);
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
    return <div>No metadata available</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">
        Data for table {selectedTable.code} | {selectedTable.label}{" "}
        {datasetVersion && `| Version ${datasetVersion.version_nr}`}
      </h3>
      <MetadataTableHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleAddRow={handleAddRow}
        handleSave={handleSave}
        onValidate={handleValidate}
        isDataModified={isDataModified}
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
