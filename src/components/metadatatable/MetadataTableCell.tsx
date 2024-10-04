import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableCell } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MetadataItem, ValidationResult } from "@/types/databaseTypes";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import React from "react";

interface MetadataTableCellProps {
  item: MetadataItem;
  row: Record<string, string | null>;
  rowIndex: number;
  handleCellChange: (
    rowIndex: number,
    columnName: string,
    value: string | null
  ) => void;
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

const getValidationErrors = (
  row: Record<string, string | null>,
  columnName: string,
  validationResults: ValidationResult[]
): ValidationResult[] => {
  return validationResults.filter((result) => {
    const rowIdMatch = row.id
      ? result.row_id === row.id
      : result.row_id === "unsaved";
    const columnMatch =
      result.column_name.toLowerCase() === columnName.toLowerCase();
    return rowIdMatch && columnMatch;
  });
};

export const MetadataTableCell: React.FC<MetadataTableCellProps> = ({
  item,
  row,
  rowIndex,
  handleCellChange,
  validationResults,
}) => {
  const inputType = getInputType(item.datatype);
  const validationErrors = getValidationErrors(
    row,
    item.code,
    validationResults
  );
  const hasError = validationErrors.length > 0;

  const commonInputProps = {
    className: cn(
      "w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm",
      hasError && "border-red-500 pr-8"
    ),
  };

  const renderInput = () => {
    if (inputType === "date") {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !row[item.code] && "text-muted-foreground",
                hasError && "border-red-500 pr-8"
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
      );
    }

    return (
      <Input
        type={inputType}
        value={row[item.code] || ""}
        onChange={(e) =>
          handleCellChange(rowIndex, item.code, e.target.value || null)
        }
        {...commonInputProps}
      />
    );
  };

  return (
    <TableCell className="px-4 py-2 text-sm">
      <div className="relative w-full">
        {renderInput()}
        {hasError && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-4 w-4 text-red-500 absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-red-500">
                    {error.validation_msg}
                  </p>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </TableCell>
  );
};
