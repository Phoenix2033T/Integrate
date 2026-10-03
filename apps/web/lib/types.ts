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
  /** Legacy v3 field kept only so older backups can migrate cleanly. */
  folder?: string;
  pages: Page[];
  updatedAt?: number;
};

export type IntegrateWorkspace = {
  version: 4;
  folders: Folder[];
  notebooks: Notebook[];
};
