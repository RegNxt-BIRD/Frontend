import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  Edge,
  Node,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback } from "react";
import CustomEdge from "./CustomEdge";
import DatabaseTableNode from "./DatabaseTableNode";

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface DatabaseDiagramProps {
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
  selectedDatasetVersions: any[];
  onSelectionChange: (selectedVersions: any[]) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  getLayoutedElements: (
    nodes: Node[],
    edges: Edge[]
  ) => Promise<{ nodes: Node[]; edges: Edge[] }>;
}

export default function DatabaseDiagram({
  nodes,
  edges,
  loading,
  selectedDatasetVersions,
  onSelectionChange,
  setNodes,
  setEdges,
  getLayoutedElements,
}: DatabaseDiagramProps) {
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
  }, [nodes, edges, setNodes, setEdges, getLayoutedElements]);

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
        onNodesChange={(changes) =>
          setNodes((nds) => applyNodeChanges(changes, nds))
        }
        onEdgesChange={(changes) =>
          setEdges((eds) => applyEdgeChanges(changes, eds))
        }
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
