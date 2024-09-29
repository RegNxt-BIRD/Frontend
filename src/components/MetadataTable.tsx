import { Button } from "@/components/ui/button";
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
import { Circle, Info, Key, Plus, Save, Search, Trash } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

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

interface MetadataTableProps {
  metadata: MetadataItem[];
  tableData: Record<string, string>[];
  isLoading: boolean;
  onSave: (updatedData: Record<string, string>[]) => void;
}

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
    value: string
  ) => {
    const newTableData = [...localTableData];
    newTableData[rowIndex] = { ...newTableData[rowIndex], [columnName]: value };
    setLocalTableData(newTableData);
    setIsDataModified(true);
  };

  const handleAddRow = () => {
    const newRow: Record<string, string> = {};
    metadata.forEach((column) => {
      newRow[column.columnName] = "";
    });
    setLocalTableData([...localTableData, newRow]);
    setIsDataModified(true);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newTableData = localTableData.filter(
      (_, index) => index !== rowIndex
    );
    setLocalTableData(newTableData);
    setIsDataModified(true);
  };

  const handleSave = () => {
    onSave(localTableData);
    setIsDataModified(false);
  };

  const filteredMetadata = useMemo(
    () =>
      metadata.filter((item) =>
        item.columnLabel.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [metadata, searchTerm]
  );

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
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
                {filteredMetadata?.map((item) => (
                  <TableHead
                    key={item.columnId}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{item.columnLabel}</span>
                      <TooltipProvider>
                        {item.isKey && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Key className="h-3 w-3 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>Key Column</TooltipContent>
                          </Tooltip>
                        )}
                        {item.isMandatory && (
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
                                    <strong>Name:</strong> {item.columnName}
                                  </p>
                                  <p>
                                    <strong>Label:</strong> {item.columnLabel}
                                  </p>
                                  <p>
                                    <strong>Type:</strong>{" "}
                                    {item.columnDataType || "N/A"}
                                  </p>
                                  <p>
                                    <strong>Is Key:</strong>{" "}
                                    {item.isKey ? "Yes" : "No"}
                                  </p>
                                  <p>
                                    <strong>Is Mandatory:</strong>{" "}
                                    {item.isMandatory ? "Yes" : "No"}
                                  </p>
                                  <p>
                                    <strong>Is Filter:</strong>{" "}
                                    {item.isFilter ? "Yes" : "No"}
                                  </p>
                                  <p>
                                    <strong>Filter Statement:</strong>{" "}
                                    {item.filterStatement || "N/A"}
                                  </p>
                                  <p>
                                    <strong>Exists Physically:</strong>{" "}
                                    {item.existPhysically ? "Yes" : "No"}
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
              {localTableData?.map((row, rowIndex) => (
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
                  {filteredMetadata?.map((item) => (
                    <TableCell
                      key={`${rowIndex}-${item.columnId}`}
                      className="px-4 py-2 text-sm"
                    >
                      <Input
                        value={row[item.columnName] || ""}
                        onChange={(e) =>
                          handleCellChange(
                            rowIndex,
                            item.columnName,
                            e.target.value
                          )
                        }
                        className="w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MetadataTable;
