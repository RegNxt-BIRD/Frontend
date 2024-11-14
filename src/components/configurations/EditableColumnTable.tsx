import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { Column } from "@/types/databaseTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const columnSchema = z.object({
  code: z.string().min(1, "Code is required"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  role: z.string(),
  dimension_type: z.string().optional(),
  datatype: z.string(),
  datatype_format: z.string().optional(),
  is_mandatory: z.boolean(),
  is_key: z.boolean(),
  is_visible: z.boolean().default(false),
  is_filter: z.boolean().default(false),
  value_statement: z.string().optional(),
  is_report_snapshot_field: z.boolean().default(false),
  historization_type: z.number(),
});

type ColumnFormData = z.infer<typeof columnSchema>;

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

// Column edit modal component
const ColumnFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ColumnFormData) => void;
  initialData?: Column;
  versionId: string | number;
}> = ({ isOpen, onClose, onSubmit, initialData, versionId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ColumnFormData>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      code: initialData?.code || "",
      label: initialData?.label || "",
      description: initialData?.description || "",
      role: initialData?.role || "A",
      dimension_type: initialData?.dimension_type || "",
      datatype: initialData?.datatype || "string",
      datatype_format: initialData?.datatype_format || "",
      is_mandatory: initialData?.is_mandatory || false,
      is_key: initialData?.is_key || false,
      is_visible: initialData?.is_visible || false,
      is_filter: initialData?.is_filter || false,
      value_statement: initialData?.value_statement || "",
      is_report_snapshot_field: initialData?.is_report_snapshot_field || false,
      historization_type: initialData?.historization_type || 1,
    },
  });

  const handleSubmit = async (data: ColumnFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Column" : "Create New Column"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modify the column properties below"
              : "Enter the details for the new column"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={initialData?.is_system_generated}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={initialData?.is_system_generated}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="datatype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={initialData?.is_system_generated}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLUMN_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={initialData?.is_system_generated}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="historization_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historization Type</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                      disabled={initialData?.is_system_generated}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={initialData?.is_system_generated}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_mandatory"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Mandatory</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={initialData?.is_system_generated}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Is Visible</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={initialData?.is_system_generated}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_filter"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Is Hidden</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={initialData?.is_system_generated}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_key"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Key Column</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={initialData?.is_system_generated}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : initialData ? (
                  "Update Column"
                ) : (
                  "Create Column"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Confirmation dialog component
const DeleteConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  columnName: string;
}> = ({ isOpen, onClose, onConfirm, columnName }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the column "{columnName}"? This action
          cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

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
  const [columns, setColumns] = useState<Column[]>(initialColumns);
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

  useEffect(() => {
    const columnsChanged =
      JSON.stringify(columns) !== JSON.stringify(initialColumns);
    setHasChanges(columnsChanged);
  }, [columns, initialColumns]);

  const handleFormSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      if (selectedColumn) {
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
      } else {
        const newColumn: Column = {
          dataset_version_column_id: 0,
          dataset_version_id: Number(versionId),
          column_order: columns.length + 1,
          ...data,
          is_system_generated: false,
        };

        await fastApiInstance.post(
          `/api/v1/datasets/${datasetId}/update-columns/?version_id=${versionId}`,
          {
            columns: [newColumn],
          }
        );
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
  };
  const handleEditClick = (column: Column) => {
    setSelectedColumn(column);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (column: Column) => {
    setColumnToDelete(column);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!columnToDelete) return;

    try {
      await fastApiInstance.post(
        `/api/v1/datasets/${datasetId}/update-columns/?version_id=${versionId}`,
        {
          is_delete_operation: true,
          columns_to_delete: [columnToDelete.dataset_version_column_id],
        }
      );

      // Update local state after successful deletion
      const updatedColumns = columns.filter(
        (col) =>
          col.dataset_version_column_id !==
          columnToDelete.dataset_version_column_id
      );
      setColumns(updatedColumns);

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
  };

  const handleSave = async () => {
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
  };

  const filteredColumns = useMemo(() => {
    return columns.filter(
      (column) =>
        column.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        column.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [columns, searchTerm]);

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
              <TableHead>Actions</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Filter</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColumns.map((column) => (
              <TableRow key={column.dataset_version_column_id}>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(column)}
                      disabled={column.is_system_generated}
                    >
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(column)}
                      disabled={column.is_system_generated}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
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
                <TableCell>{column.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ColumnFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedColumn(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={selectedColumn || undefined}
        versionId={versionId}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the column "{columnToDelete?.label}
            "? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditableColumnTable;
