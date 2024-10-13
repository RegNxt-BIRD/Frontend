import { SharedDataTable } from "@/components/SharedDataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { ColumnDef } from "@tanstack/react-table";
import React, { useEffect, useState } from "react";

interface Group {
  code: string;
  label: string;
  description: string;
  system_generated: boolean;
}

interface GroupItem {
  dataset_code: string;
  order: number;
  system_generated: boolean;
}

interface GroupItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export const GroupItemsModal: React.FC<GroupItemsModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const [items, setItems] = useState<GroupItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchGroupItems();
    }
  }, [isOpen, group.code]);

  const fetchGroupItems = async () => {
    try {
      const response = await fastApiInstance.get(
        `/api/v1/groups/${group.code}/items/`
      );
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching group items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch group items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async (newItem: Partial<GroupItem>) => {
    try {
      await fastApiInstance.post(
        `/api/v1/groups/${group.code}/add_item/`,
        newItem
      );
      await fetchGroupItems();
      toast({ title: "Success", description: "Item added successfully." });
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (datasetCode: string) => {
    try {
      await fastApiInstance.delete(
        `/api/v1/groups/${group.code}/remove_item/`,
        {
          data: { dataset_code: datasetCode },
        }
      );
      await fetchGroupItems();
      toast({ title: "Success", description: "Item removed successfully." });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<GroupItem>[] = [
    { accessorKey: "dataset_code", header: "Dataset Code" },
    { accessorKey: "order", header: "Order" },
    {
      accessorKey: "system_generated",
      header: "System Generated",
      cell: ({ row }) => (row.getValue("system_generated") ? "Yes" : "No"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRemoveItem(row.original.dataset_code)}
          disabled={row.original.system_generated}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Items for Group: {group.label}</DialogTitle>
        </DialogHeader>
        <SharedDataTable
          data={items}
          columns={columns}
          onRowClick={() => {}}
          showPagination={true}
        />
        <Button
          onClick={() =>
            handleAddItem({ dataset_code: "", order: items.length + 1 })
          }
        >
          Add Item
        </Button>
      </DialogContent>
    </Dialog>
  );
};
