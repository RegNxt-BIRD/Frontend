import { fastApiInstance } from "@/lib/axios";
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React, { useCallback, useEffect, useState } from "react";
import ColumnSelectionModal from "./ColumnSelectionModal";
import CustomEdgeComponent from "./CustomEdge";
import DatabaseTableNode from "./DatabaseTableNode";

interface DatabaseDiagramProps {
  selectedDatasetVersions: any[];
}

const nodeTypes: NodeTypes = {
  databaseTable: DatabaseTableNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdgeComponent,
};

const DatabaseDiagram: React.FC<DatabaseDiagramProps> = ({
  selectedDatasetVersions,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (selectedDatasetVersions.length > 0) {
      fetchRelationships(
        selectedDatasetVersions.map((v) => v.dataset_version_id)
      );
    }
  }, [selectedDatasetVersions]);

  const fetchRelationships = async (datasetVersionIds: string[]) => {
    try {
      const promises = datasetVersionIds.map((id) =>
        fastApiInstance.get(`/api/v1/relationships/${id}`)
      );
      const responses = await Promise.all(promises);

      const allNodes: Node[] = [];
      const allEdges: Edge[] = [];

      responses.forEach((response, index) => {
        const { nodes: apiNodes, edges: apiEdges } = response.data;
        const offsetX = index * 300;
        const offsetY = index * 100;
        const offsetNodes = apiNodes.map((node: Node) => ({
          ...node,
          position: {
            x: (node.position?.x || 0) + offsetX,
            y: (node.position?.y || 0) + offsetY,
          },
        }));
        allNodes.push(...offsetNodes);
        allEdges.push(...apiEdges);
      });

      setNodes(allNodes);
      setEdges(allEdges);
    } catch (error) {
      console.error("Error fetching relationships:", error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setIsModalOpen(true);
  }, []);

  const handleColumnSelection = useCallback(
    (sourceColumn: string, targetColumn: string) => {
      if (selectedEdge) {
        setEdges((eds) =>
          eds.map((e) =>
            e.id === selectedEdge.id
              ? {
                  ...e,
                  sourceHandle: `${e.source}.${sourceColumn}.right`,
                  targetHandle: `${e.target}.${targetColumn}.left`,
                  data: {
                    ...e.data,
                    sourceKey: sourceColumn,
                    targetKey: targetColumn,
                    label: `${sourceColumn} -> ${targetColumn}`,
                  },
                }
              : e
          )
        );
      }
      setIsModalOpen(false);
      setSelectedEdge(null);
    },
    [selectedEdge, setEdges]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      {isModalOpen && selectedEdge && (
        <ColumnSelectionModal
          sourceNode={nodes.find((n) => n.id === selectedEdge.source)}
          targetNode={nodes.find((n) => n.id === selectedEdge.target)}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleColumnSelection}
          initialSourceColumn={selectedEdge.data?.sourceKey}
          initialTargetColumn={selectedEdge.data?.targetKey}
        />
      )}
    </div>
  );
};

export default DatabaseDiagram;
