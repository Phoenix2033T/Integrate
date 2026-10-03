import type { InkStroke } from "./types";

function escapeAttribute(value: string) {
  return value.replace(/[&"<>'`]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      '"': "&quot;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "`": "&#96;"
    };
    return entities[character] || character;
  });
}

export function strokesToSvgDataUrl(strokes: InkStroke[]) {
  const paths = strokes
    .filter((stroke) => stroke.points.length > 0)
    .map((stroke) => {
      const points = stroke.points.map((point) => `${point.x},${point.y}`).join(" ");
      return `<polyline points="${points}" fill="none" stroke="${escapeAttribute(stroke.color)}" stroke-width="${stroke.width}" stroke-opacity="${stroke.opacity}" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1400" width="1000" height="1400"><rect width="100%" height="100%" fill="white"/>${paths}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
