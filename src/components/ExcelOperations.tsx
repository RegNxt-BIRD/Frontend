import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import * as ExcelJS from "exceljs";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface MetadataItem {
  code: string;
  datatype?: string;
  value_options?: Array<{
    value?: string;
    item_code?: string;
    reporting_date?: string;
    entity?: string;
  }>;
  label: string;
}

interface ExcelOperationsProps {
  objectCode: string;
  columns: MetadataItem[];
  onUpload: (data: any) => Promise<void>;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data");

      // Add headers
      const headers = columns.map((col) => col.label);
      worksheet.addRow(headers);

      // Set column widths and add data validation where applicable
      columns.forEach((col, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = 15;

        if (col.value_options?.length) {
          const values = col.value_options
            .map(
              (opt) =>
                opt.item_code ||
                opt.value ||
                opt.reporting_date ||
                opt.entity ||
                ""
            )
            .filter(Boolean);

          if (values.length) {
            const dataValidation = {
              type: "list" as const,
              allowBlank: true,
              formulae: [`"${values.join(",")}"`],
            };
            worksheet
              .getColumn(index + 1)
              .eachCell({ includeEmpty: true }, (cell) => {
                if (cell.row > 1) {
                  // Skip header row
                  cell.dataValidation = dataValidation;
                }
              });
          }
        }
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${objectCode}_template.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

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

  const downloadData = async () => {
    try {
      if (!currentData?.length) {
        toast({
          title: "No Data",
          description: "No data available to download",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data");

      // Add headers
      worksheet.addRow(columns.map((col) => col.label));

      // Add data
      currentData.forEach((row) => {
        const rowData = columns.map((col) => row[col.code]);
        worksheet.addRow(rowData);
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${objectCode}_data.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

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

      setIsUploading(true);
      toast({
        title: "Processing",
        description: "Reading file data...",
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error("No worksheet found in the uploaded file");
      }

      const headers = worksheet.getRow(1).values as string[];
      headers.shift(); // Remove the first empty value

      // Create a mapping of Excel columns to our column codes
      const columnMapping = new Map<number, string>();
      headers.forEach((header, index) => {
        const matchingColumn = columns.find((col) => col.label === header);
        if (matchingColumn) {
          columnMapping.set(index + 1, matchingColumn.code);
        }
      });

      // Process rows
      const processedData: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData: any = {};
        columnMapping.forEach((code, index) => {
          const cellValue = row.getCell(index).value;
          if (cellValue !== null && cellValue !== undefined) {
            rowData[code] = cellValue;
          }
        });

        // Only add rows that have at least one non-empty value
        if (Object.keys(rowData).length > 0) {
          processedData.push(rowData);
        }
      });

      if (processedData.length === 0) {
        toast({
          title: "Warning",
          description: "No valid data found in the file",
          variant: "destructive",
        });
        return;
      }

      await onUpload({ data: processedData });
      toast({
        title: "Success",
        description: `Successfully uploaded ${processedData.length} rows of data`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
              disabled={isLoading || isUploading}
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
        disabled={isLoading || isUploading}
      />
    </div>
  );
};
