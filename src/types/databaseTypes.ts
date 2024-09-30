import { Edge, Node } from "@xyflow/react";

export interface TableColumn {
  id?: string; // Make id optional
  name: string;
  description: string;
  type: string;
  key?: boolean;
  handleType?: "source" | "target";
}

export interface DatabaseTableData {
  [key: string]: unknown;
  label: string;
  columns: TableColumn[];
  schemaColor: string;
}

export interface CustomNodeProps extends Node<DatabaseTableData> {}

export interface EdgeData {
  [key: string]: unknown; // Add index signature
  sourceKey: string;
  targetKey: string;
  relation: string;
  label: string;
}

export interface CustomEdge extends Edge<EdgeData> {}

export interface DatabaseTable {
  name: string;
  description: string;
  position: { x: number; y: number };
  columns: TableColumn[];
  schemaColor: string;
  schema?: string;
}

export interface EdgeConfig {
  source: string;
  sourceKey: string;
  target: string;
  targetKey: string;
  relation: string;
  sourcePosition?: string;
  targetPosition?: string;
}

export interface DatabaseConfig {
  tables: DatabaseTable[];
  edgeConfigs: EdgeConfig[];
}
