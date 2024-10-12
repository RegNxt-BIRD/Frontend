import { fastApiInstance } from "@/lib/axios";
import {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeTypes,
  MarkerType,
  MiniMap,
  Node,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useEffect } from "react";
import CustomEdgeComponent from "./CustomEdge";
import DatabaseTableNode from "./DatabaseTableNode";

interface DatabaseDiagramProps {
  selectedDatasetVersions: any[];
  onSelectionChange: (selectedVersions: any[]) => void;
}

const nodeTypes: NodeTypes = {
  databaseTable: DatabaseTableNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdgeComponent,
};

const DatabaseDiagram: React.FC<DatabaseDiagramProps> = ({
  selectedDatasetVersions,
  onSelectionChange,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const responses = await Promise.all(
          selectedDatasetVersions.map((v) =>
            fastApiInstance.get(
              `/api/v1/datasets/${v.dataset_version_id}/relationships/`
            )
          )
        );
        const data = responses.map((r) => r.data);

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const processedTables = new Set<string>();

        data.forEach((response) => {
          const { central_dataset_version, inbound, outbound, all_datasets } =
            response;

          // Process all datasets
          all_datasets.forEach((dataset: any) => {
            if (!processedTables.has(dataset.dataset_code)) {
              newNodes.push(createNode(dataset));
              processedTables.add(dataset.dataset_code);
            }
          });

          // Process relationships
          inbound.forEach((rel: any) => {
            newEdges.push(createEdge(rel, rel.from_table, rel.to_table));
          });

          outbound.forEach((rel: any) => {
            newEdges.push(createEdge(rel, rel.from_table, rel.to_table));
          });
        });

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error("Error fetching relationships:", error);
      }
    };

    if (selectedDatasetVersions.length > 0) {
      fetchRelationships();
    }
  }, [selectedDatasetVersions]);

  const createNode = (dataset: any): Node => {
    return {
      id: dataset.dataset_code,
      type: "databaseTable",
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      data: {
        label: `${dataset.dataset_name} (v${dataset.version_nr})`,
        columns: dataset.columns,
      },
    };
  };

  const createEdge = (
    relationship: any,
    source: string,
    target: string
  ): Edge => {
    return {
      id: `${source}-${target}-${relationship.from_col}-${relationship.to_col}`,
      source,
      target,
      sourceHandle: `${source}.${relationship.from_col}.right`,
      targetHandle: `${target}.${relationship.to_col}.left`,
      type: "custom",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: {
        label: `${relationship.from_col} -> ${relationship.to_col}`,
        relationshipType: relationship.relation_type,
        sourceCardinality: relationship.source_cardinality,
        targetCardinality: relationship.destination_cardinality,
      },
    };
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const updatedSelection = selectedDatasetVersions.filter(
        (v) => v.dataset_code !== node.id
      );
      onSelectionChange(updatedSelection);
    },
    [selectedDatasetVersions, onSelectionChange]
  );

  return (
    <div style={{ width: "100%", height: "800px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default DatabaseDiagram;
