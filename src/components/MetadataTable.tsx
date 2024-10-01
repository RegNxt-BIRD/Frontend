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
import { Circle, Info, Key, Plus, Save, Search, Trash } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

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

interface MetadataTableProps {
  metadata: MetadataItem[] | null;
  tableData: Record<string, string>[];
  isLoading: boolean;
  onSave: (updatedData: Record<string, string>[]) => void;
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
      return "date";
    case "???":
    case "string":
    default:
      return "text";
  }
};

export const MetadataTable: React.FC<MetadataTableProps> = ({
  metadata,
  tableData,
  isLoading,
  onSave,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [localTableData, setLocalTableData] = useState<
    Record<string, string>[]
  >([]);
  const [isDataModified, setIsDataModified] = useState(false);

  useEffect(() => {
    setLocalTableData(tableData);
    setIsDataModified(false);
  }, [tableData]);

  const handleCellChange = (
    rowIndex: number,
    columnName: string,
    value: string | boolean
  ) => {
    setLocalTableData((prevData) => {
      const newData = [...prevData];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnName]: value.toString(),
      };
      return newData;
    });
    setIsDataModified(true);
  };

  const handleAddRow = () => {
    if (!metadata) return;
    const newRow = Object.fromEntries(
      metadata.map((column) => [column.code, ""])
    );
    setLocalTableData((prevData) => [...prevData, newRow]);
    setIsDataModified(true);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setLocalTableData((prevData) =>
      prevData.filter((_, index) => index !== rowIndex)
    );
    setIsDataModified(true);
  };

  const handleSave = () => {
    onSave(localTableData);
    setIsDataModified(false);
  };

  const filteredMetadata = useMemo(() => {
    return (
      metadata?.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    );
  }, [metadata, searchTerm]);

  const renderInputField = (
    item: MetadataItem,
    row: Record<string, string>,
    rowIndex: number
  ) => {
    const inputType = getInputType(item.datatype);

    switch (inputType) {
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !row[item.code] && "text-muted-foreground"
                )}
              >
                {row[item.code] ? (
                  format(new Date(row[item.code]), "yyyy-MM")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={row[item.code] ? new Date(row[item.code]) : undefined}
                onSelect={(date) =>
                  handleCellChange(
                    rowIndex,
                    item.code,
                    date ? format(date, "yyyy-MM-dd") : ""
                  )
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      default:
        return (
          <Input
            type={inputType}
            value={row[item.code] || ""}
            onChange={(e) =>
              handleCellChange(rowIndex, item.code, e.target.value)
            }
            className="w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm"
          />
        );
    }
  };

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!metadata || metadata.length === 0) {
    return <div>No metadata available</div>;
  }

  return (
    <div className="space-y-4">
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
