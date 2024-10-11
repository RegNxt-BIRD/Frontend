import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DatePicker } from "../GDate";

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
  const isValidDate = (dateString: string, pattern: string): boolean => {
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(dateString);
  };

  const renderInput = () => {
    if (item.value_options && Array.isArray(item.value_options)) {
      const currentValue = row[item.code]?.toString() || "";
      return (
        <Select
          value={currentValue}
          onValueChange={(value) =>
            handleCellChange(rowIndex, item.code, value)
          }
        >
          <SelectTrigger className={cn(commonInputProps.className, "h-10")}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {item.value_options.map((option) => (
              <SelectItem
                key={option.item_code}
                value={option.item_code.toString()}
              >
                {option.item_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (inputType === "date" && item.datatype === "GregorianDay") {
      const dateValue = row[item.code];
      const datePattern =
        item.datatype_format?.split("#!#")[1]?.split("=")[1] || "";

      return (
        <DatePicker
          value={dateValue}
          onChange={(newValue) =>
            handleCellChange(rowIndex, item.code, newValue)
          }
          isValidDate={(date) =>
            isValidDate(format(date, "yyyy-MM-dd"), datePattern)
          }
          className={commonInputProps.className}
        />
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
