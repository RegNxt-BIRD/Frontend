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
import { Dataset } from "@/types/databaseTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[a-zA-Z0-9]+$/, "Code must only contain alphanumeric characters"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  framework: z.string().min(1, "Framework is required"),
  type: z.string().min(1, "Layer is required"),
  is_visible: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      is_visible: initialData?.is_visible ?? true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          ...initialData,
          is_visible: initialData.is_visible ?? true,
        });
      } else {
        form.reset({
          code: "",
          label: "",
          description: "",
          framework: "",
          type: "",
          is_visible: true,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Dataset" : "Create Dataset"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Code"
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
                      placeholder="Label"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Description"
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
              name="framework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Framework</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={initialData?.is_system_generated}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Framework" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frameworks.map((framework) => (
                        <SelectItem key={framework.code} value={framework.code}>
                          {framework.name}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Layer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={initialData?.is_system_generated}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Layer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {layers.map((layer) => (
                        <SelectItem key={layer.code} value={layer.code}>
                          {layer.name}
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
              name="is_visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Visible</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Make this dataset visible in data and diagram sections
                    </div>
                    <FormMessage />
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
            <DialogFooter>
              <Button type="button" onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={initialData?.is_system_generated}>
                {initialData ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DatasetFormModal;
