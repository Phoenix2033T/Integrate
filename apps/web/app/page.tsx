"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import InkCanvas from "../components/InkCanvas";
import { strokesToSvgDataUrl } from "../lib/ink";
import { createId } from "../lib/id";
import type {
  AiScope,
  Folder,
  IntegrateWorkspace,
  Notebook,
  NoteAttachment,
  Page,
  PaperStyle
} from "../lib/types";

type ThemeMode = "light" | "dark";
type AppView = "home" | "notebook";
type LibraryMode = "documents" | "favorites" | "recent" | "trash";
type LibraryLayout = "grid" | "list";
type LibrarySort = "updated" | "title" | "created";
type Tool =
  | "fountain"
  | "ballpoint"
  | "pencil"
  | "brush"
  | "highlighter"
  | "eraser"
  | "lasso"
  | "text"
  | "shapes"
  | "image"
  | "tape"
  | "ruler"
  | "laser"
  | "audio"
  | "elements"
  | "hand";

const STORAGE_KEY = "integrate.workspace.v4";
const V3_KEY = "integrate.workspace.v3";
const THEME_KEY = "integrate.theme";
const PEN_SETTINGS_KEY = "integrate.pen-settings.v1";
type PenSetting = "tipSharpness" | "pressureSensitivity" | "tipFlatness" | "stabilization";
type PenSettings = Record<PenSetting, number>;
const DEFAULT_PEN_SETTINGS: PenSettings = {
  tipSharpness: 75, pressureSensitivity: 75, tipFlatness: 33, stabilization: 35
};

function normalizePage(page: Partial<Page> & { id?: string }): Page {
  return {
    id: page.id || createId(),
    title: page.title || "Untitled Page",
    subject: page.subject || "General",
    body: page.body || "",
    recognizedInk: page.recognizedInk || "",
    paper: page.paper || "lined",
    strokes: page.strokes || [],
    tags: page.tags || [],
    favorite: page.favorite || false,
    attachments: page.attachments || [],
    revisions: page.revisions || [],
    createdAt: page.createdAt || page.updatedAt || Date.now(),
    updatedAt: page.updatedAt || Date.now()
  };
}

function makePage(title = "Untitled Page"): Page {
  return normalizePage({ title });
}

const starterWorkspace: IntegrateWorkspace = {
  version: 4,
  folders: [
    { id: "school", name: "School", parentId: null, color: "#5aa9e6", symbol: "🎓", createdAt: Date.now() },
    { id: "stem-folder", name: "STEM", parentId: "school", color: "#8b7cf6", symbol: "∑", createdAt: Date.now() }
  ],
  notebooks: [
    {
      id: "general",
      title: "My Notes",
      emoji: "📘",
      color: "#5aa9e6",
      folderId: "school",
      updatedAt: Date.now(),
      pages: [
        normalizePage({
          id: "welcome",
          title: "Welcome to Integrate",
          subject: "General",
          body: "Write naturally with your stylus, organize notebooks into folders, and use Integrate AI when you want help studying."
        }),
        normalizePage({
          id: "history",
          title: "History example",
          subject: "History",
          body: "Your handwritten and typed notes stay together in one notebook."
        })
      ]
    },
    {
      id: "stem",
      title: "Calculus",
      emoji: "∫",
      color: "#8b7cf6",
      folderId: "stem-folder",
      updatedAt: Date.now() - 3600000,
      pages: [
        normalizePage({
          id: "calculus",
          title: "Derivatives",
          subject: "Calculus",
          paper: "dots"
        })
      ]
    }
  ]
};

