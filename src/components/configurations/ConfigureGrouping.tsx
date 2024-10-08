// ConfigureGrouping.tsx
import { SharedDataTable } from "@/components/SharedDataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Group {
  code: string;
  label: string;
  description: string;
  is_system_generated: boolean;
}

interface GroupItem {
  group_code: string;
  dataset_version_id: number;
  dataset_version_label: string;
}

export const ConfigureGrouping: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupItems, setGroupItems] = useState<GroupItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fastApiInstance.get(
        "/api/v1/dataset_version_groups/"
      );
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error",
        description: "Failed to fetch groups. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchGroupItems = async (groupCode: string) => {
    try {
      const response = await fastApiInstance.get(
        `/api/v1/dataset_version_groups/${groupCode}/items/`
      );
      setGroupItems(response.data);
    } catch (error) {
      console.error("Error fetching group items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch group items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await fastApiInstance.post(
        "/api/v1/dataset_version_groups/",
        {
          code: `GROUP_${groups.length + 1}`,
          label: `New Group ${groups.length + 1}`,
          description: "New group description",
          is_system_generated: false,
        }
      );
      setGroups([...groups, response.data]);
      toast({ title: "Success", description: "Group created successfully." });
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddGroupItem = async () => {
    if (!selectedGroup) return;
    // Implement logic to add a new group item
    // This might involve opening a modal to select a dataset version
  };

  const groupColumns: ColumnDef<Group>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "label", header: "Label" },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "is_system_generated",
      header: "System Generated",
      cell: ({ row }) => (row.getValue("is_system_generated") ? "Yes" : "No"),
    },
  ];

  const groupItemColumns: ColumnDef<GroupItem>[] = [
    { accessorKey: "dataset_version_label", header: "Dataset Version" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Groups</h3>
        <SharedDataTable
          data={groups}
          columns={groupColumns}
          onRowClick={(group) => {
            setSelectedGroup(group);
            fetchGroupItems(group.code);
          }}
        />
        <div className="mt-2">
          <Button onClick={handleCreateGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>
      {selectedGroup && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Items for Group: {selectedGroup.label}
          </h3>
          <SharedDataTable
            data={groupItems}
            columns={groupItemColumns}
            onRowClick={() => {}}
          />
          {!selectedGroup.is_system_generated && (
            <div className="mt-2">
              <Button onClick={handleAddGroupItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item to Group
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
