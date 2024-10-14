import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";

interface DatasetVersionGroup {
  group_code: string;
  label: string;
  items: {
    dataset_version_id: number;
    value: string;
  }[];
}

interface DatasetVersionGroupInfoProps {
  groups: DatasetVersionGroup[];
}

export const DatasetVersionGroupInfo: React.FC<
  DatasetVersionGroupInfoProps
> = ({ groups }) => {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Dataset Version Groups</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.group_code}>
              <TableCell>{group.group_code}</TableCell>
              <TableCell>{group.label}</TableCell>
              <TableCell>
                {group.items.map((item, index) => (
                  <span key={item.dataset_version_id}>
                    {item.value}
                    {index < group.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
