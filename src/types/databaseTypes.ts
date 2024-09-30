import { Edge, Node, Position } from "@xyflow/react";

export interface TableColumn {
  id?: string; // Make id optional
  name: string;
  description: string;
  type: string;
  key?: boolean;
  handleType?: "source" | "target";
}

export interface DatabaseTableData {
  label: string;
  columns: TableColumn[];
  schemaColor: string;
  [key: string]: unknown; // Add index signature
}

export interface CustomNodeProps extends Node<DatabaseTableData> {
  zIndex?: number;
}

export interface EdgeData {
  sourceKey: string;
  targetKey: string;
  relation: string;
  label: string;
  [key: string]: unknown; // Add index signature
}

export interface CustomEdge extends Edge<EdgeData> {
  sourcePosition?: Position;
  targetPosition?: Position;
}

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
