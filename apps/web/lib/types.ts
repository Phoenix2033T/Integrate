export type PaperStyle = "blank" | "lined" | "grid" | "dots";
export type AiScope = "page" | "notebook" | "all";

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

export type NoteAttachment = {
  id: string;
  name: string;
  type: "image" | "pdf";
  mimeType: string;
  dataUrl?: string;
  size: number;
  createdAt: number;
};

export type Revision = {
  id: string;
  title: string;
  subject: string;
  body: string;
  createdAt: number;
};

export type Page = {
  id: string;
  title: string;
  subject: string;
  body: string;
  recognizedInk: string;
  paper: PaperStyle;
  strokes: InkStroke[];
  tags: string[];
  favorite: boolean;
  attachments: NoteAttachment[];
  revisions: Revision[];
  updatedAt: number;
};

export type Notebook = {
  id: string;
  title: string;
  emoji: string;
  folder: string;
  pages: Page[];
};

export type IntegrateWorkspace = {
  version: 3;
  notebooks: Notebook[];
};
