import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import React, { useMemo } from "react";
import { DatePicker } from "../GDate";
import { TableCell } from "../ui/table";

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

interface NormalizedOption {
  value: string;
  label: string;
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

const normalizeValueOptions = (
  valueOptions: any[] | undefined
): NormalizedOption[] => {
  if (!valueOptions || !Array.isArray(valueOptions)) return [];

  return valueOptions
    .map((option) => {
      // Handle LOV format
      if (option.item_code && option.item_name) {
        return {
          value: option.item_code,
          label: option.item_name,
        };
      }

      // Handle date format
      if (option.reporting_date) {
        const formattedDate = option.reporting_date.toString();
        // Convert YYYYMMDD to YYYY-MM-DD if needed
        const dateValue =
          formattedDate.length === 8
            ? `${formattedDate.slice(0, 4)}-${formattedDate.slice(
                4,
                6
              )}-${formattedDate.slice(6, 8)}`
            : formattedDate;
        return {
          value: dateValue,
          label: dateValue,
        };
      }

      // Handle any other key-value pair
      const entries = Object.entries(option);
      if (entries.length > 0) {
        const [key, value] = entries[0]; // Take first key-value pair
        const stringValue = value?.toString() || "";
        return {
          value: stringValue,
          label: stringValue,
        };
      }

      return {
        value: "",
        label: "",
      };
    })
    .filter((option) => option.value !== ""); // Filter out empty options
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
  const currentValue = row[item.code]?.toString() || "";

  const normalizedOptions = useMemo(() => {
    return normalizeValueOptions(item.value_options);
  }, [item.value_options]);

  const commonInputProps = {
    className: cn(
      "w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm",
      hasError && "border-red-500 pr-8"
    ),
  };

  const isValidDate = (dateString: string, pattern: string): boolean => {
    if (!pattern) return true;
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(dateString);
  };

  const renderInput = () => {
    // Handle Select for value_options
    if (normalizedOptions.length > 0) {
      return (
        <Select
          value={currentValue}
          onValueChange={(value) =>
            handleCellChange(rowIndex, item.code, value)
          }
          // disabled={item.is_system_generated}
        >
          <SelectTrigger className={cn(commonInputProps.className, "h-10")}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {normalizedOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Handle Date inputs
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
          // disabled={item.is_system_generated}
        />
      );
    }

    // Default Input
    return (
      <Input
        type={inputType}
        value={currentValue}
        onChange={(e) =>
          handleCellChange(rowIndex, item.code, e.target.value || null)
        }
        // disabled={item.is_system_generated}
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
