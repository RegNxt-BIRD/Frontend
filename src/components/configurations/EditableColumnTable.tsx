import { Button } from "@/components/ui/button";
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
import { Column } from "@/types/databaseTypes";
import { Plus, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";



interface EditableColumnTableProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
}

export const EditableColumnTable: React.FC<EditableColumnTableProps> = ({
  columns,
  onColumnsChange,
}) => {
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleInputChange = (
    index: number,
    field: keyof Column,
    value: any
  ) => {
    const updatedColumns = [...localColumns];
    updatedColumns[index] = { ...updatedColumns[index], [field]: value };
    setLocalColumns(updatedColumns);
    onColumnsChange(updatedColumns);
  };

  const handleAddColumn = () => {
    const newColumn: Column = {
      dataset_version_column_id: 0,
      dataset_version_id: 0,
      column_order: localColumns.length + 1,
      code: "",
      label: "",
      description: "",
      role: "",
      dimension_type: "",
      datatype: "",
      datatype_format: "",
      is_mandatory: false,
      is_key: false,
      value_statement: "",
      is_filter: false,
      is_report_snapshot_field: false,
      is_system_generated: false,
      is_visible: true,
      historization_type: 1, // Default value as specified
    };
    setLocalColumns([...localColumns, newColumn]);
    onColumnsChange([...localColumns, newColumn]);
  };

  const handleDeleteColumn = (index: number) => {
    const updatedColumns = localColumns.filter((_, i) => i !== index);
    setLocalColumns(updatedColumns);
    onColumnsChange(updatedColumns);
  };

  // const getHistorizationLabel = (type: number) => {
  //   switch (type) {
  //     case 0:
  //       return "No historization";
  //     case 1:
  //       return "Always latest";
  //     case 2:
  //       return "Versioning";
  //     default:
  //       return "Unknown";
  //   }
  // };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Data Type</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead>Historization</TableHead>
            <TableHead>Mandatory</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localColumns.map((column, index) => (
            <TableRow key={column.dataset_version_column_id || index}>
              <TableCell>
                <Input
                  value={column.code}
                  disabled={column.is_system_generated}
                  onChange={(e) =>
                    handleInputChange(index, "code", e.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={column.label}
                  disabled={column.is_system_generated}
                  onChange={(e) =>
                    handleInputChange(index, "label", e.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Select
                  value={column.datatype}
                  disabled={column.is_system_generated}
                  onValueChange={(value) =>
                    handleInputChange(index, "datatype", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="integer">Integer</SelectItem>
                    <SelectItem value="decimal">Decimal</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={column.role}
                  disabled={column.is_system_generated}
                  onValueChange={(value) =>
                    handleInputChange(index, "role", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D">Dimension</SelectItem>
                    <SelectItem value="M">Measure</SelectItem>
                    <SelectItem value="A">Attribute</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Switch
                  checked={column.is_visible}
                  onCheckedChange={(checked) =>
                    handleInputChange(index, "is_visible", checked)
                  }
                />
              </TableCell>
              <TableCell>
                <Select
                  value={column.historization_type.toString()}
                  disabled={column.is_system_generated}
                  onValueChange={(value) =>
                    handleInputChange(
                      index,
                      "historization_type",
                      parseInt(value)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select historization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No historization</SelectItem>
                    <SelectItem value="1">Always latest</SelectItem>
                    <SelectItem value="2">Versioning</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Switch
                  checked={column.is_mandatory}
                  disabled={column.is_system_generated}
                  onCheckedChange={(checked) =>
                    handleInputChange(index, "is_mandatory", checked)
                  }
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={column.is_key}
                  disabled={column.is_system_generated}
                  onCheckedChange={(checked) =>
                    handleInputChange(index, "is_key", checked)
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={column.is_system_generated}
                  onClick={() => handleDeleteColumn(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={handleAddColumn}>
        <Plus className="h-4 w-4 mr-2" />
        Add Column
      </Button>
    </div>
  );
};

export default EditableColumnTable;
