import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import React from "react";

interface HistoryEntry {
  valid_from: string;
  valid_to: string;
  [key: string]: any;
}

interface HistoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyData: HistoryEntry[];
  columns: Array<{
    code: string;
    label: string;
    historization_type: number;
  }>;
}

const HistoryViewModal: React.FC<HistoryViewModalProps> = ({
  isOpen,
  onClose,
  historyData,
  columns,
}) => {
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch {
      return date;
    }
  };

  const getHistorizationType = (type: number) => {
    switch (type) {
      case 0:
        return <Badge variant="outline">No historization</Badge>;
      case 1:
        return <Badge variant="secondary">Always latest</Badge>;
      case 2:
        return <Badge variant="default">Versioning</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Value History</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Valid From</TableHead>
                <TableHead>Valid To</TableHead>
                {columns.map((column) => (
                  <TableHead key={column.code}>
                    <div className="flex flex-col gap-1">
                      <span>{column.label}</span>
                      {getHistorizationType(column.historization_type)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(entry.valid_from)}</TableCell>
                  <TableCell>
                    {entry.valid_to === "9999-12-31"
                      ? "Present"
                      : formatDate(entry.valid_to)}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.code}>
                      {entry[column.code]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryViewModal;
