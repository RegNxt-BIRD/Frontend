import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Column } from "@/types/databaseTypes";
import { Info, Plus, Save, Trash } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface EditableColumnTableProps {
  initialColumns: Column[];
  onSave: any;
  isLoading?: boolean;
  versionId: string | number;
}

const COLUMN_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "decimal", label: "Decimal" },
];

const ROLES = [
  { value: "D", label: "Dimension" },
  { value: "M", label: "Measure" },
  { value: "A", label: "Attribute" },
];

const HISTORIZATION_TYPES = [
  { value: 0, label: "No historization" },
  { value: 1, label: "Always latest" },
  { value: 2, label: "Versioning" },
];

export const EditableColumnTable: React.FC<EditableColumnTableProps> = ({
  initialColumns,
  onSave,
  isLoading,
  versionId,
}) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [modifiedColumns, setModifiedColumns] = useState(new Set<number>());
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Reset when initial columns change
  useEffect(() => {
    setColumns(initialColumns);
    setModifiedColumns(new Set());
  }, [initialColumns]);
  // Filtered columns based on search
  const filteredColumns = useMemo(() => {
    return columns.filter(
      (column) =>
        column.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        column.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [columns, searchTerm]);

  // Handle column updates
  const handleColumnChange = useCallback(
    (index: number, field: keyof Column, value: any) => {
      setColumns((prev) => {
        const newColumns = [...prev];
        const column = { ...newColumns[index], [field]: value };
        newColumns[index] = column;

        if (column.dataset_version_column_id) {
          setModifiedColumns(
            (prev) => new Set(prev.add(column.dataset_version_column_id))
          );
        }
        return newColumns;
      });
    },
    []
  );

  // Add new column
  const handleAddColumn = useCallback(() => {
    const newColumn: Column = {
      dataset_version_column_id: 0,
      dataset_version_id: Number(versionId),
      column_order: columns.length + 1,
      code: "",
      label: "",
      description: "",
      role: "A",
      dimension_type: "",
      datatype: "string",
      datatype_format: "",
      is_mandatory: false,
      is_key: false,
      value_statement: "",
      is_filter: false,
      is_report_snapshot_field: false,
      is_system_generated: false,
      historization_type: 1,
      is_visible: false,
    };
    setColumns((prev) => [...prev, newColumn]);
  }, [columns.length, versionId]);

  // Delete column
  const handleDeleteColumn = useCallback(
    (index: number) => {
      const column = columns[index];
      if (column.is_system_generated) {
        toast({
          title: "Cannot delete system column",
          description: "System-generated columns cannot be deleted.",
          variant: "destructive",
        });
        return;
      }

      setColumns((prev) => prev.filter((_, i) => i !== index));
      if (column.dataset_version_column_id) {
        setModifiedColumns((prev) => {
          const newSet = new Set(prev);
          newSet.delete(column.dataset_version_column_id);
          return newSet;
        });
      }
    },
    [columns, toast]
  );

  // Save changes
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate columns
      const errors = validateColumns(columns);
      if (errors.length > 0) {
        toast({
          title: "Validation errors",
          description: errors.join("\n"),
          variant: "destructive",
        });
        return;
      }

      await onSave(columns);
      setModifiedColumns(new Set());
      toast({
        title: "Success",
        description: "Columns updated successfully",
      });
    } catch (error) {
      console.error("Error saving columns:", error);
      toast({
        title: "Error",
        description: "Failed to save columns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateColumns = (columns: Column[]): string[] => {
    const errors: string[] = [];
    const codes = new Set<string>();

    columns.forEach((column, index) => {
      if (!column.code) {
        errors.push(`Column ${index + 1} must have a code`);
      } else if (codes.has(column.code)) {
        errors.push(`Duplicate column code: ${column.code}`);
      }
      codes.add(column.code);

      if (!column.label) {
        errors.push(`Column ${column.code} must have a label`);
      }

      if (!column.datatype) {
        errors.push(`Column ${column.code} must have a data type`);
      }
    });

    return errors;
  };

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Search by column code or label</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-x-2">
          <Button onClick={handleAddColumn} disabled={isLoading || isSaving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving || modifiedColumns.size === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Column table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Historization</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Filter</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColumns.map((column, index) => (
              <TableRow
                key={column.dataset_version_column_id || `new-${index}`}
                className={column.is_system_generated ? "bg-muted/50" : ""}
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteColumn(index)}
                    disabled={column.is_system_generated}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
                <TableCell>
                  <Input
                    value={column.code}
                    onChange={(e) =>
                      handleColumnChange(index, "code", e.target.value)
                    }
                    disabled={column.is_system_generated}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={column.label}
                    onChange={(e) =>
                      handleColumnChange(index, "label", e.target.value)
                    }
                    disabled={column.is_system_generated}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={column.datatype}
                    onValueChange={(value) =>
                      handleColumnChange(index, "datatype", value)
                    }
                    disabled={column.is_system_generated}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={column.role}
                    onValueChange={(value) =>
                      handleColumnChange(index, "role", value)
                    }
                    disabled={column.is_system_generated}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={column.historization_type.toString()}
                    onValueChange={(value) =>
                      handleColumnChange(
                        index,
                        "historization_type",
                        parseInt(value)
                      )
                    }
                    disabled={column.is_system_generated}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HISTORIZATION_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value.toString()}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={column.is_mandatory}
                    onCheckedChange={(checked) =>
                      handleColumnChange(index, "is_mandatory", checked)
                    }
                    disabled={column.is_system_generated}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={column.is_key}
                    onCheckedChange={(checked) =>
                      handleColumnChange(index, "is_key", checked)
                    }
                    disabled={column.is_system_generated}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={column.is_visible}
                    onCheckedChange={(checked) =>
                      handleColumnChange(index, "is_visible", checked)
                    }
                    disabled={column.is_system_generated}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={column.is_filter}
                    onCheckedChange={(checked) =>
                      handleColumnChange(index, "is_filter", checked)
                    }
                    disabled={column.is_system_generated}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={column.description || ""}
                    onChange={(e) =>
                      handleColumnChange(index, "description", e.target.value)
                    }
                    disabled={column.is_system_generated}
                    className="w-full"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* No results */}
      {filteredColumns.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No columns found {searchTerm && "matching search criteria"}
        </div>
      )}
    </div>
  );
};
