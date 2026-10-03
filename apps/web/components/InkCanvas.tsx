"use client";

import { useRef, useState } from "react";
import type { InkPoint, InkStroke, PaperStyle } from "../lib/types";

type Tool = "pen" | "highlighter" | "eraser";

type Props = {
  strokes: InkStroke[];
  onChange: (strokes: InkStroke[]) => void;
  tool: Tool;
  color: string;
  paper: PaperStyle;
};

function pathFor(points: InkPoint[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} l 0.1 0.1`;
  return points
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(" ");
}

export default function InkCanvas({ strokes, onChange, tool, color, paper, enabled }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draft, setDraft] = useState<InkStroke | null>(null);

  function pointFromEvent(event: React.PointerEvent<SVGSVGElement>): InkPoint {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1000,
      y: ((event.clientY - rect.top) / rect.height) * 1400
    };
  }

  function beginStroke(event: React.PointerEvent<SVGSVGElement>) {
    if (!enabled || tool === "eraser") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const highlighter = tool === "highlighter";
    setDraft({
      id: crypto.randomUUID(),
      tool: highlighter ? "highlighter" : "pen",
      color,
      width: highlighter ? 22 : 3.4,
      opacity: highlighter ? 0.28 : 1,
      points: [pointFromEvent(event)]
    });
  }

  function extendStroke(event: React.PointerEvent<SVGSVGElement>) {
    if (!draft) return;
    const point = pointFromEvent(event);
    setDraft((current) => current ? { ...current, points: [...current.points, point] } : current);
  }

  function finishStroke(event: React.PointerEvent<SVGSVGElement>) {
    if (!draft) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onChange([...strokes, draft]);
    setDraft(null);
  }

  function eraseStroke(id: string) {
    onChange(strokes.filter((stroke) => stroke.id !== id));
  }

  const renderStroke = (stroke: InkStroke, draftStroke = false) => (
    <path
      key={stroke.id}
      d={pathFor(stroke.points)}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeOpacity={stroke.opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      className={tool === "eraser" && !draftStroke ? "erasableStroke" : undefined}
      onPointerDown={(event) => {
        if (tool === "eraser" && !draftStroke) {
          event.preventDefault();
          eraseStroke(stroke.id);
        }
      }}
      onPointerEnter={(event) => {
        if (tool === "eraser" && !draftStroke && event.buttons === 1) eraseStroke(stroke.id);
      }}
    />
  );

  return (
    <div className={`inkSurface paper-${paper}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1400"
        preserveAspectRatio="none"
        className={`inkCanvas tool-${tool} ${enabled ? "enabled" : "disabled"}`}
        onPointerDown={beginStroke}
        onPointerMove={extendStroke}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        aria-label="Drawing canvas"
      >
        {strokes.map((stroke) => renderStroke(stroke))}
        {draft && renderStroke(draft, true)}
      </svg>
    </div>
  );
}
