export type PaperStyle = "blank" | "lined" | "grid" | "dots";

export type InkPoint = {
  x: number;
  y: number;
};

export type InkStroke = {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  width: number;
  opacity: number;
  points: InkPoint[];
};

export type Page = {
  id: string;
  title: string;
  subject: string;
  body: string;
  paper: PaperStyle;
  strokes: InkStroke[];
  updatedAt: number;
};

export type Notebook = {
  id: string;
  title: string;
  emoji: string;
  pages: Page[];
};

export type IntegrateWorkspace = {
  version: 2;
  notebooks: Notebook[];
};
