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
import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ColumnFormModal from "./ColumnFormModal";
import { ConfirmDialog } from "./ConfirmDialog";

interface EditableColumnTableProps {
  initialColumns: Column[];
  datasetId: string | number;
  versionId: string | number;
  onColumnChange?: () => void; // Add callback for column changes
  isLoading?: boolean;
}

export const EditableColumnTable: React.FC<EditableColumnTableProps> = ({
  initialColumns,
  datasetId,
  versionId,
  onColumnChange,
  isLoading,
}) => {
  const { toast } = useToast();
  const [columns, setColumns] = useState<Column[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const refreshColumns = useCallback(async () => {
    try {
      const response = await fastApiInstance.get(
        `/api/v1/datasets/${datasetId}/version-columns/`,
        {
          params: { version_id: versionId },
        }
      );
      setColumns(response.data);
      if (onColumnChange) {
        onColumnChange();
      }
    } catch (error) {
      console.error("Error refreshing columns:", error);
    }
  }, [datasetId, versionId, onColumnChange]);

  const handleFormSubmit = useCallback(
    async (data: any) => {
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
                  is_visible: data.is_visible ?? true, // Ensure is_visible defaults to true
                },
              ],
            }
          );
        } else {
          // Create new column
          const newColumn: Partial<Column> = {
            dataset_version_id: Number(versionId),
            column_order: columns.length + 1,
            ...data,
            is_system_generated: false,
            is_visible: true, // Set is_visible to true for new columns
          };

          await fastApiInstance.post(
            `/api/v1/datasets/${datasetId}/update-columns/?version_id=${versionId}`,
            {
              columns: [newColumn],
            }
          );
        }

        // Immediately refresh the columns list
        await refreshColumns();

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
      }
    },
    [
      datasetId,
      versionId,
      selectedColumn,
      columns.length,
      toast,
      refreshColumns,
    ]
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

      // Refresh columns after deletion
      await refreshColumns();

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
  }, [columnToDelete, datasetId, versionId, toast, refreshColumns]);

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
          <Button onClick={() => setIsFormModalOpen(true)} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Column
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
              <TableHead>Mandatory Filter</TableHead>
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
                  <Switch checked={column.is_report_snapshot_field} disabled />
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
