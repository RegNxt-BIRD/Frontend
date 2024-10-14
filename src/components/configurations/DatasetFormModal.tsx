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
    defaultValues: initialData || {},
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        form.reset({
          code: "",
          label: "",
          description: "",
          framework: "",
          type: "",
        });
      }
    }

    return () => {
      if (!isOpen) {
        form.reset({
          code: "",
          label: "",
          description: "",
          framework: "",
          type: "",
        });
      }
    };
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
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
                    <Input placeholder="Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem id="form-label">
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Label" {...field} />
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
                    <Input placeholder="Description" {...field} />
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
            <DialogFooter>
              <Button type="button" onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
