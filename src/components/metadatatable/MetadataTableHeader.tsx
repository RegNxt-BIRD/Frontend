// MetadataTableHeader.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Plus, Save, Search } from "lucide-react";
import React from "react";

interface MetadataTableHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleAddRow: () => void;
  handleSave: () => void;
  onValidate: () => void;
  isDataModified: boolean;
}

export const MetadataTableHeader: React.FC<MetadataTableHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  handleAddRow,
  handleSave,
  onValidate,
  isDataModified,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <Search className="w-5 h-5 text-gray-500 mr-2" />
      <Input
        placeholder="Search columns..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
    </div>
    <div className="space-x-2">
      <Button onClick={handleAddRow} variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        Add Row
      </Button>
      <Button onClick={handleSave} disabled={!isDataModified}>
        <Save className="w-4 h-4 mr-2" />
        Save Changes
      </Button>
      <Button onClick={onValidate} variant="secondary">
        <CheckCircle className="w-4 h-4 mr-2" />
        Validate
      </Button>
    </div>
  </div>
);
