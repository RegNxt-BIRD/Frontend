import { fastApiInstance } from "@/lib/axios";
import {
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React, { useCallback, useEffect, useState } from "react";
import ColumnSelectionModal from "./ColumnSelectionModal";
import CustomEdgeComponent from "./CustomEdge";
import DatabaseTableNode from "./DatabaseTableNode";

interface DatabaseDiagramProps {
  selectedDatasetVersion: any;
}

const DatabaseDiagram: React.FC<DatabaseDiagramProps> = ({
  selectedDatasetVersion,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nodeTypes = {
    databaseTable: DatabaseTableNode,
  };

  const edgeTypes = {
    custom: CustomEdgeComponent,
  };

  useEffect(() => {
    if (selectedDatasetVersion) {
      fetchRelationships(selectedDatasetVersion.dataset_version_id);
    }
  }, [selectedDatasetVersion]);

  const fetchRelationships = async (datasetVersionId: string) => {
    try {
      const response = await fastApiInstance.get(
        `/api/v1/relationships/${datasetVersionId}`
      );
      const { nodes: apiNodes, edges: apiEdges } = response.data;
      setNodes(apiNodes);
      setEdges(apiEdges);
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

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      fetchRelationships(node.id);
    },
    []
  );

  const handleColumnSelection = useCallback(
    (sourceColumn: string, targetColumn: string) => {
      if (selectedEdge) {
        setEdges((eds) =>
          eds.map((e) =>
            e.id === selectedEdge.id
              ? {
                  ...e,
                  sourceHandle: `${e.source}.${sourceColumn}`,
                  targetHandle: `${e.target}.${targetColumn}`,
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
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      />
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
    </>
  );
};

export default DatabaseDiagram;
