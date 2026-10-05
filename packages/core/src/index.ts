export type PaperStyle = "blank" | "lined" | "grid" | "dots" | "cornell" | "engineering" | "isometric";
export type AiScope = "page" | "notebook" | "all";

export type NoteAttachment = {
  id: string;
  name: string;
  type: "image" | "pdf" | "audio";
  mimeType: string;
  dataUrl?: string;
  size: number;
  createdAt: number;
  startedAt?: number;
  durationMs?: number;
};

export type Revision = {
  id: string;
  title: string;
  subject: string;
  body: string;
  createdAt: number;
};

export type InkPoint = { x: number; y: number; pressure?: number };

export type InkStroke = {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  width: number;
  opacity: number;
  points: InkPoint[];
  /** Optional settings preserve compatibility with earlier saved strokes. */
  penStyle?: "fountain" | "ballpoint" | "brush" | "pencil";
  tipSharpness?: number;
  pressureSensitivity?: number;
  tipFlatness?: number;
  createdAt?: number;
  shape?: "line" | "rectangle" | "ellipse" | "arrow";
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

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  symbol?: string;
  createdAt: number;
};

export type Notebook = {
  id: string;
  title: string;
  emoji: string;
  color?: string;
  folderId: string | null;
  favorite?: boolean;
  createdAt?: number;
  tags?: string[];
  trashedAt?: number | null;
  folder?: string;
  pages: Page[];
  updatedAt?: number;
};

export type IntegrateWorkspace = {
  version: 4;
  folders: Folder[];
  notebooks: Notebook[];
};
