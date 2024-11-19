import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, string | null>[];
  columns: any[];
  onSave: (data: Record<string, string | null>[]) => Promise<void>;
}

const ExcelPreviewModal = ({
  isOpen,
  onClose,
  data,
  columns,
  onSave,
}: ExcelPreviewModalProps) => {
  const [previewData, setPreviewData] = useState<
    Record<string, string | null>[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  // Update previewData when data prop changes
  useEffect(() => {
    if (data && data.length > 0) {
      setPreviewData(data);
    }
  }, [data]);

  const handleCellChange = (
    rowIndex: number,
    columnName: string,
    value: string | null
  ) => {
    setPreviewData((prevData) => {
      const newData = [...prevData];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnName]: value === "" ? null : value,
      };
      return newData;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(previewData);
      onClose();
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Debug logging
  console.log("Preview Data:", previewData);
  console.log("Incoming Data:", data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Preview Excel Data ({previewData.length} rows)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row #</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column.code}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.length > 0 ? (
                  previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="font-medium">
                        {rowIndex + 1}
                      </TableCell>
                      {columns.map((column) => (
                        <TableCell key={column.code} className="p-0">
                          <Input
                            type="text"
                            value={row[column.code] || ""}
                            onChange={(e) =>
                              handleCellChange(
                                rowIndex,
                                column.code,
                                e.target.value
                              )
                            }
                            className="border-0 h-8 focus:ring-offset-0"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center py-4"
                    >
                      No data to display
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <DialogFooter className="space-x-2">
          <div className="flex-1 text-sm text-gray-500">
            {previewData.length} row(s) loaded
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || previewData.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelPreviewModal;
