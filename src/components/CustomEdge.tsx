import { Edge, EdgeProps, getBezierPath, Position } from "@xyflow/react";
import { ReactNode } from "react";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<Edge<Record<string, unknown>, string | undefined>>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getCardinalityMarker = (cardinality?: string) => {
    switch (cardinality) {
      case "1":
        return "1";
      case "N":
        return "N";
      default:
        return "";
    }
  };

  const sourceLabel = `${getCardinalityMarker(
    data?.sourceCardinality as string | undefined
  )}${data?.isSourceMandatory ? "*" : ""}`;
  const targetLabel = `${getCardinalityMarker(
    data?.targetCardinality as string | undefined
  )}${data?.isTargetMandatory ? "*" : ""}`;

  return (
    <div>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#b1b1b7"
      />
      {(data?.label as ReactNode) && (
        <text>
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            fontSize={10}
            fill="#888"
          >
            {data?.label as ReactNode}
          </textPath>
        </text>
      )}
      <text
        x={sourceX}
        y={sourceY}
        dx={sourcePosition === Position.Left ? -8 : 8}
        dy={sourcePosition === Position.Top ? -8 : 8}
        fontSize={12}
        textAnchor={sourcePosition === Position.Left ? "end" : "start"}
        dominantBaseline={
          sourcePosition === Position.Top ? "baseline" : "hanging"
        }
        fill="#888"
      >
        {sourceLabel}
      </text>
      <text
        x={targetX}
        y={targetY}
        dx={targetPosition === Position.Left ? -8 : 8}
        dy={targetPosition === Position.Top ? -8 : 8}
        fontSize={12}
        textAnchor={targetPosition === Position.Left ? "end" : "start"}
        dominantBaseline={
          targetPosition === Position.Top ? "baseline" : "hanging"
        }
        fill="#888"
      >
        {targetLabel}
      </text>
    </div>
  );
}
