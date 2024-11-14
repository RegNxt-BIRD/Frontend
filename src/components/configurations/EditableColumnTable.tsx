import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { Column } from "@/types/databaseTypes";
import { Plus, Save } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ColumnFormModal from "./ColumnFormModal";
import { ConfirmDialog } from "./ConfirmDialog";

interface EditableColumnTableProps {
  initialColumns: Column[];
  onSave: (columns: Column[]) => Promise<void>;
  isLoading?: boolean;
  datasetId: string | number;
  versionId: string | number;
}

export const EditableColumnTable: React.FC<EditableColumnTableProps> = ({
  initialColumns,
  onSave,
  datasetId,
  isLoading,
  versionId,
}) => {
  const { toast } = useToast();
  const [columns, setColumns] = useState<Column[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Track changes
  useEffect(() => {
    const columnsChanged =
      JSON.stringify(columns) !== JSON.stringify(initialColumns);
    setHasChanges(columnsChanged);
  }, [columns, initialColumns]);

  const handleFormSubmit = useCallback(
    async (data: any) => {
      setIsSaving(true);
      try {
        if (selectedColumn) {
          // Update existing column
          await fastApiInstance.post(
            `/api/v1/datasets/${datasetId}/update-columns/?version_id=${versionId}`,
            {
              columns: [
                {
                  ...selectedColumn,
                  ...data,
                },
              ],
            }
          );

          // Update local state
          setColumns((prevColumns) =>
            prevColumns.map((col) =>
              col.dataset_version_column_id ===
              selectedColumn.dataset_version_column_id
                ? { ...col, ...data }
                : col
            )
          );
        } else {
          // Create new column
          const newColumn: Column = {
            dataset_version_column_id: 0,
            dataset_version_id: Number(versionId),
            column_order: columns.length + 1,
            ...data,
            is_system_generated: false,
          };

          const response = await fastApiInstance.post(
            `/api/v1/datasets/${datasetId}/update-columns/?version_id=${versionId}`,
            {
              columns: [newColumn],
            }
          );

          if (response.data?.updated_columns?.[0]) {
            setColumns((prevColumns) => [
              ...prevColumns,
              response.data.updated_columns[0],
            ]);
          }
        }

        setIsFormModalOpen(false);
        setSelectedColumn(null);

        toast({
          title: "Success",
          description: selectedColumn ? "Column updated" : "Column created",
        });
      } catch (error) {
        console.error("Error saving column:", error);
        toast({
          title: "Error",
          description: "Failed to save column. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [datasetId, versionId, selectedColumn, columns.length, toast]
  );

  const handleEditClick = useCallback((column: Column) => {
    setSelectedColumn(column);
    setIsFormModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((column: Column) => {
    setColumnToDelete(column);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!columnToDelete) return;

    try {
      await fastApiInstance.post(
        `/api/v1/datasets/${datasetId}/update-columns/?version_id=${versionId}`,
        {
          is_delete_operation: true,
          columns_to_delete: [columnToDelete.dataset_version_column_id],
        }
      );

      // Update local state
      setColumns((prevColumns) =>
        prevColumns.filter(
          (col) =>
            col.dataset_version_column_id !==
            columnToDelete.dataset_version_column_id
        )
      );

      toast({
        title: "Success",
        description: "Column deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting column:", error);
      toast({
        title: "Error",
        description: "Failed to delete column",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setColumnToDelete(null);
    }
  }, [columnToDelete, datasetId, versionId, toast]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      await onSave(columns);
      toast({
        title: "Success",
        description: "Columns updated successfully",
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [columns, hasChanges, onSave, toast]);

  const filteredColumns = useMemo(() => {
    return columns.filter(
      (column) =>
        column.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        column.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [columns, searchTerm]);

  const handleModalClose = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedColumn(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <div className="space-x-2">
          <Button
            onClick={() => setIsFormModalOpen(true)}
            disabled={isLoading || isSaving}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Filter</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColumns.map((column) => (
              <TableRow key={column.dataset_version_column_id}>
                <TableCell>{column.code}</TableCell>
                <TableCell>{column.label}</TableCell>
                <TableCell>{column.datatype}</TableCell>
                <TableCell>{column.role}</TableCell>
                <TableCell>
                  <Switch checked={column.is_mandatory} disabled />
                </TableCell>
                <TableCell>
                  <Switch checked={column.is_key} disabled />
                </TableCell>
                <TableCell>
                  <Switch checked={column.is_visible} disabled />
                </TableCell>
                <TableCell>
                  <Switch checked={column.is_filter} disabled />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(column)}
                      disabled={column.is_system_generated}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(column)}
                      disabled={column.is_system_generated}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ColumnFormModal
        isOpen={isFormModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        initialData={selectedColumn || undefined}
        versionId={versionId}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Column"
        message={`Are you sure you want to delete the column "${columnToDelete?.label}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default EditableColumnTable;
