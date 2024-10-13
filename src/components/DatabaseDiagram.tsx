import { fastApiInstance } from "@/lib/axios";
import dagre from "@dagrejs/dagre";
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
import { useCallback, useEffect, useState } from "react";
import CustomEdge from "./CustomEdge";
import DatabaseTableNode from "./DatabaseTableNode";

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const nodeWidth = 200;
const nodeHeight = 200;

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "LR"
) => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

interface DatabaseDiagramProps {
  selectedDatasetVersions: any[];
  onSelectionChange: (selectedVersions: any[]) => void;
}

export default function DatabaseDiagram({
  selectedDatasetVersions,
  onSelectionChange,
}: DatabaseDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  const handleExpandNode = useCallback(
    async (nodeId: string) => {
      try {
        const response = await fastApiInstance.get(
          `/api/v1/datasets/${nodeId}/relationships/`
        );
        const { inbound, outbound, all_datasets } = response.data;

        const newNodes = all_datasets
          .filter(
            (dataset: any) =>
              !nodes.some((node) => node.id === dataset.dataset_code)
          )
          .map((dataset: any) => createNode(dataset));

        const newEdges = [
          ...inbound.map((rel: any) =>
            createEdge(rel, rel.from_table, rel.to_table, "inbound")
          ),
          ...outbound.map((rel: any) =>
            createEdge(rel, rel.from_table, rel.to_table, "outbound")
          ),
        ];

        setNodes((nds) => [...nds, ...newNodes]);
        setEdges((eds) => [...eds, ...newEdges]);

        onLayout();
      } catch (error) {
        console.error("Error expanding node:", error);
      }
    },
    [nodes, setNodes, setEdges]
  );

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

        data.forEach((response) => {
          const { all_datasets, inbound, outbound } = response;

          all_datasets.forEach((dataset: any) => {
            if (!processedTables.has(dataset.dataset_code)) {
              newNodes.push(createNode(dataset));
              processedTables.add(dataset.dataset_code);
            }
          });

          inbound.forEach((rel: any) => {
            newEdges.push(
              createEdge(rel, rel.from_table, rel.to_table, "inbound")
            );
          });

          outbound.forEach((rel: any) => {
            newEdges.push(
              createEdge(rel, rel.from_table, rel.to_table, "outbound")
            );
          });
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(newNodes, newEdges);

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

  const createNode = (dataset: any): Node => ({
    id: dataset.dataset_code,
    type: "databaseTable",
    position: { x: 0, y: 0 },
    data: {
      label: `${dataset.dataset_name} (v${dataset.version_nr})`,
      columns: dataset.columns,
      onExpand: handleExpandNode,
    },
  });

  const createEdge = (
    relationship: any,
    source: string,
    target: string,
    direction: "inbound" | "outbound"
  ): Edge => ({
    id: `${source}-${target}-${relationship.from_col}-${relationship.to_col}`,
    source,
    target,
    sourceHandle: `${source}.${relationship.from_col}.${
      direction === "outbound" ? "right" : "left"
    }`,
    targetHandle: `${target}.${relationship.to_col}.${
      direction === "outbound" ? "left" : "right"
    }`,
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
  });

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, type: "custom", animated: true }, eds)
      ),
    [setEdges]
  );

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

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
