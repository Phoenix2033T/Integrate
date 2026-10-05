"use client";

import { useRef, useState } from "react";
import type { InkPoint, InkStroke, PaperStyle } from "../lib/types";
import { createId } from "../lib/id";

type Tool = "pen" | "highlighter" | "eraser" | "shape" | "lasso";
type ShapeKind = "line" | "rectangle" | "ellipse" | "arrow";
type PenStyle = "fountain" | "ballpoint" | "brush" | "pencil";

type Props = {
  strokes: InkStroke[];
  onChange: (strokes: InkStroke[]) => void;
  tool: Tool;
  color: string;
  paper: PaperStyle;
  enabled: boolean;
  width?: number;
  penStyle?: PenStyle;
  tipSharpness?: number;
  pressureSensitivity?: number;
  tipFlatness?: number;
  stabilization?: number;
  playbackTime?: number | null;
  shapeKind?: ShapeKind;
  selectedStrokeIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
};

function pathFor(points: InkPoint[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} l 0.1 0.1`;
  return points
    .map((point, index) => index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`)
    .join(" ");
}

function pointInPolygon(point: InkPoint, polygon: InkPoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y)) &&
      (point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || .00001) + a.x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function variableWidth(stroke: InkStroke, pressure: number, angle: number) {
  const sensitivity = (stroke.pressureSensitivity ?? 75) / 100;
  const sharpness = (stroke.tipSharpness ?? 75) / 100;
  const flatness = (stroke.tipFlatness ?? 33) / 100;
  const styleFactor = stroke.penStyle === "brush" ? 1.25 : 1;
  const pressureCurve = Math.pow(Math.max(.08, pressure), .6 + sharpness);
  const pressureFactor = (1 - sensitivity) + sensitivity * (.36 + pressureCurve * 1.3);
  const directionalFactor = 1 - flatness * .38 * Math.abs(Math.cos(angle));
  return Math.max(.7, stroke.width * styleFactor * pressureFactor * directionalFactor);
}

