import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Column } from "@/types/databaseTypes";
import { Download, Upload } from "lucide-react";
import { useRef } from "react";
import { read, utils, writeFile } from "xlsx";

interface ExcelOperationsProps {
  objectCode: string;
  columns: Column[];
  onUpload: (data: any[]) => Promise<void>;
  currentData?: any[];
  isLoading?: boolean;
}

export const ExcelOperations: React.FC<ExcelOperationsProps> = ({
  objectCode,
  columns,
  onUpload,
  currentData,
  isLoading,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null); // Added ref for file input

  // Download empty template
  const downloadTemplate = () => {
    try {
      // Create workbook with just the column headers
      const wb = utils.book_new();

      // Create main data sheet
      const headers = columns.map((col) => col.code);
      const ws = utils.aoa_to_sheet([headers]);

      // Add configuration info in hidden sheet
      const infoWs = utils.aoa_to_sheet([["object_code"], [objectCode]]);

      // Style mandatory columns
      const mandatoryCols = columns.reduce((acc: any, col, idx) => {
        if (col.is_mandatory) {
          acc[utils.encode_col(idx)] = {
            fill: { fgColor: { rgb: "CCCCCC" } },
          };
        }
        return acc;
      }, {});

      // Set column widths and styles
      ws["!cols"] = columns.map(() => ({ wch: 15 }));
      if (Object.keys(mandatoryCols).length) {
        ws["!cols"] = { ...ws["!cols"], ...mandatoryCols };
      }

      // Add sheets
      utils.book_append_sheet(wb, ws, "Data");
      utils.book_append_sheet(wb, infoWs, "info");

      // Download file
      writeFile(wb, `${objectCode}_template.xlsx`);

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      console.error("Template download error:", error);
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const validateRow = (row: Record<string, any>, index: number) => {
    const processedRow: Record<string, string | null> = {};

    columns.forEach((col) => {
      const colCode = col.code;
      let value = row[colCode];

      // Convert empty strings to null
      value = value === "" ? null : value?.toString() ?? null;

      // Validate mandatory fields
      if (col.is_mandatory && value === null) {
        throw new Error(
          `Row ${index + 1}: Missing required value for ${
            col.label || col.code
          }`
        );
      }

      // Validate data types based on column configuration
      if (value !== null) {
        switch (col.datatype.toLowerCase()) {
          case "number":
          case "decimal":
            if (isNaN(Number(value))) {
              throw new Error(
                `Row ${index + 1}: Invalid number format for ${
                  col.label || col.code
                }`
              );
            }
            break;
          case "date":
            if (isNaN(Date.parse(value))) {
              throw new Error(
                `Row ${index + 1}: Invalid date format for ${
                  col.label || col.code
                }`
              );
            }
            break;
          // Add more data type validations as needed
        }
      }

      processedRow[colCode] = value;
    });

    return processedRow;
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

          // Validate file structure
          const infoSheet = workbook.Sheets["info"];
          if (
            !infoSheet ||
            infoSheet?.A1?.v !== "object_code" ||
            infoSheet?.A2?.v !== objectCode
          ) {
            throw new Error("Invalid file format or wrong dataset selected");
          }

          // Get data sheet
          const dataSheet = workbook.Sheets[workbook.SheetNames[0]];
          if (!dataSheet) {
            throw new Error("No data found in file");
          }

          // Convert to JSON and validate
          const jsonData = utils.sheet_to_json(dataSheet, {
            raw: false,
            defval: null,
          });

          // Process and validate each row
          const processedData = jsonData.map((row: any, index: number) =>
            validateRow(row, index)
          );
          console.log("processedData: ", processedData);

          if (processedData.length === 0) {
            throw new Error("No valid data found in file");
          }

          // Upload processed data
          await onUpload(processedData);

          // Clear file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

          toast({
            title: "Success",
            description: `Processed ${processedData.length} rows successfully`,
          });
        } catch (error: any) {
          console.error("File processing error:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to process file",
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
        description: "Failed to upload file",
        variant: "destructive",
      });
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
              Template
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download empty Excel template</TooltipContent>
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
              Data
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
              Upload
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
    </div>
  );
};
