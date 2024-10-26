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
import { read, utils, writeFile } from "xlsx";

interface ExcelOperationsProps {
  objectCode: string;
  columns: Column[];
  onUpload: (data: any[]) => Promise<void>;
  currentData?: any[];
}

export const ExcelOperations: React.FC<ExcelOperationsProps> = ({
  objectCode,
  columns,
  onUpload,
  currentData,
}) => {
  const { toast } = useToast();

  const downloadTemplate = () => {
    try {
      // Create header rows (codes and labels)
      const codeHeaders = columns.map((col) => col.code);
      const labelHeaders = columns.map((col) => col.label);

      // Create workbook
      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet([codeHeaders, labelHeaders]);

      // Add hidden info sheet
      const infoWs = utils.aoa_to_sheet([["object_code"], [objectCode]]);

      // Style mandatory columns
      const mandatoryCols = columns.reduce((acc: any, col, idx) => {
        if (col.is_mandatory) {
          acc[utils.encode_col(idx)] = { fill: { fgColor: { rgb: "CCCCCC" } } };
        }
        return acc;
      }, {});

      ws["!cols"] = columns.map(() => ({ wch: 15 }));
      if (Object.keys(mandatoryCols).length) {
        ws["!cols"] = { ...ws["!cols"], ...mandatoryCols };
      }

      // Add sheets to workbook
      utils.book_append_sheet(wb, ws, "Data");
      utils.book_append_sheet(wb, infoWs, "info");

      // Download file
      writeFile(wb, `${objectCode}_template.xlsx`);

      toast({
        title: "Success",
        description: "Template downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "Failed to download template.",
        variant: "destructive",
      });
    }
  };

  const downloadData = () => {
    try {
      if (!currentData?.length) {
        toast({
          title: "Warning",
          description: "No data available to download.",
          variant: "destructive",
        });
        return;
      }

      // Create workbook with current data
      const wb = utils.book_new();

      // Convert data to worksheet format
      const wsData = [
        columns.map((col) => col.code),
        columns.map((col) => col.label),
        ...currentData.map((row) => columns.map((col) => row[col.code])),
      ];

      const ws = utils.aoa_to_sheet(wsData);
      const infoWs = utils.aoa_to_sheet([["object_code"], [objectCode]]);

      // Add sheets and download
      utils.book_append_sheet(wb, ws, "Data");
      utils.book_append_sheet(wb, infoWs, "info");
      writeFile(wb, `${objectCode}_data.xlsx`);

      toast({
        title: "Success",
        description: "Data downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading data:", error);
      toast({
        title: "Error",
        description: "Failed to download data.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: "array" });

          // Verify info sheet and object_code
          const infoSheet = workbook.Sheets["info"];
          if (
            !infoSheet ||
            infoSheet?.A1?.v !== "object_code" ||
            infoSheet?.A2?.v !== objectCode
          ) {
            throw new Error("Invalid file format or wrong dataset");
          }

          // Get data sheet
          const dataSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(dataSheet, { header: 1 });

          // Validate headers
          const headerRow = jsonData[0] as string[];
          const validHeaders = columns.every((col) =>
            headerRow.includes(col.code)
          );

          if (!validHeaders) {
            throw new Error("Invalid column headers");
          }

          // Convert to required format
          const processedData = jsonData.slice(2).map((row: any) => {
            const rowData: any = {};
            headerRow.forEach((header, index) => {
              rowData[header] = row[index];
            });
            return rowData;
          });

          // Upload data
          await onUpload(processedData);

          toast({
            title: "Success",
            description: "Data uploaded successfully.",
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to process file.",
            variant: "destructive",
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={downloadTemplate}>
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
              disabled={!currentData?.length}
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
            <div>
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Button variant="outline" as="span">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </label>
              <input
                id="excel-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleUpload}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>Upload Excel file</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
