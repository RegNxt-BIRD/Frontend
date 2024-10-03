// MetadataTableCell.tsx
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
  rowIndex: number,
  columnName: string,
  validationResults: ValidationResult[]
): ValidationResult[] => {
  return validationResults.filter((result) => {
    const rowIdMatch =
      result.row_id === "N/A" ||
      result.row_id === (rowIndex + 1).toString() ||
      (typeof result.row_id === "number" && result.row_id === rowIndex + 1);
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
    rowIndex,
    item.code,
    validationResults
  );
  const hasError =
    validationErrors.length > 0 ||
    validationResults.some(
      (result) => result.column_name.toLowerCase() === item.code.toLowerCase()
    );

  const commonInputProps = {
    className: cn(
      "w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm",
      hasError && "border-red-500"
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
          <>
            <AlertTriangle className="h-4 w-4 text-red-500 absolute right-2 top-1/2 transform -translate-y-1/2" />
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
          </>
        )}
      </div>
    </TableCell>
  );
};
