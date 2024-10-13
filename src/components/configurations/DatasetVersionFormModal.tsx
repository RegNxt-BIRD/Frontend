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
import { Dataset, DatasetVersion } from "@/types/databaseTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DatePicker } from "../GDate";

const formSchema = z
  .object({
    version_code: z.string().min(1, "Version code is required"),
    code: z.string().min(1, "Code is required"),
    label: z.string().min(1, "Label is required"),
    description: z.string().optional(),
    valid_from: z.string().min(1, "Valid from date is required"),
    valid_to: z.string().min(1, "Valid to date is required"),
  })
  .refine(
    (data) => {
      const validFrom = new Date(data.valid_from);
      const validTo = new Date(data.valid_to);
      return validFrom < validTo;
    },
    {
      message: "Valid from date must be earlier than valid to date",
      path: ["valid_from"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface DatasetVersionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (version: Partial<DatasetVersion>) => void;
  initialData?: DatasetVersion;
  dataset?: Dataset;
}

export const DatasetVersionFormModal: React.FC<
  DatasetVersionFormModalProps
> = ({ isOpen, onClose, onSubmit, initialData, dataset }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        version_code: initialData.version_code,
        code: initialData.code,
        label: initialData.label,
        description: initialData.description,
        valid_from: initialData.valid_from || "",
        valid_to: (initialData.valid_to as string) || "",
      });
    } else if (dataset) {
      form.reset({
        version_code: "",
        code: dataset.code,
        label: dataset.label,
        description: dataset.description,
        valid_from: "",
        valid_to: "",
      });
    } else {
      form.reset({});
    }
  }, [initialData, dataset, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      valid_from: data.valid_from,
      valid_to: data.valid_to,
    });
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="version_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Version Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      disabled={!initialData}
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
              name="valid_from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid From</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Valid From"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valid_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid To</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      className="w-full"
                      onChange={field.onChange}
                      placeholder="Valid To"
                    />
                  </FormControl>
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
