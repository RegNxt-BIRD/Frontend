import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Edit, Trash2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { databaseConfig } from "../databaseConfig";
import ColumnSelectionModal from "./ColumnSelectionModal";
import CustomEdge from "./CustomEdge";
import DatabaseTableNode from "./DatabaseTableNode";

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const DatabaseDiagram: React.FC = () => {
  const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(
    null
  );

  const initialNodes: Node[] = useMemo(
    () =>
      databaseConfig.tables.map((table) => ({
        id: table.schema
          ? `${table.schema}.${table.name}`
          : `public.${table.name}`,
        type: "databaseTable",
        data: {
          label: table.name,
          columns: table.columns.map((col) => ({
            id: `${
              table.schema
                ? `${table.schema}.${table.name}`
                : `public.${table.name}`
            }.${col.name}`,
            name: col.name,
            type: col.type,
            description: col.description,
            key: col.key,
            handleType: col.handleType,
          })),
          schemaColor: table.schemaColor,
        },
        position: table.position,
      })),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const initialEdges: Edge[] = useMemo(() => {
    const edges = databaseConfig.edgeConfigs.map((edgeConfig, index) => {
      return {
        id: `e${index}`,
        source: edgeConfig.source,
        target: edgeConfig.target,
        sourceHandle: `${edgeConfig.source}.${edgeConfig.sourceKey}`,
        targetHandle: `${edgeConfig.target}.${edgeConfig.targetKey}`,
        type: "custom",
        animated: true,
        style: { stroke: "#000" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#000",
        },
        data: {
          label: `${edgeConfig.sourceKey} -> ${edgeConfig.targetKey}`,
          relation: edgeConfig.relation,
          sourceKey: edgeConfig.sourceKey,
          targetKey: edgeConfig.targetKey,
        },
      };
    });
    return edges;
  }, []);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => {
    if (params.sourceHandle && params.targetHandle) {
      setPendingConnection(params);
      setIsModalOpen(true);
    }
  }, []);

  const handleColumnSelection = useCallback(
    (sourceColumn: string, targetColumn: string, edgeToUpdate?: Edge) => {
      if (edgeToUpdate) {
        setEdges((eds) =>
          eds.map((e) =>
            e.id === edgeToUpdate.id
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
      } else if (pendingConnection) {
        const newEdge = {
          id: `e${Date.now()}`,
          source: pendingConnection.source!,
          target: pendingConnection.target!,
          sourceHandle: `${pendingConnection.source}.${sourceColumn}`,
          targetHandle: `${pendingConnection.target}.${targetColumn}`,
          type: "custom",
          animated: true,
          style: { stroke: "#000" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#000",
          },
          data: {
            relation: "custom",
            sourceKey: sourceColumn,
            targetKey: targetColumn,
            label: `${sourceColumn} -> ${targetColumn}`,
          },
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
      setIsModalOpen(false);
      setPendingConnection(null);
      setSelectedEdge(null);
    },
    [pendingConnection, setEdges]
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
  }, []);

  const onEdgeEdit = useCallback(() => {
    if (selectedEdge) {
      setIsModalOpen(true);
    }
  }, [selectedEdge]);

  const onEdgeDelete = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }, [selectedEdge, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const highlightConnections = useCallback(
    (nodeId: string, direction: "successors" | "predecessors") => {
      const visited = new Set<string>();
      const highlighted = new Set<string>();
      const stack = [nodeId];

      while (stack.length > 0) {
        const currentNode = stack.pop()!;
        if (!visited.has(currentNode)) {
          visited.add(currentNode);
          edges.forEach((edge) => {
            const [source, target] =
              direction === "successors"
                ? [edge.source, edge.target]
                : [edge.target, edge.source];
            if (source === currentNode) {
              highlighted.add(edge.id);
              stack.push(target);
            }
          });
        }
      }

      setHighlightedEdges(Array.from(highlighted));
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          style: {
            ...e.style,
            stroke: highlighted.has(e.id) ? "#ff0000" : "#000",
            strokeWidth: highlighted.has(e.id) ? 3 : 2,
          },
        }))
      );
    },
    [edges, setEdges]
  );

  const highlightSuccessors = useCallback(
    () => selectedNode && highlightConnections(selectedNode, "successors"),
    [highlightConnections, selectedNode]
  );

  const highlightPredecessors = useCallback(
    () => selectedNode && highlightConnections(selectedNode, "predecessors"),
    [highlightConnections, selectedNode]
  );

  const resetHighlight = useCallback(() => {
    setHighlightedEdges([]);
    setSelectedEdge(null);
    setSelectedNode(null);
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: { ...e.style, stroke: "#000", strokeWidth: 2 },
      }))
    );
  }, [setEdges]);

  return (
    <div className="w-full h-full flex">
      <div className="w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <MiniMap
            nodeClassName={(node) => `react-flow__node-${node.type}`}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
        <div className="absolute left-4 top-2 z-50 bg-white p-2 rounded-md shadow-md">
          <button
            onClick={highlightSuccessors}
            className="px-2 py-1 bg-blue-500 text-white rounded-md mr-2"
            disabled={!selectedNode}
          >
            Highlight Successors
          </button>
          <button
            onClick={highlightPredecessors}
            className="px-2 py-1 bg-green-500 text-white rounded-md mr-2"
            disabled={!selectedNode}
          >
            Highlight Predecessors
          </button>
          <button
            onClick={resetHighlight}
            className="px-2 py-1 bg-gray-500 text-white rounded-md"
          >
            Reset Highlight
          </button>
        </div>
      </div>
      {selectedEdge && (
        <div className=" bg-gray-100 p-4 overflow-y-auto">
          <h3 className="font-bold text-lg mb-2">Selected Edge Details</h3>
          <p>
            <strong>Source:</strong> {selectedEdge.source}
          </p>
          <p>
            <strong>Target:</strong> {selectedEdge.target}
          </p>
          <p>
            <strong>Source Column:</strong> {selectedEdge.data.sourceKey}
          </p>
          <p>
            <strong>Target Column:</strong> {selectedEdge.data.targetKey}
          </p>
          <p>
            <strong>Relation:</strong> {selectedEdge.data.relation}
          </p>
          <div className="mt-4">
            <button
              onClick={onEdgeEdit}
              className="px-2 py-1 bg-blue-500 text-white rounded-md mr-2"
            >
              <Edit size={16} className="inline mr-1" /> Edit
            </button>
            <button
              onClick={onEdgeDelete}
              className="px-2 py-1 bg-red-500 text-white rounded-md"
            >
              <Trash2 size={16} className="inline mr-1" /> Delete
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (pendingConnection || selectedEdge) && (
        <ColumnSelectionModal
          sourceNode={nodes.find(
            (node) =>
              node.id === (pendingConnection?.source || selectedEdge?.source)
          )}
          targetNode={nodes.find(
            (node) =>
              node.id === (pendingConnection?.target || selectedEdge?.target)
          )}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEdge(null);
          }}
          onSelect={(sourceColumn, targetColumn) =>
            handleColumnSelection(sourceColumn, targetColumn, selectedEdge)
          }
          initialSourceColumn={selectedEdge?.data.sourceKey}
          initialTargetColumn={selectedEdge?.data.targetKey}
        />
      )}
    </div>
  );
};

export default DatabaseDiagram;