function loadWorkspace(): IntegrateWorkspace {
  const current = window.localStorage.getItem(STORAGE_KEY);
  if (current) {
    try {
      const parsed = JSON.parse(current) as IntegrateWorkspace;
      if (parsed.version === 4 && Array.isArray(parsed.folders) && Array.isArray(parsed.notebooks)) {
        return {
          ...parsed,
          notebooks: parsed.notebooks.map((notebook) => ({
            ...notebook,
            folderId: notebook.folderId ?? null,
            pages: notebook.pages.map(normalizePage)
          }))
        };
      }
    } catch {}
  }

  const v3 = window.localStorage.getItem(V3_KEY);
  if (v3) {
    try {
      const parsed = JSON.parse(v3) as {
        notebooks: Array<Notebook & { folder?: string }>;
      };
      const folderNames = Array.from(
        new Set(parsed.notebooks.map((notebook) => notebook.folder || "Unfiled"))
      );
      const folders: Folder[] = folderNames.map((name, index) => ({
        id: `migrated-folder-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
        parentId: null,
        color: ["#5aa9e6", "#8b7cf6", "#ef6f6c", "#f4a261"][index % 4],
        createdAt: Date.now()
      }));
      return {
        version: 4,
        folders,
        notebooks: parsed.notebooks.map((notebook) => ({
          ...notebook,
          folderId: folders.find((folder) => folder.name === (notebook.folder || "Unfiled"))?.id ?? null,
          pages: notebook.pages.map(normalizePage)
        }))
      };
    } catch {}
  }

  return JSON.parse(JSON.stringify(starterWorkspace)) as IntegrateWorkspace;
}

function toolLabel(tool: Tool) {
  const labels: Record<Tool, string> = {
    fountain: "Fountain",
    ballpoint: "Ballpoint",
    pencil: "Pencil",
    brush: "Brush",
    highlighter: "Highlighter",
    eraser: "Eraser",
    lasso: "Lasso",
    text: "Text",
    shapes: "Shapes",
    image: "Image",
    tape: "Tape",
    ruler: "Ruler",
    laser: "Laser",
    audio: "Audio",
    elements: "Elements",
    hand: "Hand"
  };
  return labels[tool];
}

type IconName = Tool | "pen" | "insert" | "more" | "undo" | "redo" | "sparkles";

function ToolIcon({ name }: { name: IconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  const paths: Record<IconName, React.ReactNode> = {
    pen: <><path d="M4 20l4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m13.8 7.4 2.8 2.8"/></>,
    fountain: <><path d="m5 19 4.5-1.2 9-9a2 2 0 0 0-2.8-2.8l-9 9L5 19Z"/><path d="m13.5 8 2.5 2.5"/><path d="m7 16 2 2"/></>,
    ballpoint: <><path d="M5 19 8.5 18 19 7.5 16.5 5 6 15.5 5 19Z"/><path d="m14.5 7 2.5 2.5"/></>,
    pencil: <><path d="m4 20 4.2-1.1L19 8.1 15.9 5 5.1 15.8 4 20Z"/><path d="m13.9 7 3.1 3.1"/><path d="M4 20l3.1-.8-2.3-2.3L4 20Z"/></>,
    brush: <><path d="M15 3c2.8 1.4 4.5 3.6 3.5 5.5L10 17l-3-3 8-11Z"/><path d="M9 16c.2 2.9-1.9 4.6-5.5 4.5 1.7-1.1 1.2-3.3 3.5-5.1L9 16Z"/></>,
    highlighter: <><path d="m6 15 8.8-8.8 3 3L9 18H6v-3Z"/><path d="M4 20h10"/><path d="m13.5 7.5 3 3"/></>,
    eraser: <><path d="m4.5 15.5 8.7-8.7a2 2 0 0 1 2.8 0l2 2a2 2 0 0 1 0 2.8L10.6 19H8.1l-3.6-3.5Z"/><path d="m11 9 5 5"/><path d="M10.5 19H20"/></>,
    lasso: <><path d="M18.5 6.5c2.6 2.7 1.4 7.2-2.5 9.1-4.1 2-9.6.8-11-2.3-1.5-3.2 1.8-6.7 6.2-7.3 2.8-.4 5.5.3 7.3 1.8"/><path d="M12 16c-.2 2.7 1.3 4 3.6 3.5"/></>,
    text: <><path d="M5 6h14"/><path d="M12 6v13"/><path d="M8.5 19h7"/></>,
    shapes: <><circle cx="8" cy="9" r="3.5"/><path d="m15 5 4 7h-8l4-7Z"/><path d="M5 15h7v5H5z"/></>,
    image: <><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m6.5 17 4.2-4 2.8 2.5 2.2-2 2.3 3.5"/></>,
    insert: <><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></>,
    tape: <><path d="M5 9h14l-2 7H7L5 9Z"/><path d="M8 12h8"/></>,
    ruler: <><path d="m5 17 12-12 2 2L7 19l-2-2Z"/><path d="m10 12 2 2M13 9l2 2M7 15l2 2"/></>,
    laser: <><circle cx="12" cy="12" r="2"/><path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M17.7 6.3l1.4-1.4M4.9 19.1l1.4-1.4"/></>,
    audio: <><rect x="9" y="4" width="6" height="11" rx="3"/><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3M9 20h6"/></>,
    elements: <><path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3Z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></>,
    hand: <><path d="M8 12V7.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 10V8a1.5 1.5 0 0 1 3 0v5"/><path d="M8 11.5 6.8 10a1.5 1.5 0 0 0-2.3 1.9l3.6 5.2A5 5 0 0 0 12.2 19H14a5 5 0 0 0 5-5v-3.5a1.5 1.5 0 0 0-3 0V12"/></>,
    more: <><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></>,
    undo: <><path d="M9 8 5 12l4 4"/><path d="M5 12h8a5 5 0 0 1 5 5"/></>,
    redo: <><path d="m15 8 4 4-4 4"/><path d="M19 12h-8a5 5 0 0 0-5 5"/></>,
    sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m18.5 14 .6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z"/></>
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function toolGroup(tool: Tool) {
  if (["fountain", "ballpoint", "pencil", "brush"].includes(tool)) return "pen";
  if (["image", "tape", "elements"].includes(tool)) return "insert";
  if (["ruler", "laser"].includes(tool)) return "more";
  return tool;
}

function descendantsOf(folderId: string, folders: Folder[]): string[] {
  const direct = folders.filter((folder) => folder.parentId === folderId).map((folder) => folder.id);
  return direct.flatMap((id) => [id, ...descendantsOf(id, folders)]);
}

export default function Home() {
  const [workspace, setWorkspace] = useState<IntegrateWorkspace>(starterWorkspace);
  const [view, setView] = useState<AppView>("home");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedNotebookId, setSelectedNotebookId] = useState("general");
  const [selectedPageId, setSelectedPageId] = useState("welcome");
  const [query, setQuery] = useState("");
  const [libraryMode, setLibraryMode] = useState<LibraryMode>("documents");
  const [libraryLayout, setLibraryLayout] = useState<LibraryLayout>("grid");
  const [librarySort, setLibrarySort] = useState<LibrarySort>("updated");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const [tool, setTool] = useState<Tool>("ballpoint");
  const [lastPenStyle, setLastPenStyle] = useState<Tool>("ballpoint");
  const [inkColor, setInkColor] = useState("#1f2937");
  const [inkWidth, setInkWidth] = useState(3.4);
  const [penSettingsOpen, setPenSettingsOpen] = useState(false);
  const [penSettings, setPenSettings] = useState<PenSettings>(DEFAULT_PEN_SETTINGS);
  const [redoStrokes, setRedoStrokes] = useState<Page["strokes"]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [folderEditorId, setFolderEditorId] = useState<string | null>(null);
  const [notebookEditorId, setNotebookEditorId] = useState<string | null>(null);
  const [pageNavigatorOpen, setPageNavigatorOpen] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiScope, setAiScope] = useState<AiScope>("page");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [recognitionLoading, setRecognitionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceImportRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const initialTheme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    if (initialTheme === "dark") setInkColor("#eaf6ff");
    try {
      const savedPen = window.localStorage.getItem(PEN_SETTINGS_KEY);
      if (savedPen) {
        const parsed = JSON.parse(savedPen) as { settings?: Partial<PenSettings>; style?: Tool };
        const restored = { ...DEFAULT_PEN_SETTINGS };
        for (const key of Object.keys(restored) as PenSetting[]) {
          const value = parsed.settings?.[key];
          if (typeof value === "number" && Number.isFinite(value)) restored[key] = Math.max(0, Math.min(100, value));
        }
        setPenSettings(restored);
        if (parsed.style && ["fountain", "ballpoint", "brush", "pencil"].includes(parsed.style)) {
          setTool(parsed.style);
          setLastPenStyle(parsed.style);
        }
      }
    } catch { /* Ignore invalid saved preferences. */ }

    const loaded = loadWorkspace();
    setWorkspace(loaded);
    const firstNotebook = loaded.notebooks[0];
    if (firstNotebook) {
      setSelectedNotebookId(firstNotebook.id);
      setSelectedPageId(firstNotebook.pages[0]?.id ?? "");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (hydrated) window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PEN_SETTINGS_KEY, JSON.stringify({
      settings: penSettings,
      style: lastPenStyle
    }));
  }, [penSettings, lastPenStyle, hydrated]);

  useEffect(() => {
    setInkColor((current) => {
      if (theme === "dark" && current === "#1f2937") return "#eaf6ff";
      if (theme === "light" && current === "#eaf6ff") return "#1f2937";
      return current;
    });
  }, [theme]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
      setSaveState("saved");
    }, 220);
    return () => window.clearTimeout(timer);
  }, [workspace, hydrated]);

  const selectedNotebook =
    workspace.notebooks.find((notebook) => notebook.id === selectedNotebookId) ??
    workspace.notebooks[0];

  const selectedPage =
    selectedNotebook?.pages.find((page) => page.id === selectedPageId) ??
    selectedNotebook?.pages[0];

  const currentFolder = workspace.folders.find((folder) => folder.id === currentFolderId) ?? null;

  const visibleFolders = useMemo(
    () => workspace.folders.filter((folder) => folder.parentId === currentFolderId),
    [workspace.folders, currentFolderId]
  );

  const visibleNotebooks = useMemo(
    () => workspace.notebooks.filter((notebook) => notebook.folderId === currentFolderId && !notebook.trashedAt),
    [workspace.notebooks, currentFolderId]
  );

  const recentNotebooks = useMemo(
    () => [...workspace.notebooks].filter((notebook) => !notebook.trashedAt).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12),
    [workspace.notebooks]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return workspace.notebooks.filter((notebook) => {
      if (notebook.trashedAt) return false;
      const pageText = notebook.pages.map((page) => `${page.title} ${page.subject} ${page.body} ${page.recognizedInk} ${page.tags.join(" ")}`).join(" ");
      return `${notebook.title} ${(notebook.tags || []).join(" ")} ${pageText}`.toLowerCase().includes(q);
    });
  }, [query, workspace.notebooks]);

  const libraryNotebooks = useMemo(() => {
    let items: Notebook[];
    if (searchResults) items = searchResults;
    else if (libraryMode === "favorites") items = workspace.notebooks.filter((notebook) => notebook.favorite && !notebook.trashedAt);
    else if (libraryMode === "recent") items = recentNotebooks;
    else if (libraryMode === "trash") items = workspace.notebooks.filter((notebook) => notebook.trashedAt);
    else if (currentFolder) items = visibleNotebooks;
    else {
      const rootNotebooks = workspace.notebooks.filter((notebook) => notebook.folderId === null && !notebook.trashedAt);
      items = rootNotebooks.length ? rootNotebooks : recentNotebooks;
    }
    return [...items].sort((a, b) => {
      if (librarySort === "title") return a.title.localeCompare(b.title);
      if (librarySort === "created") return (b.createdAt || 0) - (a.createdAt || 0);
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [searchResults, libraryMode, librarySort, workspace.notebooks, recentNotebooks, currentFolder, visibleNotebooks]);

  const breadcrumbs = useMemo(() => {
    const result: Folder[] = [];
    let cursor = currentFolder;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      result.unshift(cursor);
      cursor = workspace.folders.find((folder) => folder.id === cursor?.parentId) ?? null;
    }
    return result;
  }, [currentFolder, workspace.folders]);

  function renderFolderTree(parentId: string | null, depth = 0): React.ReactNode {
    return workspace.folders
      .filter((folder) => folder.parentId === parentId)
      .map((folder) => {
        const hasChildren = workspace.folders.some((item) => item.parentId === folder.id);
        return (
          <div key={folder.id}>
            <button
              className={`treeFolder ${currentFolderId === folder.id ? "active" : ""}`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
              onClick={() => { setCurrentFolderId(folder.id); setQuery(""); }}
            >
              <span className="treeChevron">{hasChildren ? "⌄" : ""}</span>
              <span className="treeDot" style={{ background: folder.color }} />
              <span className="treeFolderName">{folder.name}</span>
            </button>
            {renderFolderTree(folder.id, depth + 1)}
          </div>
        );
      });
  }

  function patchPage(patch: Partial<Page>) {
    if (!selectedNotebook || !selectedPage) return;
    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id !== selectedNotebook.id
          ? notebook
          : {
              ...notebook,
              updatedAt: Date.now(),
              pages: notebook.pages.map((page) =>
                page.id === selectedPage.id ? { ...page, ...patch, updatedAt: Date.now() } : page
              )
            }
      )
    }));
  }

  function openNotebook(notebook: Notebook, pageId?: string) {
    setSelectedNotebookId(notebook.id);
    setSelectedPageId(pageId || notebook.pages[0]?.id || "");
    setView("notebook");
    setRedoStrokes([]);
  }

  function createFolder() {
    const name = window.prompt("Folder name", "New Folder")?.trim();
    if (!name) return;
    const folder: Folder = {
      id: createId(),
      name,
      parentId: currentFolderId,
      color: ["#5aa9e6", "#8b7cf6", "#ef6f6c", "#f4a261", "#58b09c"][workspace.folders.length % 5],
      symbol: "📁",
      createdAt: Date.now()
    };
    setWorkspace((current) => ({ ...current, folders: [...current.folders, folder] }));
  }

  function createNotebook() {
    const page = makePage();
    const notebook: Notebook = {
      id: createId(),
      title: "New Notebook",
      emoji: "📓",
      color: "#5aa9e6",
      folderId: currentFolderId,
      favorite: false,
      createdAt: Date.now(),
      pages: [page],
      updatedAt: Date.now()
    };
    setWorkspace((current) => ({ ...current, notebooks: [...current.notebooks, notebook] }));
    openNotebook(notebook, page.id);
  }

  function createPage() {
    if (!selectedNotebook) return;
    const page = makePage(`Page ${selectedNotebook.pages.length + 1}`);
    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id === selectedNotebook.id
          ? { ...notebook, updatedAt: Date.now(), pages: [...notebook.pages, page] }
          : notebook
      )
    }));
    setSelectedPageId(page.id);
    setRedoStrokes([]);
  }

  function patchNotebook(patch: Partial<Notebook>) {
    if (!selectedNotebook) return;
    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id === selectedNotebook.id ? { ...notebook, ...patch, updatedAt: Date.now() } : notebook
      )
    }));
  }

  function toggleNotebookFavorite(notebookId: string) {
    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id === notebookId ? { ...notebook, favorite: !notebook.favorite } : notebook
      )
    }));
  }

  function updateFolder(folderId: string, patch: Partial<Folder>) {
    setWorkspace((current) => ({
      ...current,
      folders: current.folders.map((folder) => folder.id === folderId ? { ...folder, ...patch } : folder)
    }));
  }

  function deleteFolder(folder: Folder) {
    const nestedIds = [folder.id, ...descendantsOf(folder.id, workspace.folders)];
    const hasContent =
      workspace.folders.some((item) => nestedIds.includes(item.parentId || "")) ||
      workspace.notebooks.some((notebook) => nestedIds.includes(notebook.folderId || ""));
    if (hasContent) {
      window.alert("This folder contains notebooks or subfolders. Move them before deleting it.");
      return;
    }
    setWorkspace((current) => ({
      ...current,
      folders: current.folders.filter((item) => item.id !== folder.id)
    }));
  }

  function selectTool(next: Tool) {
    setTool(next);
    if (toolGroup(next) === "pen") setLastPenStyle(next);
    if (toolGroup(next) !== "pen") setPenSettingsOpen(false);
    if (next === "fountain") setInkWidth(4.2);
    if (next === "ballpoint") setInkWidth(3.4);
    if (next === "pencil") setInkWidth(2.4);
    if (next === "brush") setInkWidth(6.5);
    if (next === "highlighter") setInkWidth(22);
    if (next === "image") fileInputRef.current?.click();
  }

  function updatePenSetting(key: PenSetting, value: number) {
    setPenSettings((current) => ({ ...current, [key]: value }));
  }

  function undoInk() {
    if (!selectedPage?.strokes.length) return;
    const last = selectedPage.strokes[selectedPage.strokes.length - 1];
    setRedoStrokes((current) => [...current, last]);
    patchPage({ strokes: selectedPage.strokes.slice(0, -1) });
  }

  function redoInk() {
    if (!selectedPage || !redoStrokes.length) return;
    const stroke = redoStrokes[redoStrokes.length - 1];
    patchPage({ strokes: [...selectedPage.strokes, stroke] });
    setRedoStrokes((current) => current.slice(0, -1));
  }

  async function addAttachments(files: FileList | null) {
    if (!files || !selectedPage) return;
    const next: NoteAttachment[] = [];
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) continue;
      let dataUrl: string | undefined;
      if (file.size <= 1_500_000) {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }
      next.push({
        id: createId(),
        name: file.name,
        type: isImage ? "image" : "pdf",
        mimeType: file.type,
        dataUrl,
        size: file.size,
        createdAt: Date.now()
      });
    }
    patchPage({ attachments: [...selectedPage.attachments, ...next] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function buildAiContext(scope: AiScope) {
    const renderPage = (page: Page) =>
      [
        `PAGE: ${page.title}`,
        `SUBJECT: ${page.subject}`,
        page.body,
        page.recognizedInk ? `RECOGNIZED HANDWRITING:\n${page.recognizedInk}` : ""
      ].filter(Boolean).join("\n");

    if (!selectedPage || !selectedNotebook) return "";
    if (scope === "page") return renderPage(selectedPage);
    if (scope === "notebook") return selectedNotebook.pages.map(renderPage).join("\n\n");
    return workspace.notebooks
      .map((notebook) => `NOTEBOOK: ${notebook.title}\n${notebook.pages.map(renderPage).join("\n\n")}`)
      .join("\n\n=====\n\n");
  }

  async function askAi() {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scope: aiScope, context: buildAiContext(aiScope) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI request failed.");
      setAiResponse(payload.text);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI request failed.");
    } finally {
      setAiLoading(false);
    }
  }

  async function recognizeInk() {
    if (!selectedPage?.strokes.length) return;
    setRecognitionLoading(true);
    try {
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: strokesToSvgDataUrl(selectedPage.strokes),
          subject: selectedPage.subject
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Recognition failed.");
      patchPage({ recognizedInk: payload.text });
      setDetailsOpen(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Recognition failed.");
    } finally {
      setRecognitionLoading(false);
    }
  }

  const drawingTool =
    tool === "highlighter" ? "highlighter" :
    tool === "eraser" ? "eraser" :
    "pen";
  const drawingEnabled = ["fountain", "ballpoint", "pencil", "highlighter", "eraser"].includes(tool);

  if (view === "home") {
    const displayedNotebooks = libraryNotebooks;
    const folderBeingEdited = workspace.folders.find((folder) => folder.id === folderEditorId) ?? null;
    const folderColors = ["#5aa9e6", "#6d9eeb", "#8b7cf6", "#d16ba5", "#ef6f6c", "#f4a261", "#f6c453", "#58b09c", "#39a9a3", "#64748b"];
    const folderSymbols = ["📁", "🎓", "📚", "∑", "🧪", "✦", "🎨", "💡", "⚙", "🏠", "⭐", "🗂️"];

    return (
      <main className="libraryShell libraryShellNoSidebar">
        <section className="libraryMain">
          <header className="libraryTopbar libraryTopbarFull">
            <button className="libraryWordmark" onClick={() => { setCurrentFolderId(null); setQuery(""); setLibraryMode("documents"); }} aria-label="Go to Documents">
              <span className="brandMark">∫</span>
              <span><strong>Integrate</strong><small>Documents</small></span>
            </button>

            <div className="librarySearch">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notebooks and notes" /></div>

            <nav className="libraryQuickNav" aria-label="Library views">
              <button className={!query && libraryMode === "documents" ? "active" : ""} onClick={() => { setCurrentFolderId(null); setQuery(""); setLibraryMode("documents"); }}>Documents</button>
              <button className={!query && libraryMode === "favorites" ? "active" : ""} onClick={() => { setCurrentFolderId(null); setQuery(""); setLibraryMode("favorites"); }}>Favorites</button>
              <button className={!query && libraryMode === "recent" ? "active" : ""} onClick={() => { setCurrentFolderId(null); setQuery(""); setLibraryMode("recent"); }}>Recent</button>
            </nav>

            <div className="libraryTopActions">
              <button className="libraryIconButton layoutQuickButton" onClick={() => setLibraryLayout((value) => value === "grid" ? "list" : "grid")} title={libraryLayout === "grid" ? "Switch to list view" : "Switch to grid view"} aria-label="Change library layout">{libraryLayout === "grid" ? "☷" : "▦"}</button>
              <button className="libraryIconButton themeQuickButton" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Switch appearance">{theme === "dark" ? "☀" : "☾"}</button>
              <button className="primary newLibraryButton" onClick={createNotebook}>＋ New notebook</button>
              <button className="libraryIconButton newFolderButton" onClick={createFolder} title="New folder">
                <span className="miniFolderIcon" />＋
              </button>
            </div>
          </header>

          <div className="libraryContent libraryContentWide">
            <div className="libraryHeadingRow">
              <div>
                <div className="breadcrumbs">
                  <button onClick={() => { setCurrentFolderId(null); setLibraryMode("documents"); }}>Documents</button>
                  {breadcrumbs.map((folder) => <span key={folder.id}>› <button onClick={() => setCurrentFolderId(folder.id)}>{folder.name}</button></span>)}
                </div>
                <h1>{currentFolder?.name || "Documents"}</h1>
              </div>
              {currentFolder && (
                <div className="headingActions">
                  <button className="subtleButton" onClick={() => setFolderEditorId(currentFolder.id)}>Customize folder</button>
                  <button className="subtleButton dangerText" onClick={() => deleteFolder(currentFolder)}>Delete</button>
                </div>
              )}
            </div>

            {!searchResults && libraryMode === "documents" && visibleFolders.length > 0 && (
              <>
                <div className="sectionHeadingWithHint"><h2 className="sectionTitle">Folders</h2><span>Folders can contain folders and notebooks</span></div>
                <div className="documentGrid folderGrid">
                  {visibleFolders.map((folder) => {
                    const childCount = workspace.folders.filter((item) => item.parentId === folder.id).length;
                    const notebookCount = workspace.notebooks.filter((item) => item.folderId === folder.id).length;
                    return (
                      <div className="folderTile folderTileCard" key={folder.id}>
                        <button className="folderOpenButton" onClick={() => setCurrentFolderId(folder.id)} aria-label={`Open ${folder.name}`}>
                          <div className="folderVisual" style={{ "--folder-color": folder.color } as React.CSSProperties}>
                            <span className="folderSymbol">{folder.symbol || "📁"}</span>
                          </div>
                          <strong>{folder.name}</strong>
                          <small>{childCount} {childCount === 1 ? "folder" : "folders"} · {notebookCount} {notebookCount === 1 ? "notebook" : "notebooks"}</small>
                        </button>
                        <button className="itemMoreButton" onClick={() => setFolderEditorId(folder.id)} title="Customize folder" aria-label={`Customize ${folder.name}`}>•••</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="sectionHeadingWithHint">
              <h2 className="sectionTitle">{searchResults ? "Search results" : libraryMode === "favorites" ? "Favorites" : libraryMode === "recent" ? "Recent" : currentFolder ? "Notebooks" : "Notebooks"}</h2>
              {!searchResults && <span>{libraryMode === "favorites" ? "Your starred notebooks" : libraryMode === "recent" ? "Recently edited" : currentFolder ? "Notebooks in this folder" : "Your notebooks"}</span>}
            </div>
            <div className={`documentGrid notebookGrid ${libraryLayout === "list" ? "notebookList" : ""}`}>
              {displayedNotebooks.map((notebook) => (
                <div className="notebookTileWrap" key={notebook.id}>
                  <button className="notebookTile notebookTileCard" onClick={() => openNotebook(notebook)}>
                    <div className="notebookCover" style={{ "--notebook-color": notebook.color || "#5aa9e6" } as React.CSSProperties}>
                      <span className="notebookSpine" />
                      <span className="notebookPageEdge" />
                      <span className="coverEmoji">{notebook.emoji}</span>
                      <span className="coverLabel">INTEGRATE</span>
                      <span className="coverLines" />
                    </div>
                    <span className="notebookMeta">
                      <strong>{notebook.title}</strong>
                      <small><span className="typePill">Notebook</span>{notebook.pages.length} pages · {new Date(notebook.updatedAt || Date.now()).toLocaleDateString()}</small>
                    </span>
                  </button>
                  <button className={`notebookFavoriteButton ${notebook.favorite ? "active" : ""}`} onClick={(event) => { event.stopPropagation(); toggleNotebookFavorite(notebook.id); }} aria-label={notebook.favorite ? `Remove ${notebook.title} from favorites` : `Add ${notebook.title} to favorites`} title={notebook.favorite ? "Remove from favorites" : "Add to favorites"}>{notebook.favorite ? "★" : "☆"}</button>
                </div>
              ))}
              {!searchResults && libraryMode === "documents" && currentFolder && visibleNotebooks.length === 0 && (
                <button className="emptyCreateTile" onClick={createNotebook}>＋<strong>Create notebook</strong><small>Inside {currentFolder.name}</small></button>
              )}
              {!searchResults && libraryMode === "favorites" && displayedNotebooks.length === 0 && (
                <div className="libraryEmptyState"><span>☆</span><strong>No favorites yet</strong><small>Star a notebook to keep it one tap away.</small></div>
              )}
            </div>
          </div>
        </section>

        {folderBeingEdited && (
          <div className="folderEditorBackdrop" role="presentation" onMouseDown={() => setFolderEditorId(null)}>
            <section className="folderEditorCard" role="dialog" aria-modal="true" aria-label="Customize folder" onMouseDown={(event) => event.stopPropagation()}>
              <div className="folderEditorHeader">
                <div>
                  <span className="eyebrow">Folder appearance</span>
                  <h2>Customize {folderBeingEdited.name}</h2>
                </div>
                <button className="closeFolderEditor" onClick={() => setFolderEditorId(null)}>×</button>
              </div>
              <label className="folderNameField">Name<input value={folderBeingEdited.name} onChange={(event) => updateFolder(folderBeingEdited.id, { name: event.target.value })} /></label>
              <div className="folderEditorSection">
                <strong>Color</strong>
                <div className="folderColorChoices">
                  {folderColors.map((color) => (
                    <button key={color} className={folderBeingEdited.color === color ? "active" : ""} style={{ background: color }} onClick={() => updateFolder(folderBeingEdited.id, { color })} aria-label={`Use folder color ${color}`} />
                  ))}
                </div>
              </div>
              <div className="folderEditorSection">
                <strong>Symbol</strong>
                <div className="folderSymbolChoices">
                  {folderSymbols.map((symbol) => (
                    <button key={symbol} className={(folderBeingEdited.symbol || "📁") === symbol ? "active" : ""} onClick={() => updateFolder(folderBeingEdited.id, { symbol })}>{symbol}</button>
                  ))}
                </div>
              </div>
              <div className="folderPreview">
                <div className="folderVisual" style={{ "--folder-color": folderBeingEdited.color } as React.CSSProperties}><span className="folderSymbol">{folderBeingEdited.symbol || "📁"}</span></div>
                <div><strong>{folderBeingEdited.name}</strong><small>Folder</small></div>
              </div>
              <button className="primary folderDoneButton" onClick={() => setFolderEditorId(null)}>Done</button>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className={`editorShell ${aiOpen ? "withAI" : ""}`}>
      <section className="notebookWorkspace">
        <header className="editorHeader">
          <button className="backButton" onClick={() => setView("home")}>‹</button>
          <div className="notebookTitleBlock">
            <input value={selectedNotebook?.title || ""} onChange={(event) => patchNotebook({ title: event.target.value })} aria-label="Notebook title" />
            <span>{saveState === "saved" ? "Saved" : "Saving…"}</span>
          </div>
          <div className="pageTabs">
            {selectedNotebook?.pages.slice(0, 7).map((page) => (
              <button key={page.id} className={page.id === selectedPage?.id ? "active" : ""} onClick={() => { setSelectedPageId(page.id); setRedoStrokes([]); }}>{page.title}</button>
            ))}
            <button className="addTab" onClick={createPage}>＋</button>
          </div>
          <div className="editorHeaderActions">
            <button className={selectedNotebook?.favorite ? "headerAction favorite active" : "headerAction favorite"} onClick={() => selectedNotebook && toggleNotebookFavorite(selectedNotebook.id)} aria-label={selectedNotebook?.favorite ? "Remove notebook from favorites" : "Add notebook to favorites"} title="Favorite notebook">{selectedNotebook?.favorite ? "★" : "☆"}</button>
            <div className="pageCounter">{(selectedNotebook?.pages.findIndex((page) => page.id === selectedPage?.id) ?? 0) + 1}<span>/</span>{selectedNotebook?.pages.length ?? 1}</div>
            <button className={detailsOpen ? "headerAction active" : "headerAction"} onClick={() => setDetailsOpen((value) => !value)} aria-label="Page details" title="Page details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 10v6M12 7.5h.01"/></svg>
            </button>
            <button className="aiHeaderButton" onClick={() => setAiOpen((value) => !value)}><ToolIcon name="sparkles" /><span>AI</span></button>
          </div>
        </header>

        {selectedPage && (
          <>
            <div className="floatingToolDock nestedDock" role="toolbar" aria-label="Notebook tools">
              <div className="primaryToolRow">
                <button className={`modernTool ${toolGroup(tool) === "pen" ? "active" : ""}`} onClick={() => {
                  if (toolGroup(tool) !== "pen") selectTool(lastPenStyle);
                  setPenSettingsOpen((open) => !open);
                }} title="Pen settings" aria-expanded={penSettingsOpen} aria-haspopup="dialog">
                  <ToolIcon name="pen" /><span>Pen⌄</span>
                </button>
                <button className={`modernTool ${tool === "highlighter" ? "active" : ""}`} onClick={() => selectTool("highlighter")} title="Highlighter">
                  <ToolIcon name="highlighter" /><span>Highlighter</span>
                </button>
                <button className={`modernTool ${tool === "eraser" ? "active" : ""}`} onClick={() => selectTool("eraser")} title="Eraser">
                  <ToolIcon name="eraser" /><span>Eraser</span>
                </button>
                <button className={`modernTool ${tool === "lasso" ? "active" : ""}`} onClick={() => selectTool("lasso")} title="Select">
                  <ToolIcon name="lasso" /><span>Select</span>
                </button>
                <button className={`modernTool ${tool === "text" ? "active" : ""}`} onClick={() => selectTool("text")} title="Text">
                  <ToolIcon name="text" /><span>Text</span>
                </button>
                <button className={`modernTool ${tool === "shapes" ? "active" : ""}`} onClick={() => selectTool("shapes")} title="Shapes">
                  <ToolIcon name="shapes" /><span>Shapes</span>
                </button>
                <button className={`modernTool ${toolGroup(tool) === "insert" ? "active" : ""}`} onClick={() => selectTool("elements")} title="Insert">
                  <ToolIcon name="insert" /><span>Insert</span>
                </button>
                <button className={`modernTool ${tool === "audio" ? "active" : ""}`} onClick={() => selectTool("audio")} title="Audio">
                  <ToolIcon name="audio" /><span>Audio</span>
                </button>
                <button className={`modernTool ${toolGroup(tool) === "more" ? "active" : ""}`} onClick={() => selectTool("ruler")} title="More tools">
                  <ToolIcon name="more" /><span>More</span>
                </button>
                <button className={`modernTool ${tool === "hand" ? "active" : ""}`} onClick={() => selectTool("hand")} title="Pan">
                  <ToolIcon name="hand" /><span>Pan</span>
                </button>
                <div className="primarySpacer" />
                <button className="utilityTool" onClick={undoInk} disabled={!selectedPage.strokes.length} title="Undo"><ToolIcon name="undo" /></button>
                <button className="utilityTool" onClick={redoInk} disabled={!redoStrokes.length} title="Redo"><ToolIcon name="redo" /></button>
              </div>

              {penSettingsOpen && (
                <section className="penSettingsPopover" role="dialog" aria-label="Pen settings"
                  onKeyDown={(event) => { if (event.key === "Escape") setPenSettingsOpen(false); }}>
                  <div className="penPopoverHeader">
                    <strong>Pen settings</strong>
                    <button onClick={() => setPenSettingsOpen(false)} aria-label="Close pen settings">×</button>
                  </div>
                  <div className="penStyleChoices" role="group" aria-label="Pen style">
                    {(["fountain", "ballpoint", "brush"] as Tool[]).map((name) => (
                      <button key={name} className={tool === name ? "active" : ""} onClick={() => selectTool(name)}>
                        <ToolIcon name={name} />
                        <span>{name === "fountain" ? "Fountain pen" : name === "ballpoint" ? "Ball pen" : "Brush pen"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="penSliderGroup">
                    {([
                      ["tipSharpness", "Tip sharpness"],
                      ["pressureSensitivity", "Pressure sensitivity"],
                      ["tipFlatness", "Tip flatness"],
                      ["stabilization", "Stroke stabilization"]
                    ] as [PenSetting, string][]).map(([key, label]) => (
                      <label className="penSlider" key={key}>
                        <span><strong>{label}</strong><output>{penSettings[key]}%</output></span>
                        <input type="range" min={0} max={100} step={1} value={penSettings[key]}
                          onChange={(event) => updatePenSetting(key, Number(event.target.value))} />
                      </label>
                    ))}
                    <p className="penSettingsHint">Pressure and nib shape affect fountain and brush strokes. Pressure requires a compatible stylus; stabilization also works with touch or a mouse.</p>
                  </div>
                  <div className="penPopoverSection">
                    <strong>Writing aids</strong>
                    <button onClick={() => updatePenSetting("stabilization", penSettings.stabilization === 0 ? 35 : 0)}>
                      <span>Stroke smoothing</span><span>{penSettings.stabilization === 0 ? "Off" : "On"} ›</span>
                    </button>
                    <button onClick={() => {
                      setPenSettingsOpen(false);
                      if (selectedPage.strokes.length) void recognizeInk();
                      else window.alert("Write something first, then use Ink → Text.");
                    }}>
                      <span>Handwriting → Text</span><span>›</span>
                    </button>
                    <button onClick={() => {
                      setPenSettingsOpen(false);
                      setAiOpen(true);
                      setAiPrompt("Help me understand and check the math in my notes. If handwriting is missing, ask me to recognize it first.");
                    }}>
                      <span>Math assist</span><span>›</span>
                    </button>
                  </div>
                  <div className="penPopoverSection">
                    <strong>Palette shortcuts</strong>
                    <div className="penPaletteShortcuts">
                      {["#1f2937", "#ffffff", "#1677c8", "#ef4444", "#f59e0b", "#22c55e", "#8b5cf6"].map((color) => (
                        <button key={color} className={inkColor === color ? "active" : ""}
                          style={{ background: color }} onClick={() => setInkColor(color)} aria-label={`Use ${color}`} />
                      ))}
                      <label className="penPaletteCustom" title="Choose a custom ink color">
                        +<input type="color" value={inkColor} onChange={(event) => setInkColor(event.target.value)} />
                      </label>
                    </div>
                    <button className="penReset" onClick={() => setPenSettings(DEFAULT_PEN_SETTINGS)}>Reset pen settings</button>
                  </div>
                </section>
              )}

              <div className="contextToolRow">
                <div className="contextIdentity">
                  <strong>{toolGroup(tool) === "pen" ? "Pen" : toolGroup(tool) === "insert" ? "Insert" : toolGroup(tool) === "more" ? "More" : toolLabel(tool)}</strong>
                </div>

                {toolGroup(tool) === "pen" && (
                  <button className="nestedChoice penSettingsTrigger" onClick={() => setPenSettingsOpen((open) => !open)} aria-expanded={penSettingsOpen}>
                    <ToolIcon name={tool} /><span>{toolLabel(tool)} · Settings ⌄</span>
                  </button>
                )}

                {toolGroup(tool) === "insert" && (
                  <div className="nestedChoices">
                    <button className={`nestedChoice ${tool === "image" ? "active" : ""}`} onClick={() => selectTool("image")}><ToolIcon name="image" /><span>Image / PDF</span></button>
                    <button className={`nestedChoice ${tool === "tape" ? "active" : ""}`} onClick={() => selectTool("tape")}><ToolIcon name="tape" /><span>Tape</span></button>
                    <button className={`nestedChoice ${tool === "elements" ? "active" : ""}`} onClick={() => selectTool("elements")}><ToolIcon name="elements" /><span>Elements</span></button>
                  </div>
                )}

                {toolGroup(tool) === "more" && (
                  <div className="nestedChoices">
                    <button className={`nestedChoice ${tool === "ruler" ? "active" : ""}`} onClick={() => selectTool("ruler")}><ToolIcon name="ruler" /><span>Ruler</span></button>
                    <button className={`nestedChoice ${tool === "laser" ? "active" : ""}`} onClick={() => selectTool("laser")}><ToolIcon name="laser" /><span>Laser</span></button>
                    <button className="nestedChoice" onClick={() => void recognizeInk()} disabled={!selectedPage.strokes.length || recognitionLoading}><ToolIcon name="sparkles" /><span>{recognitionLoading ? "Reading…" : "Ink → Text"}</span></button>
                    <label className="paperNested"><span>Paper</span><select value={selectedPage.paper} onChange={(event) => patchPage({ paper: event.target.value as PaperStyle })}><option value="blank">Blank</option><option value="lined">Ruled</option><option value="grid">Grid</option><option value="dots">Dots</option></select></label>
                  </div>
                )}

                {tool === "shapes" && (
                  <div className="nestedChoices shapeChoices">
                    <button className="shapeChoice" title="Line">╱</button><button className="shapeChoice" title="Rectangle">□</button><button className="shapeChoice" title="Circle">○</button><button className="shapeChoice" title="Arrow">→</button>
                  </div>
                )}

                {tool === "lasso" && (
                  <div className="nestedChoices"><button className="segmented active">All</button><button className="segmented">Ink</button><button className="segmented">Text</button><button className="segmented">Images</button></div>
                )}

                {tool === "eraser" && (
                  <div className="nestedChoices"><button className="segmented active">Stroke</button><button className="segmented">Precision</button></div>
                )}

                {tool === "text" && (
                  <div className="nestedChoices textNested"><button className="segmented active">Body</button><button className="segmented">Heading</button><button className="segmented">A−</button><button className="segmented">A＋</button></div>
                )}

                {tool === "audio" && (
                  <div className="nestedChoices"><button className="recordButton"><span className="recordDot" /> Start recording</button><span className="contextHint">Audio notes will stay linked to this page.</span></div>
                )}

                {tool === "hand" && <span className="contextHint">Drag to move around the page without drawing.</span>}

                {(["fountain", "ballpoint", "pencil", "brush", "highlighter"] as Tool[]).includes(tool) && (
                  <>
                    <div className="contextDivider" />
                    <div className="colorStrip">
                      <label className="roundColor compactColor" title="Custom color"><input type="color" value={inkColor} onChange={(event) => setInkColor(event.target.value)} /><span style={{ background: inkColor }} /></label>
                      {["#1f2937", "#ffffff", "#1677c8", "#ef4444", "#f59e0b", "#22c55e", "#8b5cf6"].map((color) => (
                        <button key={color} className={`colorDot ${inkColor === color ? "active" : ""}`} style={{ background: color }} onClick={() => setInkColor(color)} aria-label={`Use ${color}`} />
                      ))}
                    </div>
                    <div className="contextDivider" />
                    <div className="widthStrip">
                      {[2.4, 3.4, 5.2].map((width) => <button key={width} className={`widthDot ${Math.abs(inkWidth - width) < .2 ? "active" : ""}`} onClick={() => setInkWidth(width)} aria-label={`Stroke width ${width}`}><i style={{ width: Math.max(5, width * 2), height: Math.max(5, width * 2) }} /></button>)}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="focusCanvas">
              <article className={`document paper-${selectedPage.paper}`}>
                {detailsOpen && (
                  <div className="editorDetails">
                    <input className="titleInput" value={selectedPage.title} onChange={(event) => patchPage({ title: event.target.value })} />
                    <input className="subjectInput" value={selectedPage.subject} onChange={(event) => patchPage({ subject: event.target.value })} placeholder="Subject" />
                    {selectedPage.recognizedInk && <div className="recognizedInkCard"><strong>Recognized handwriting</strong><pre>{selectedPage.recognizedInk}</pre></div>}
                    {selectedPage.attachments.length > 0 && <div className="attachmentCount">{selectedPage.attachments.length} attachment(s)</div>}
                  </div>
                )}
                <div className="pageBody">
                  <textarea
                    className={`editor ${tool !== "text" ? "drawingMode" : ""}`}
                    placeholder="Tap Text to type, or choose a pen to write."
                    value={selectedPage.body}
                    onChange={(event) => patchPage({ body: event.target.value })}
                    readOnly={tool !== "text"}
                  />
                  <InkCanvas
                    strokes={selectedPage.strokes}
                    onChange={(strokes) => { patchPage({ strokes }); setRedoStrokes([]); }}
                    tool={drawingTool}
                    color={inkColor}
                    paper={selectedPage.paper}
                    enabled={drawingEnabled}
                    width={inkWidth}
                    penStyle={tool === "fountain" ? "fountain" : tool === "brush" ? "brush" : tool === "pencil" ? "pencil" : "ballpoint"}
                    tipSharpness={penSettings.tipSharpness}
                    pressureSensitivity={penSettings.pressureSensitivity}
                    tipFlatness={penSettings.tipFlatness}
                    stabilization={penSettings.stabilization}
                  />
                </div>
              </article>
            </div>

            <input ref={fileInputRef} className="hiddenInput" type="file" multiple accept="image/*,application/pdf" onChange={(event) => void addAttachments(event.target.files)} />
          </>
        )}
      </section>

      {aiOpen && selectedPage && (
        <aside className="aiPanel editorAiPanel">
          <div className="aiHeader"><div><div className="aiTitle">Integrate AI</div><div className="muted small">Grounded in your notes</div></div><button className="iconButton" onClick={() => setAiOpen(false)}>×</button></div>
          <div className="contextPills">
            {(["page", "notebook", "all"] as AiScope[]).map((scope) => <button key={scope} className={`contextPill ${aiScope === scope ? "active" : ""}`} onClick={() => setAiScope(scope)}>{scope === "page" ? "Page" : scope === "notebook" ? "Notebook" : "All notes"}</button>)}
          </div>
          <div className="aiSuggestionGrid">
            {["Summarize", "Quiz me", "Explain", "Find gaps", "Study guide", "Flashcards"].map((label) => <button key={label} onClick={() => setAiPrompt(label === "Quiz me" ? "Quiz me on these notes." : `${label} these notes.`)}>{label}</button>)}
          </div>
          <div className="aiResult">
            {aiLoading && <div className="aiStatus">Integrate AI is thinking…</div>}
            {aiError && <div className="aiError">{aiError}</div>}
            {aiResponse && <div className="aiResponseText">{aiResponse}</div>}
            {!aiLoading && !aiError && !aiResponse && <div className="aiMessage">Ask about the current page, this notebook, or all of your notes.</div>}
          </div>
          <div className="aiComposer"><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Ask about your notes…" /><button className="primary" onClick={() => void askAi()} disabled={!aiPrompt.trim() || aiLoading}>Send</button></div>
        </aside>
      )}
    </main>
  );
}
