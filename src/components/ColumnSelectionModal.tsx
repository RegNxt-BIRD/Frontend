import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState } from "react";

interface ColumnSelectionModalProps {
  sourceNode: any;
  targetNode: any;
  onClose: () => void;
  onSelect: (sourceColumn: string, targetColumn: string) => void;
  initialSourceColumn?: string;
  initialTargetColumn?: string;
}

const ColumnSelectionModal: React.FC<ColumnSelectionModalProps> = ({
  sourceNode,
  targetNode,
  onClose,
  onSelect,
  initialSourceColumn,
  initialTargetColumn,
}) => {
  const [sourceColumn, setSourceColumn] = useState(initialSourceColumn || "");
  const [targetColumn, setTargetColumn] = useState(initialTargetColumn || "");

  const handleSubmit = () => {
    onSelect(sourceColumn, targetColumn);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Columns for Relationship</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="sourceColumn" className="text-right">
              Source Column
            </label>
            <Select value={sourceColumn} onValueChange={setSourceColumn}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select source column" />
              </SelectTrigger>
              <SelectContent>
                {sourceNode.data.columns.map((column: any) => (
                  <SelectItem key={column.name} value={column.name}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="targetColumn" className="text-right">
              Target Column
            </label>
            <Select value={targetColumn} onValueChange={setTargetColumn}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select target column" />
              </SelectTrigger>
              <SelectContent>
                {targetNode.data.columns.map((column: any) => (
                  <SelectItem key={column.name} value={column.name}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnSelectionModal;
