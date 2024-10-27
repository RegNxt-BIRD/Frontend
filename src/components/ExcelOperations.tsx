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
  onDataLoad?: (data: Record<string, string | null>[]) => void; // New callback for data loading
}

export const ExcelOperations: React.FC<ExcelOperationsProps> = ({
  objectCode,
  columns,
  onDataLoad,
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

  const processExcelData = (
    data: Record<string, any>[]
  ): Record<string, string | null>[] => {
    return data.map((row) => {
      const processedRow: Record<string, string | null> = {};

      columns.forEach((column) => {
        let value = row[column.code];

        // Handle different data types
        if (value !== undefined && value !== null) {
          if (column.datatype.toLowerCase() === "gregorianday") {
            // Convert date formats if needed
            try {
              const dateStr = value.toString();
              if (dateStr.length === 8) {
                // Format YYYYMMDD
                value = `${dateStr.slice(0, 4)}-${dateStr.slice(
                  4,
                  6
                )}-${dateStr.slice(6, 8)}`;
              }
            } catch (e) {
              console.warn(
                `Failed to format date for column ${column.code}:`,
                e
              );
            }
          }
          processedRow[column.code] = value.toString();
        } else {
          processedRow[column.code] = null;
        }
      });

      return processedRow;
    });
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

          // Get first sheet
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          if (!firstSheet) {
            throw new Error("No data sheet found in file");
          }

          // Convert to JSON with header row mapping
          const jsonData = utils.sheet_to_json(firstSheet, {
            raw: false,
            defval: null,
            header: columns.map((col) => col.code), // Map headers to column codes
          });

          // Remove header row if it was included
          if (
            jsonData.length > 0 &&
            Object.keys(jsonData[0]).every((key) => key === jsonData[0][key])
          ) {
            jsonData.shift();
          }

          // Process the data
          const processedData = processExcelData(jsonData);

          // Send to MetadataTable to append
          if (onDataLoad) {
            onDataLoad(processedData);
          }

          // Clear file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } catch (error: any) {
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
    </div>
  );
};
