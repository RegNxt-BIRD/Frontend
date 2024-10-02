import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  Info,
  Key,
  Plus,
  Save,
  Search,
  Trash,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface MetadataItem {
  dataset_version_column_id: number;
  code: string;
  label: string;
  description: string;
  datatype: string;
  datatype_format: string;
  is_mandatory: boolean;
  is_key: boolean;
  value_statement: string;
  is_filter: boolean;
}

interface ValidationResult {
  dataset_version_column_id: number;
  row_id: number | string;
  severity_level: string;
  validation_msg: string;
  column_name: string;
}

interface MetadataTableProps {
  metadata: MetadataItem[] | null;
  tableData: Record<string, string | null>[];
  isLoading: boolean;
  onSave: (updatedData: Record<string, string | null>[]) => void;
  onValidate: () => void;
  selectedTable: any;
  datasetVersion: any;
  validationResults: ValidationResult[];
}

const getInputType = (datatype: string): string => {
  switch (datatype.toLowerCase()) {
    case "number":
    case "integer":
    case "float":
    case "double":
    case "integer(6)":
      return "number";
    case "gregorianday":
    case "date":
      return "date";
    default:
      return "text";
  }
};

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
      setLocalTableData(tableData);
    }
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

  const filteredMetadata = useMemo(() => {
    return (
      metadata?.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    );
  }, [metadata, searchTerm]);

  const getValidationErrors = useCallback(
    (rowIndex: number, columnName: string) => {
      const errors = validationResults.filter((result) => {
        const rowIdMatch =
          result.row_id === "N/A" ||
          result.row_id === (rowIndex + 1).toString() ||
          (typeof result.row_id === "number" && result.row_id === rowIndex + 1);
        const columnMatch =
          result.column_name.toLowerCase() === columnName.toLowerCase();
        return rowIdMatch && columnMatch;
      });

      return errors;
    },
    [validationResults]
  );

  const renderInputField = useCallback(
    (
      item: MetadataItem,
      row: Record<string, string | null>,
      rowIndex: number
    ) => {
      const inputType = getInputType(item.datatype);
      const validationErrors = getValidationErrors(rowIndex, item.code);
      const hasError =
        validationErrors.length > 0 ||
        validationResults.some(
          (result) =>
            result.column_name.toLowerCase() === item.code.toLowerCase()
        );

      const commonInputProps = {
        className: cn(
          "w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm",
          hasError && "border-red-500"
        ),
      };

      const inputComponent =
        inputType === "date" ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !row[item.code] && "text-muted-foreground",
                  hasError && "border-red-500"
                )}
              >
                {row[item.code] ? (
                  format(new Date(row[item.code] || ""), "yyyy-MM-dd")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  row[item.code] ? new Date(row[item.code] || "") : undefined
                }
                onSelect={(date) =>
                  handleCellChange(
                    rowIndex,
                    item.code,
                    date ? format(date, "yyyy-MM-dd") : null
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            type={inputType}
            value={row[item.code] || ""}
            onChange={(e) =>
              handleCellChange(rowIndex, item.code, e.target.value || null)
            }
            {...commonInputProps}
          />
        );

      return (
        <div className="relative w-full">
          {inputComponent}
          {hasError && (
            <AlertTriangle className="h-4 w-4 text-red-500 absolute right-2 top-1/2 transform -translate-y-1/2" />
          )}
          {hasError && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full h-full absolute top-0 left-0" />
                </TooltipTrigger>
                <TooltipContent>
                  {validationErrors.length > 0 ? (
                    validationErrors.map((error, index) => (
                      <p key={index} className="text-red-500">
                        {error.validation_msg}
                      </p>
                    ))
                  ) : (
                    <p className="text-red-500">
                      This column has validation errors.
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
    [handleCellChange, getValidationErrors, validationResults]
  );
  if (isLoading) {
    return (
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <Input
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="space-x-2">
          <Button onClick={handleAddRow} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
          <Button onClick={handleSave} disabled={!isDataModified}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button onClick={onValidate} variant="secondary">
            <CheckCircle className="w-4 h-4 mr-2" />
            Validate
          </Button>
        </div>
      </div>
      <div className="rounded-md border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[50px]"></TableHead>
                {filteredMetadata.map((item) => (
                  <TableHead
                    key={item.dataset_version_column_id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{item.label}</span>
                      <TooltipProvider>
                        {item.is_key && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Key className="h-3 w-3 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>Key Column</TooltipContent>
                          </Tooltip>
                        )}
                        {item.is_mandatory && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Circle className="h-3 w-3 fill-current text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>Mandatory Field</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger>
                            <Popover>
                              <PopoverTrigger>
                                <Info className="h-3 w-3 text-blue-500 cursor-pointer" />
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-4">
                                <div className="space-y-2 text-sm">
                                  <p>
                                    <strong>Code:</strong> {item.code}
                                  </p>
                                  <p>
                                    <strong>Label:</strong> {item.label}
                                  </p>
                                  <p>
                                    <strong>Description:</strong>{" "}
                                    {item.description}
                                  </p>
                                  <p>
                                    <strong>Data Type:</strong> {item.datatype}
                                  </p>
                                  <p>
                                    <strong>Is Key:</strong>{" "}
                                    {item.is_key ? "Yes" : "No"}
                                  </p>
                                  <p>
                                    <strong>Is Mandatory:</strong>{" "}
                                    {item.is_mandatory ? "Yes" : "No"}
                                  </p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TooltipTrigger>
                          <TooltipContent>Column Details</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {localTableData.length > 0 ? (
                localTableData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(rowIndex)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                    {filteredMetadata.map((item) => (
                      <TableCell
                        key={`${rowIndex}-${item.dataset_version_column_id}`}
                        className="px-4 py-2 text-sm"
                      >
                        {renderInputField(item, row, rowIndex)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={filteredMetadata.length + 1}
                    className="text-center py-4"
                  >
                    No data available. Click 'Add Row' to add new data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MetadataTable;