export default function InkCanvas({
  strokes, onChange, tool, color, paper, enabled, width,
  penStyle = "ballpoint", tipSharpness = 75,
  pressureSensitivity = 75, tipFlatness = 33, stabilization = 35, playbackTime = null,
  shapeKind = "line", selectedStrokeIds = [], onSelectionChange
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draft, setDraft] = useState<InkStroke | null>(null);
  const [lassoDraft, setLassoDraft] = useState<InkPoint[] | null>(null);

  function pointFromEvent(event: PointerEvent | React.PointerEvent<SVGSVGElement>): InkPoint {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0, pressure: .5 };
    const rect = svg.getBoundingClientRect();
    const stylus = event.pointerType === "pen";
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1000,
      y: ((event.clientY - rect.top) / rect.height) * 1400,
      pressure: stylus ? Math.max(.04, Math.min(1, event.pressure || .5)) : .5
    };
  }

  function beginStroke(event: React.PointerEvent<SVGSVGElement>) {
    if (!enabled || !event.isPrimary) return;
    if (tool === "lasso") {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setLassoDraft([pointFromEvent(event)]);
      return;
    }
    if (tool === "eraser") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const highlighter = tool === "highlighter";
    setDraft({
      id: createId(),
      tool: highlighter ? "highlighter" : "pen",
      color,
      width: width ?? (highlighter ? 22 : 3.4),
      opacity: highlighter ? .28 : penStyle === "brush" ? .92 : 1,
      points: [pointFromEvent(event)],
      penStyle: highlighter ? "ballpoint" : penStyle,
      tipSharpness,
      pressureSensitivity,
      tipFlatness,
      createdAt: Date.now(),
      shape: tool === "shape" ? shapeKind : undefined
    });
  }

  function extendStroke(event: React.PointerEvent<SVGSVGElement>) {
    if (tool === "lasso" && lassoDraft) {
      const point = pointFromEvent(event);
      setLassoDraft((current) => current ? [...current, point] : current);
      return;
    }
    if (!draft) return;
    if (draft.shape) {
      const endpoint = pointFromEvent(event);
      setDraft((current) => current ? { ...current, points: [current.points[0], endpoint] } : current);
      return;
    }
    const coalesced = event.nativeEvent.getCoalescedEvents?.();
    const events = coalesced && coalesced.length ? coalesced : [event.nativeEvent];
    setDraft((current) => {
      if (!current) return current;
      const nextPoints = [...current.points];
      for (const source of events) {
        const incoming = pointFromEvent(source);
        const previous = nextPoints[nextPoints.length - 1];
        if (!previous) {
          nextPoints.push(incoming);
          continue;
        }
        const smoothing = current.tool === "highlighter" ? 0 : Math.min(.78, stabilization / 100 * .72);
        const factor = 1 - smoothing;
        const next = {
          x: previous.x + (incoming.x - previous.x) * factor,
          y: previous.y + (incoming.y - previous.y) * factor,
          pressure: (previous.pressure ?? .5) + ((incoming.pressure ?? .5) - (previous.pressure ?? .5)) * factor
        };
        if (Math.hypot(next.x - previous.x, next.y - previous.y) >= .35) nextPoints.push(next);
      }
      return nextPoints.length === current.points.length ? current : { ...current, points: nextPoints };
    });
  }

  function finishStroke(event: React.PointerEvent<SVGSVGElement>) {
    if (tool === "lasso" && lassoDraft) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      const ids = lassoDraft.length >= 3
        ? strokes.filter((stroke) => stroke.points.some((point) => pointInPolygon(point, lassoDraft))).map((stroke) => stroke.id)
        : [];
      onSelectionChange?.(ids);
      setLassoDraft(null);
      return;
    }
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

  function renderStroke(stroke: InkStroke, draftStroke = false) {
    const timelineOpacity = playbackTime && stroke.createdAt && stroke.createdAt > playbackTime ? stroke.opacity * .12 : stroke.opacity;
    if (stroke.shape && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      const common = { fill: "none", stroke: stroke.color, strokeWidth: stroke.width, strokeOpacity: timelineOpacity, vectorEffect: "non-scaling-stroke" as const };
      let shapeDrawing: React.ReactNode;
      if (stroke.shape === "rectangle") shapeDrawing = <rect x={x} y={y} width={w} height={h} rx="3" {...common} />;
      else if (stroke.shape === "ellipse") shapeDrawing = <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...common} />;
      else if (stroke.shape === "arrow") {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const size = Math.max(10, stroke.width * 4);
        const a1 = angle + Math.PI * .82;
        const a2 = angle - Math.PI * .82;
        shapeDrawing = <><line x1={start.x} y1={start.y} x2={end.x} y2={end.y} {...common} /><path d={`M ${end.x + Math.cos(a1) * size} ${end.y + Math.sin(a1) * size} L ${end.x} ${end.y} L ${end.x + Math.cos(a2) * size} ${end.y + Math.sin(a2) * size}`} {...common} /></>;
      } else shapeDrawing = <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} {...common} />;
      return <g key={stroke.id} className={selectedStrokeIds.includes(stroke.id) ? "selectedStroke" : tool === "eraser" && !draftStroke ? "erasableStroke" : undefined}
        onPointerDown={(event) => { if (tool === "eraser" && !draftStroke) { event.preventDefault(); eraseStroke(stroke.id); } }}
        onPointerEnter={(event) => { if (tool === "eraser" && !draftStroke && event.buttons === 1) eraseStroke(stroke.id); }}>
        {shapeDrawing}
      </g>;
    }

    const expressive = stroke.tool === "pen" &&
      (stroke.penStyle === "fountain" || stroke.penStyle === "brush") &&
      stroke.points.some((point) => typeof point.pressure === "number");
    const drawing = expressive && stroke.points.length > 1 ? (
      <g>
        {stroke.points.slice(1).map((point, index) => {
          const previous = stroke.points[index];
          const angle = Math.atan2(point.y - previous.y, point.x - previous.x);
          const pressure = ((point.pressure ?? .5) + (previous.pressure ?? .5)) / 2;
          const segmentWidth = variableWidth(stroke, pressure, angle);
          return (
            <line key={index}
              x1={previous.x} y1={previous.y} x2={point.x} y2={point.y}
              stroke={stroke.color} strokeWidth={segmentWidth}
              strokeOpacity={timelineOpacity} strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>
    ) : (
      <path
        d={pathFor(stroke.points)}
        fill="none"
        stroke={stroke.color}
        strokeWidth={stroke.width}
        strokeOpacity={timelineOpacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );

    return (
      <g
        key={stroke.id}
        className={selectedStrokeIds.includes(stroke.id) ? "selectedStroke" : tool === "eraser" && !draftStroke ? "erasableStroke" : undefined}
        onPointerDown={(event) => {
          if (tool === "eraser" && !draftStroke) {
            event.preventDefault();
            eraseStroke(stroke.id);
          }
        }}
        onPointerEnter={(event) => {
          if (tool === "eraser" && !draftStroke && event.buttons === 1) eraseStroke(stroke.id);
        }}
      >
        {drawing}
      </g>
    );
  }

  return (
    <div className="inkSurface" data-paper={paper}>
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
        {lassoDraft && lassoDraft.length > 1 && <path d={pathFor(lassoDraft)} fill="rgba(103,185,255,.08)" stroke="#67b9ff" strokeWidth="2" strokeDasharray="8 7" vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  );
}
