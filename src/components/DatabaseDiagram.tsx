"use client";

import { fastApiInstance } from "@/lib/axios";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  Edge,
  Node,
  Panel,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import React, { useCallback, useEffect, useState } from "react";
import CustomEdge from "./CustomEdge";
import DatabaseTableNode from "./DatabaseTableNode";

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const elk = new ELK();

const calculateNodeDimensions = (columns: any) => {
  const baseHeight = 40;
  const rowHeight = 24;
  const width = 250;
  const height = baseHeight + columns.length * rowHeight;
  return { width, height };
};

const getLayoutedElements = async (nodes: any[], edges: any) => {
  const elkNodes = nodes.map((node) => ({
    id: node.id,
    width: node.width,
    height: node.height,
  }));

  const elkEdges = edges.map((edge: any) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const elkGraph = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      "elk.padding": "[top=50,left=50,bottom=50,right=50]",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    },
    children: elkNodes,
    edges: elkEdges,
  });

  return {
    nodes: nodes.map((node) => {
      const elkNode = elkGraph.children?.find((n) => n.id === node.id);
      return {
        ...node,
        position: { x: elkNode?.x || 0, y: elkNode?.y || 0 },
      };
    }),
    edges,
  };
};

interface DatabaseDiagramProps {
  selectedDatasetVersions: any[];
  onSelectionChange: (selectedVersions: any[]) => void;
}

export default function DatabaseDiagram({
  selectedDatasetVersions,
  onSelectionChange,
}: DatabaseDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRelationships = async () => {
      setLoading(true);
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

        newNodes.push(createNode(data[0].central_dataset_version));
        processedTables.add(data[0].central_dataset_version.code);

        data[0].inbound.forEach((rel: any) => {
          if (!processedTables.has(rel.from_dataset_code)) {
            const sourceDataset = data[0].all_datasets.find(
              (d: any) => d.dataset_code === rel.from_dataset_code
            );
            newNodes.push(createNode(sourceDataset));
            processedTables.add(rel.from_dataset_code);
          }
          newEdges.push(
            createEdge(rel, rel.from_table, rel.to_table, "inbound")
          );
        });

        data[0].outbound.forEach((rel: any) => {
          if (!processedTables.has(rel.to_dataset_code)) {
            const targetDataset = data[0].all_datasets.find(
              (d: any) => d.dataset_code === rel.to_dataset_code
            );
            newNodes.push(createNode(targetDataset));
            processedTables.add(rel.to_dataset_code);
          }
          newEdges.push(
            createEdge(rel, rel.from_table, rel.to_table, "outbound")
          );
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } =
          await getLayoutedElements(newNodes, newEdges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (error) {
        console.error("Error fetching relationships:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDatasetVersions.length > 0) {
      fetchRelationships();
    }
  }, [selectedDatasetVersions, setNodes, setEdges]);

  const createNode = (dataset: any) => {
    const { width, height } = calculateNodeDimensions(dataset.columns);
    return {
      id: dataset.dataset_code || dataset.code,
      type: "databaseTable",
      position: { x: 0, y: 0 },
      data: {
        label: `${dataset.dataset_name} (v${dataset.version_nr})`,
        columns: dataset.columns,
      },
      width,
      height,
    };
  };

  const createEdge = (
    relationship: any,
    source: any,
    target: any,
    direction: any
  ) => {
    if (direction === "outbound") {
      return {
        id: `${source}-${target}-${relationship.from_col}-${relationship.to_col}`,
        source: source,
        target: target,
        sourceHandle: `${source}.${relationship.from_col}.right`,
        targetHandle: `${target}.${relationship.to_col}.left`,
        type: "custom",
        animated: true,
        data: {
          label: `${relationship.from_col} -> ${relationship.to_col}`,
          relationshipType: relationship.relation_type,
          sourceCardinality: relationship.source_cardinality,
          targetCardinality: relationship.destination_cardinality,
          isSourceMandatory: relationship.is_source_mandatory,
          isTargetMandatory: relationship.is_destination_mandatory,
        },
      };
    } else {
      return {
        id: `${source}-${target}-${relationship.from_col}-${relationship.to_col}`,
        source: source,
        target: target,
        sourceHandle: `${source}.${relationship.from_col}.right`,
        targetHandle: `${target}.${relationship.to_col}.left`,
        type: "custom",
        animated: true,
        data: {
          label: `${relationship.from_col} <- ${relationship.to_col}`,
          relationshipType: relationship.relation_type,
          sourceCardinality: relationship.source_cardinality,
          targetCardinality: relationship.destination_cardinality,
          isSourceMandatory: relationship.is_source_mandatory,
          isTargetMandatory: relationship.is_destination_mandatory,
        },
      };
    }
  };

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge({ ...params, type: "custom", animated: true }, eds)
      ),
    [setEdges]
  );

  const onLayout = useCallback(async () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } =
      await getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const updatedSelection = selectedDatasetVersions.some(
        (v) => v.dataset_code === node.id
      )
        ? selectedDatasetVersions.filter((v) => v.dataset_code !== node.id)
        : [...selectedDatasetVersions, { dataset_code: node.id }];
      onSelectionChange(updatedSelection);
    },
    [selectedDatasetVersions, onSelectionChange]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[800px]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel position="top-right">
          <button
            onClick={onLayout}
            className="px-4 py-2 font-semibold text-sm bg-primary text-white rounded-lg shadow-sm"
          >
            Layout
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
