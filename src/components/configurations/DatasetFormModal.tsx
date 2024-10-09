import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dataset } from "@/types/databaseTypes";
import React, { useEffect, useState } from "react";

interface DatasetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dataset: Partial<Dataset>) => void;
  initialData?: Dataset;
  frameworks: { code: string; name: string }[];
  layers: { code: string; name: string }[];
}

export const DatasetFormModal: React.FC<DatasetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  frameworks,
  layers,
}) => {
  const [formData, setFormData] = useState<Partial<Dataset>>(initialData || {});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({});
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
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
            {initialData ? "Edit Dataset" : "Create Dataset"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
          <Select
            onValueChange={handleSelectChange("framework")}
            value={formData.framework}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Framework" />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map((framework) => (
                <SelectItem key={framework.code} value={framework.code}>
                  {framework.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleSelectChange("type")}
            value={formData.type}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Layer" />
            </SelectTrigger>
            <SelectContent>
              {layers.map((layer) => (
                <SelectItem key={layer.code} value={layer.code}>
                  {layer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
