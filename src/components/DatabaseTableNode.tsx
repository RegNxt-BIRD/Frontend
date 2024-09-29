import { Handle, NodeProps, Position } from "@xyflow/react";
import React from "react";

interface Column {
  id: string;
  name: string;
  type: string;
  description: string;
  key?: boolean;
  handleType?: "source" | "target";
}

interface DatabaseTableNodeData {
  label: string;
  columns: Column[];
  schemaColor: string;
}

const DatabaseTableNode: React.FC<NodeProps<DatabaseTableNodeData>> = ({
  id,
  data,
}) => {
  return (
    <div
      className="px-4 py-2 shadow-md rounded-md bg-white border-2"
      style={{ borderColor: data.schemaColor }}
    >
      <div className="font-bold">{data.label}</div>
      {data.columns.map((column) => (
        <div key={column.id} className="flex items-center text-sm">
          <Handle
            type="source"
            position={Position.Right}
            id={`${id}.${column.name}`}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id={`${id}.${column.name}`}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />
          <div title={column.description}>
            {column.name}: {column.type}
            {column.key && <span className="ml-1 text-yellow-500">🔑</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
export default DatabaseTableNode;
