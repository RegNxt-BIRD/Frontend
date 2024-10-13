import { GroupFormModal } from "@/components/configurations/GroupFormModal";
import { GroupItemsModal } from "@/components/configurations/GroupItemsModal";
import { SharedDataTable } from "@/components/SharedDataTable";
import { SharedColumnFilters } from "@/components/SharedFilters";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fastApiInstance } from "@/lib/axios";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";

interface Group {
  code: string;
  label: string;
  description: string;
  is_system_generated: boolean;
}

interface Groups {
  data: Group[];
}

export const ConfigureGrouping: React.FC = () => {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [columnFilters, setColumnFilters] = useState({
    code: "",
    label: "",
    type: "",
    description: "",
  });

  const {
    data: groups,
    error: groupsError,
    mutate: mutateGroups,
  } = useSWR<Groups>("/api/v1/groups/", fastApiInstance);

  if (groupsError) {
    toast({
      title: "Error",
      description: "Failed to fetch groups. Please try again.",
      variant: "destructive",
    });
  }

  const handleCreateGroup = async (newGroup: Partial<Group>) => {
    try {
      await fastApiInstance.post("/api/v1/groups/", newGroup);
      await mutateGroups();
      toast({ title: "Success", description: "Group created successfully." });
      setIsGroupModalOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGroup = async (updatedGroup: Group) => {
    try {
      await fastApiInstance.put(
        `/api/v1/groups/${updatedGroup.code}/`,
        updatedGroup
      );
      await mutateGroups();
      toast({ title: "Success", description: "Group updated successfully." });
      setIsGroupModalOpen(false);
      setEditingGroup(null);
    } catch (error) {
      console.error("Error updating group:", error);
      toast({
        title: "Error",
        description: "Failed to update group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (groupCode: string) => {
    try {
      await fastApiInstance.delete(`/api/v1/groups/${groupCode}/`);
      await mutateGroups();
      toast({ title: "Success", description: "Group deleted successfully." });
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Group>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "label", header: "Label" },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "is_system_generated",
      header: "System Generated",
      cell: ({ row }) => (row.getValue("is_system_generated") ? "Yes" : "No"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingGroup(row.original);
              setIsGroupModalOpen(true);
            }}
            disabled={row.original.is_system_generated}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteGroup(row.original.code)}
            disabled={row.original.is_system_generated}
          >
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedGroup(row.original);
              setIsItemsModalOpen(true);
            }}
          >
            View Items
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Configure Groups</h2>

      <SharedColumnFilters
        filters={columnFilters}
        setFilter={(key, value) =>
          setColumnFilters((prev) => ({ ...prev, [key]: value }))
        }
      />

      <div className="mt-4 flex flex-row-reverse">
        <Button onClick={() => setIsGroupModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Group
        </Button>
      </div>

      {groups && groups.data && (
        <SharedDataTable
          data={groups.data}
          columns={columns}
          onRowClick={() => {}}
          showPagination={true}
        />
      )}

      <GroupFormModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={(group) => {
          if (editingGroup) {
            handleUpdateGroup({ ...editingGroup, ...group } as Group);
          } else {
            handleCreateGroup(group);
          }
        }}
        initialData={editingGroup || undefined}
      />

      {selectedGroup && (
        <GroupItemsModal
          isOpen={isItemsModalOpen}
          onClose={() => setIsItemsModalOpen(false)}
          group={selectedGroup}
        />
      )}
    </div>
  );
};
