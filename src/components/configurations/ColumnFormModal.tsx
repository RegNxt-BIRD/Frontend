import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Column } from "@/types/databaseTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Column types configuration
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

interface ColumnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ColumnFormData) => void;
  initialData?: Column;
  versionId: string | number;
}

export default function ColumnFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  versionId,
}: ColumnFormModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ColumnFormData>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      code: "",
      label: "",
      description: "",
      role: "A",
      dimension_type: "",
      datatype: "string",
      datatype_format: "",
      is_mandatory: false,
      is_key: false,
      is_visible: false,
      is_filter: false,
      value_statement: "",
      is_report_snapshot_field: false,
      historization_type: 1,
    },
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      // If editing existing column
      if (initialData) {
        form.reset({
          code: initialData.code || "",
          label: initialData.label || "",
          description: initialData.description || "",
          role: initialData.role || "A",
          dimension_type: initialData.dimension_type || "",
          datatype: initialData.datatype || "string",
          datatype_format: initialData.datatype_format || "",
          is_mandatory: !!initialData.is_mandatory,
          is_key: !!initialData.is_key,
          is_visible: !!initialData.is_visible,
          is_filter: !!initialData.is_filter,
          value_statement: initialData.value_statement || "",
          is_report_snapshot_field: !!initialData.is_report_snapshot_field,
          historization_type: initialData.historization_type || 1,
        });
      } else {
        // If creating new column, reset to default values
        form.reset({
          code: "",
          label: "",
          description: "",
          role: "A",
          dimension_type: "",
          datatype: "string",
          datatype_format: "",
          is_mandatory: false,
          is_key: false,
          is_visible: false,
          is_filter: false,
          value_statement: "",
          is_report_snapshot_field: false,
          historization_type: 1,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: ColumnFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset(); // Reset form when closing
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Column" : "Create New Column"}
          </DialogTitle>
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
                      value={field.value}
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
                      value={field.value}
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
                      value={field.value.toString()}
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
                      <FormLabel>Is Filter</FormLabel>
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
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || initialData?.is_system_generated}
              >
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
}
