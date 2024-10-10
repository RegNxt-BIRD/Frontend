import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatasetVersion } from "@/types/databaseTypes";
import React, { useEffect, useState } from "react";
import DatePicker from "./VersionDatePicker";

interface DatasetVersionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (version: Partial<DatasetVersion>) => void;
  initialData?: DatasetVersion;
}

export const DatasetVersionFormModal: React.FC<
  DatasetVersionFormModalProps
> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<DatasetVersion>>(
    initialData || {}
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const currentDate = new Date().toISOString().split("T")[0];
      setFormData({ valid_from: currentDate, valid_to: currentDate });
    }
  }, [initialData, isOpen]);

  const handleDateChange = (
    name: keyof DatasetVersion,
    date: Date | undefined
  ) => {
    if (date) {
      const formattedDate = date.toISOString().split(".")[0]; // This will give 'YYYY-MM-DDTHH:MM:SS'
      setFormData((prev) => ({ ...prev, [name]: formattedDate }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Dataset Version" : "Create Dataset Version"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="version_nr"
            placeholder="Version Number"
            value={formData.version_nr || ""}
            onChange={(e) =>
              setFormData({ ...formData, version_nr: e.target.value })
            }
          />
          <Input
            name="version_code"
            placeholder="Version Code"
            value={formData.version_code || ""}
            onChange={handleChange}
          />
          <Input
            name="code"
            placeholder="Code"
            value={formData.code || ""}
            onChange={handleChange}
          />
          <Input
            name="label"
            placeholder="Label"
            value={formData.label || ""}
            onChange={handleChange}
          />
          <Input
            name="description"
            placeholder="Description"
            value={formData.description || ""}
            onChange={handleChange}
          />
          <DatePicker
            onSelect={(date) => handleDateChange("valid_from", date)}
            initialDate={
              formData.valid_from ? new Date(formData.valid_from) : undefined
            }
          />

          <DatePicker
            onSelect={(date) => handleDateChange("valid_to", date)}
            initialDate={
              formData.valid_to ? new Date(formData.valid_to) : undefined
            }
          />
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
