import { SharedDataTable } from "@/components/SharedDataTable";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";

interface Group {
  id: number;
  name: string;
  isSystemGenerated: boolean;
}

interface GroupItem {
  id: number;
  groupId: number;
  datasetVersionId: number;
  datasetVersionName: string;
}

interface GroupingTableProps {
  groups: Group[];
  groupItems: GroupItem[];
}

const groupColumns: ColumnDef<Group>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "isSystemGenerated",
    header: "System Generated",
    cell: ({ row }) => (
      <div>{row.getValue("isSystemGenerated") ? "Yes" : "No"}</div>
    ),
  },
];

const groupItemColumns: ColumnDef<GroupItem>[] = [
  {
    accessorKey: "datasetVersionName",
    header: "Dataset Version",
  },
];

export const GroupingTable: React.FC<GroupingTableProps> = ({
  groups,
  groupItems,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Groups</h3>
        <SharedDataTable
          data={groups}
          columns={groupColumns}
          onRowClick={setSelectedGroup}
          showPagination={false}
        />
        <div className="mt-2">
          <Button onClick={() => console.log("Create group")}>
            Create Group
          </Button>
        </div>
      </div>

      {selectedGroup && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Group Items</h3>
          <SharedDataTable
            data={groupItems.filter(
              (item) => item.groupId === selectedGroup.id
            )}
            columns={groupItemColumns}
            onRowClick={() => {}}
            showPagination={false}
          />
          <div className="mt-2">
            <Button onClick={() => console.log("Add item to group")}>
              Add Item to Group
            </Button>
            {!selectedGroup.isSystemGenerated && (
              <Button onClick={() => console.log("Remove item from group")}>
                Remove Item from Group
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
