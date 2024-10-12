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
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import ColumnSelectionModal from "./ColumnSelectionModal";
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

const fetcher = async (url: string) => {
  try {
    const response = await fastApiInstance.get(url);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 301) {
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
  onSelectionChange,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: relationshipsData, error } = useSWR(
    selectedDatasetVersions.length > 0
      ? selectedDatasetVersions.map(
          (v) => `/api/v1/datasets/${v.dataset_id}/relationships/`
        )
      : null,
    (urls) => Promise.all(urls.map(fetcher))
  );

  useEffect(() => {
    if (relationshipsData) {
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      relationshipsData.forEach((response, index) => {
        const { central_dataset_version, inbound, outbound } = response;

        const centralNode = createNode(central_dataset_version, index * 300, 0);
        newNodes.push(centralNode);

        inbound.forEach((rel: any, i: number) => {
          const sourceNode = createNode(
            {
              dataset_version_id: rel.source_dataset_version_id,
              dataset_name: rel.source_dataset_name,
              version_nr: rel.source_version_nr,
              columns: [],
            },
            index * 300 - 200,
            (i + 1) * 150
          );
          newNodes.push(sourceNode);
          newEdges.push(createEdge(rel, sourceNode.id, centralNode.id));
        });

        outbound.forEach((rel: any, i: number) => {
          const targetNode = createNode(
            {
              dataset_version_id: rel.destination_dataset_version_id,
              dataset_name: rel.destination_dataset_name,
              version_nr: rel.destination_version_nr,
              columns: [],
            },
            index * 300 + 200,
            (i + 1) * 150
          );
          newNodes.push(targetNode);
          newEdges.push(createEdge(rel, centralNode.id, targetNode.id));
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [relationshipsData, setNodes, setEdges]);

  const createNode = (dataset: any, x: number, y: number): Node => {
    console.log("dataset_version_id: ", dataset);
    return {
      id: dataset.dataset_version_id.toString(),
      type: "databaseTable",
      position: { x, y },
      data: {
        label: `${dataset.code} (v${dataset.version_nr})`,
        columns: dataset.columns || [],
      },
      draggable: true,
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

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const updatedSelection = selectedDatasetVersions.filter(
        (v) => v.dataset_version_id.toString() !== node.id
      );
      onSelectionChange(updatedSelection);
    },
    [selectedDatasetVersions, onSelectionChange]
  );

  useEffect(() => {
    const selectedNodeIds = new Set(
      selectedDatasetVersions.map((v) => v.dataset_id.toString())
    );
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        selected: selectedNodeIds.has(node.id),
      }))
    );
  }, [selectedDatasetVersions, setNodes]);

  if (error) {
    return <div>Error loading relationships: {error.message}</div>;
  }

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <button onClick={() => console.log(nodes, edges)}>
            Log Nodes and Edges
          </button>
        </Panel>
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
