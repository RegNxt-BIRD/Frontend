import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { read, utils, writeFile, WritingOptions } from "xlsx";
import ExcelPreviewModal from "./ExcelPreviewModal";

interface MetadataItem {
  code: string;
  datatype?: string;
  value_options?: Array<{
    value?: string;
    item_code?: string;
    reporting_date?: string;
    entity?: string;
  }>;
}

interface ExcelOperationsProps {
  objectCode: string;
  columns: MetadataItem[];
  onUpload: any;
  currentData?: any[];
  isLoading?: boolean;
}

export const ExcelOperations: React.FC<ExcelOperationsProps> = ({
  objectCode,
  columns,
  // onDataLoad,
  onUpload,
  currentData,
  isLoading,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null); // Added ref for file input
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<
    Record<string, string | null>[]
  >([]);

  const downloadTemplate = () => {
    try {
      const wb = utils.book_new();

      // Create validation sheet with columns that have value_options
      const columnsWithValidation = columns?.filter(
        (col) => col.value_options && col.value_options.length > 0
      );

      // Create validation sheet
      const validationData: string[][] = [];

      // Add headers
      validationData.push(columnsWithValidation.map((col) => col.code));

      // Find max length of validation options
      const maxLength = Math.max(
        ...columnsWithValidation.map((col) => col.value_options?.length || 0)
      );

      // Fill validation data
      for (let i = 0; i < maxLength; i++) {
        const row = columnsWithValidation.map((col) => {
          const option = col.value_options?.[i];
          if (!option) return "";
          return String(
            option.item_code ||
              option.value ||
              option.reporting_date ||
              option.entity ||
              ""
          );
        });
        validationData.push(row);
      }

      const validationWs = utils.aoa_to_sheet(validationData);

      // Create data sheet
      const dataHeaders = columns.map((col) => col.code);
      const dataWs = utils.aoa_to_sheet([dataHeaders]);

      // Initialize Workbook properties if they don't exist
      if (!wb.Workbook) {
        wb.Workbook = { Names: [] };
      }
      if (!wb.Workbook.Names) {
        wb.Workbook.Names = [];
      }

      // Add validation to columns that have value_options
      columnsWithValidation.forEach((col, validationColIndex) => {
        const dataColIndex = dataHeaders.indexOf(col.code);
        if (dataColIndex !== -1) {
          const dataColLetter = utils.encode_col(dataColIndex);
          const validationColLetter = utils.encode_col(validationColIndex);

          // Add data validation properties
          if (!dataWs["!dataValidations"]) {
            dataWs["!dataValidations"] = [];
          }

          // Create the validation range (excluding header)
          const validationRange = {
            sqref: `${dataColLetter}2:${dataColLetter}1000`,
            type: "list",
            formula1: `Validation!$${validationColLetter}$2:$${validationColLetter}$${
              maxLength + 1
            }`,
            allowBlank: true,
            showDropDown: true,
            error: null,
            errorTitle: null,
            errorStyle: null,
            promptTitle: null,
            prompt: null,
          };

          dataWs["!dataValidations"].push(validationRange);
        }
      });

      columnsWithValidation.forEach((col, validationColIndex) => {
        const validationColLetter = utils.encode_col(validationColIndex);
        wb?.Workbook?.Names?.push({
          Name: `_xlfn.${col.code}_VALIDATION`,
          Ref: `Validation!$${validationColLetter}$2:$${validationColLetter}$${
            maxLength + 1
          }`,
          Sheet: 1,
        });
      });

      // Set column widths
      const wscols = dataHeaders.map(() => ({ wch: 20 }));
      dataWs["!cols"] = wscols;

      // Add sheets to workbook
      utils.book_append_sheet(wb, dataWs, "Data");
      utils.book_append_sheet(wb, validationWs, "Validation");
      utils.book_append_sheet(
        wb,
        utils.aoa_to_sheet([["object_code"], [objectCode]]),
        "Info"
      );

      const opts: WritingOptions = {
        bookType: "xlsx",
        bookSST: false,
        type: "binary",
        cellDates: true,
        cellStyles: true,
        compression: true,
      };

      writeFile(wb, `${objectCode}_template.xlsx`, opts);

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      console.error("Template creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const handleSavePreview = async (data: Record<string, string | null>[]) => {
    try {
      await onUpload({ data });
      toast({
        title: "Success",
        description: `Successfully uploaded ${data.length} rows of data`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Download current data
  const downloadData = () => {
    try {
      if (!currentData?.length) {
        toast({
          title: "No Data",
          description: "No data available to download",
          variant: "destructive",
        });
        return;
      }

      const wb = utils.book_new();

      // Convert data with headers
      const wsData = [
        columns.map((col) => col.code),
        ...currentData.map((row) => columns.map((col) => row[col.code])),
      ];

      // Create sheets
      const ws = utils.aoa_to_sheet(wsData);
      const infoWs = utils.aoa_to_sheet([["object_code"], [objectCode]]);

      utils.book_append_sheet(wb, ws, "Data");
      utils.book_append_sheet(wb, infoWs, "info");

      writeFile(wb, `${objectCode}_data.xlsx`);

      toast({
        title: "Success",
        description: "Data downloaded successfully",
      });
    } catch (error) {
      console.error("Data download error:", error);
      toast({
        title: "Error",
        description: "Failed to download data",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      toast({
        title: "Processing",
        description: "Reading file data...",
      });

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // First get all the data without header mapping
          const rawData = utils.sheet_to_json(firstSheet, {
            raw: false,
            defval: null,
            header: 1, // This gets data with numeric indices
          }) as any[];

          // Remove the header row
          const headerRow = rawData.shift() || [];

          // Create a mapping of Excel columns to our column codes
          const columnMapping: { [key: string]: string } = {};
          headerRow.forEach((header: string, index: number) => {
            // Find matching column in our columns array
            const matchingColumn = columns.find((col) => col.code === header);
            if (matchingColumn) {
              columnMapping[index] = matchingColumn.code;
            }
          });

          // Map the data using our column mapping
          const processedData = rawData.map((row) => {
            const mappedRow: Record<string, string | null> = {};

            // Initialize all columns with null
            columns.forEach((col) => {
              mappedRow[col.code] = null;
            });

            Object.entries(columnMapping).forEach(([index, code]) => {
              const value = row[parseInt(index)];
              if (value !== undefined && value !== null && value !== "") {
                const column = columns.find((col) => col.code === code);
                if (
                  column?.datatype &&
                  column?.datatype.toLowerCase() === "gregorianday"
                ) {
                  const dateStr = value.toString();
                  if (dateStr.length === 8) {
                    mappedRow[code] = `${dateStr.slice(0, 4)}-${dateStr.slice(
                      4,
                      6
                    )}-${dateStr.slice(6, 8)}`;
                  } else {
                    mappedRow[code] = dateStr;
                  }
                } else {
                  mappedRow[code] = value.toString();
                }
              }
            });

            return mappedRow;
          });

          // Filter out empty rows
          const filteredData = processedData.filter((row) =>
            Object.values(row).some((value) => value !== null && value !== "")
          );

          if (filteredData.length === 0) {
            toast({
              title: "Warning",
              description: "No valid data found in the file",
              variant: "destructive",
            });
            return;
          }

          setPreviewData(filteredData);
          setIsPreviewModalOpen(true);

          toast({
            title: "Success",
            description: `Found ${filteredData.length} rows of data`,
          });
        } catch (error) {
          console.error("File processing error:", error);
          toast({
            title: "Error",
            description: "Failed to process file. Please check the format.",
            variant: "destructive",
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download empty template</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={downloadData}
              disabled={isLoading || !currentData?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Save Data
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download current data as Excel</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload Excel file</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".xlsx,.xls"
        onChange={handleUpload}
        disabled={isLoading}
      />
      <ExcelPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        data={previewData}
        columns={columns}
        onSave={handleSavePreview}
      />
    </div>
  );
};
