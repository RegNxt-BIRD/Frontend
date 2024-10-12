import { fastApiInstance } from "@/lib/axios";
import {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeTypes,
  MarkerType,
  Node,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React, { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
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

const fetcher = async (url: string) => {
  try {
    const response = await fastApiInstance.get(url);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 301) {
      // If we get a 301, follow the redirect
      const newUrl = error.response.headers.location;
      if (newUrl) {
        const redirectResponse = await fastApiInstance.get(newUrl);
        return redirectResponse.data;
      }
    }
    throw error;
  }
};

const DatabaseDiagram: React.FC<DatabaseDiagramProps> = ({
  selectedDatasetVersions,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: relationshipsData, error } = useSWR(
    selectedDatasetVersions.length > 0
      ? selectedDatasetVersions.map(
          (v) => `/api/v1/datasets/${v.dataset_version_id}/relationships/`
        )
      : null,
    (urls) => Promise.all(urls.map(fetcher))
  );

  useEffect(() => {
    if (relationshipsData) {
      const allNodes: Node[] = [];
      const allEdges: Edge[] = [];

      relationshipsData.forEach((response, index) => {
        const { central_dataset_version, inbound, outbound } = response;

        // Add central node
        const centralNode = createNode(central_dataset_version, index);
        allNodes.push(centralNode);

        // Add inbound nodes and edges
        inbound.forEach((rel: any) => {
          const sourceNode = createNode(
            {
              dataset_version_id: rel.source_dataset_version_id,
              dataset_name: rel.source_dataset_name,
              version_nr: rel.source_version_nr,
              columns: [],
            },
            allNodes.length
          );
          allNodes.push(sourceNode);
          allEdges.push(createEdge(rel, sourceNode.id, centralNode.id));
        });

        // Add outbound nodes and edges
        outbound.forEach((rel: any) => {
          const targetNode = createNode(
            {
              dataset_version_id: rel.destination_dataset_version_id,
              dataset_name: rel.destination_dataset_name,
              version_nr: rel.destination_version_nr,
              columns: [],
            },
            allNodes.length
          );
          allNodes.push(targetNode);
          allEdges.push(createEdge(rel, centralNode.id, targetNode.id));
        });
      });

      setNodes(allNodes);
      setEdges(allEdges);
    }
  }, [relationshipsData]);

  const createNode = (dataset: any, index: number): Node => {
    const position = calculateNodePosition(index, 300);
    return {
      id: dataset.dataset_version_id.toString(),
      type: "databaseTable",
      position,
      data: {
        label: `${dataset.dataset_name} (v${dataset.version_nr})`,
        columns: dataset.columns || [],
      },
    };
  };

  const calculateNodePosition = (index: number, spacing: number) => {
    const angle = (index * 2 * Math.PI) / 5; // Distribute nodes in a circle
    const radius = 300; // Adjust this value to change the circle size
    return {
      x: Math.cos(angle) * radius + 500, // Center X
      y: Math.sin(angle) * radius + 300, // Center Y
    };
  };

  const createEdge = (
    relationship: any,
    source: string,
    target: string
  ): Edge => {
    return {
      id: `${source}-${target}`,
      source,
      target,
      type: "custom",
      label:
        relationship.label ||
        `${relationship.source_column_name} -> ${relationship.destination_column_name}`,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: {
        sourceColumn: relationship.source_column_name,
        targetColumn: relationship.destination_column_name,
        relationType: relationship.relation_type,
        sourceCardinality: relationship.source_cardinality,
        targetCardinality: relationship.destination_cardinality,
      },
    };
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
                  label: `${sourceColumn} -> ${targetColumn}`,
                  data: {
                    ...e.data,
                    sourceColumn,
                    targetColumn,
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

  if (error) {
    return <div>Error loading relationships: {error.message}</div>;
  }

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
          initialSourceColumn={selectedEdge.data?.sourceColumn}
          initialTargetColumn={selectedEdge.data?.targetColumn}
        />
      )}
    </div>
  );
};

export default DatabaseDiagram;
