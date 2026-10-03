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
type Tool =
  | "fountain"
  | "ballpoint"
  | "pencil"
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
    updatedAt: page.updatedAt || Date.now()
  };
}

function makePage(title = "Untitled Page"): Page {
  return normalizePage({ title });
}

const starterWorkspace: IntegrateWorkspace = {
  version: 4,
  folders: [
    { id: "school", name: "School", parentId: null, color: "#5aa9e6", createdAt: Date.now() },
    { id: "stem-folder", name: "STEM", parentId: "school", color: "#8b7cf6", createdAt: Date.now() }
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

function toolIcon(tool: Tool) {
  const icons: Record<Tool, string> = {
    fountain: "✒",
    ballpoint: "✎",
    pencil: "✏",
    highlighter: "▰",
    eraser: "◇",
    lasso: "◌",
    text: "T",
    shapes: "△",
    image: "▧",
    tape: "▱",
    ruler: "📏",
    laser: "•",
    audio: "◉",
    elements: "✦",
    hand: "☝"
  };
  return icons[tool];
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
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const [tool, setTool] = useState<Tool>("ballpoint");
  const [inkColor, setInkColor] = useState("#1f2937");
  const [inkWidth, setInkWidth] = useState(3.4);
  const [redoStrokes, setRedoStrokes] = useState<Page["strokes"]>([]);
  const [toolMessage, setToolMessage] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiScope, setAiScope] = useState<AiScope>("page");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [recognitionLoading, setRecognitionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const initialTheme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;

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
    () => workspace.notebooks.filter((notebook) => notebook.folderId === currentFolderId),
    [workspace.notebooks, currentFolderId]
  );

  const recentNotebooks = useMemo(
    () => [...workspace.notebooks].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6),
    [workspace.notebooks]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return workspace.notebooks.filter((notebook) => {
      const pageText = notebook.pages.map((page) => `${page.title} ${page.subject} ${page.body}`).join(" ");
      return `${notebook.title} ${pageText}`.toLowerCase().includes(q);
    });
  }, [query, workspace.notebooks]);

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
    setToolMessage("");
    if (next === "fountain") setInkWidth(4.2);
    if (next === "ballpoint") setInkWidth(3.4);
    if (next === "pencil") setInkWidth(2.4);
    if (next === "highlighter") setInkWidth(22);
    if (["lasso", "shapes", "tape", "ruler", "laser", "audio", "elements", "hand"].includes(next)) {
      setToolMessage(`${toolLabel(next)} is in the toolbar foundation; its advanced interaction is the next engine layer.`);
    }
    if (next === "image") fileInputRef.current?.click();
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
    const displayedNotebooks = searchResults ?? visibleNotebooks;
    return (
      <main className="libraryShell">
        <aside className="librarySidebar">
          <div className="brand libraryBrand">
            <div className="brandMark">∫</div>
            <div><div className="brandName">Integrate</div><div className="muted small">Handwritten intelligence</div></div>
          </div>

          <button className="libraryNav active" onClick={() => { setCurrentFolderId(null); setQuery(""); }}>⌂ <span>Documents</span></button>
          <button className="libraryNav" onClick={() => setQuery("★")}>☆ <span>Favorites</span></button>
          <button className="libraryNav" onClick={() => setQuery("")}>◷ <span>Recent</span></button>

          <div className="librarySidebarLabel">Folders</div>
          <div className="folderTree">
            {workspace.folders.filter((folder) => folder.parentId === null).map((folder) => (
              <button key={folder.id} className="treeFolder" onClick={() => { setCurrentFolderId(folder.id); setQuery(""); }}>
                <span className="treeDot" style={{ background: folder.color }} />{folder.name}
              </button>
            ))}
          </div>

          <div className="sidebarBottom">
            <div className="themeSwitcher" role="group" aria-label="Appearance">
              <button className={`themeChoice ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>☀ Light</button>
              <button className={`themeChoice ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>☾ Dark</button>
            </div>
          </div>
        </aside>

        <section className="libraryMain">
          <header className="libraryTopbar">
            <div className="librarySearch">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notebooks and notes" /></div>
            <div className="libraryTopActions">
              <button className="libraryIconButton" title="Grid view">▦</button>
              <button className="primary newLibraryButton" onClick={createNotebook}>＋ New notebook</button>
              <button className="libraryIconButton" onClick={createFolder} title="New folder">📁＋</button>
            </div>
          </header>

          <div className="libraryContent">
            <div className="libraryHeadingRow">
              <div>
                <div className="breadcrumbs">
                  <button onClick={() => setCurrentFolderId(null)}>Documents</button>
                  {breadcrumbs.map((folder) => <span key={folder.id}>› <button onClick={() => setCurrentFolderId(folder.id)}>{folder.name}</button></span>)}
                </div>
                <h1>{currentFolder?.name || "Documents"}</h1>
              </div>
              {currentFolder && <button className="subtleButton" onClick={() => deleteFolder(currentFolder)}>Folder options</button>}
            </div>

            {!searchResults && visibleFolders.length > 0 && (
              <>
                <h2 className="sectionTitle">Folders</h2>
                <div className="documentGrid folderGrid">
                  {visibleFolders.map((folder) => {
                    const childCount = workspace.folders.filter((item) => item.parentId === folder.id).length;
                    const notebookCount = workspace.notebooks.filter((item) => item.folderId === folder.id).length;
                    return (
                      <button className="folderTile" key={folder.id} onClick={() => setCurrentFolderId(folder.id)}>
                        <div className="folderVisual" style={{ "--folder-color": folder.color } as React.CSSProperties}><span>☆</span></div>
                        <strong>{folder.name}</strong>
                        <small>{childCount} folders · {notebookCount} notebooks</small>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <h2 className="sectionTitle">{searchResults ? "Search results" : currentFolder ? "Notebooks" : "Recent notebooks"}</h2>
            <div className="documentGrid">
              {(searchResults ?? (currentFolder ? displayedNotebooks : recentNotebooks)).map((notebook) => (
                <button className="notebookTile" key={notebook.id} onClick={() => openNotebook(notebook)}>
                  <div className="notebookCover" style={{ "--notebook-color": notebook.color || "#5aa9e6" } as React.CSSProperties}>
                    <span className="coverEmoji">{notebook.emoji}</span>
                    <span className="coverLines" />
                  </div>
                  <strong>{notebook.title}</strong>
                  <small>{notebook.pages.length} pages · {new Date(notebook.updatedAt || Date.now()).toLocaleDateString()}</small>
                </button>
              ))}
              {!searchResults && currentFolder && visibleNotebooks.length === 0 && (
                <button className="emptyCreateTile" onClick={createNotebook}>＋<strong>Create notebook</strong><small>Inside {currentFolder.name}</small></button>
              )}
            </div>
          </div>
        </section>
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
            <button onClick={() => setDetailsOpen((value) => !value)}>ⓘ</button>
            <button className="aiHeaderButton" onClick={() => setAiOpen((value) => !value)}>✦ AI</button>
          </div>
        </header>

        {selectedPage && (
          <>
            <div className="floatingToolDock" role="toolbar" aria-label="Notebook tools">
              <div className="toolDockRow">
                {(["fountain", "ballpoint", "pencil", "highlighter", "eraser", "lasso", "text", "shapes", "image", "tape", "ruler", "laser", "audio", "elements", "hand"] as Tool[]).map((name) => (
                  <button key={name} className={`dockTool ${tool === name ? "active" : ""}`} onClick={() => selectTool(name)} title={toolLabel(name)}>
                    <span>{toolIcon(name)}</span><small>{toolLabel(name)}</small>
                  </button>
                ))}
              </div>
              <div className="toolOptionsRow">
                <label className="roundColor" title="Ink color"><input type="color" value={inkColor} onChange={(event) => setInkColor(event.target.value)} /><span style={{ background: inkColor }} /></label>
                {["#1f2937", "#1677c8", "#ef4444", "#f59e0b", "#22c55e", "#8b5cf6"].map((color) => (
                  <button key={color} className={`colorDot ${inkColor === color ? "active" : ""}`} style={{ background: color }} onClick={() => setInkColor(color)} aria-label={`Use ${color}`} />
                ))}
                <div className="dockDivider" />
                {[2.4, 3.4, 5.2].map((width) => <button key={width} className={`widthDot ${Math.abs(inkWidth - width) < .2 ? "active" : ""}`} onClick={() => setInkWidth(width)}><i style={{ width: Math.max(5, width * 2), height: Math.max(5, width * 2) }} /></button>)}
                <div className="dockDivider" />
                <button className="dockAction" onClick={undoInk} disabled={!selectedPage.strokes.length}>↶</button>
                <button className="dockAction" onClick={redoInk} disabled={!redoStrokes.length}>↷</button>
                <button className="dockAction textAction" onClick={() => void recognizeInk()} disabled={!selectedPage.strokes.length || recognitionLoading}>{recognitionLoading ? "Reading…" : "Ink → Text"}</button>
                <select value={selectedPage.paper} onChange={(event) => patchPage({ paper: event.target.value as PaperStyle })}>
                  <option value="blank">Blank</option><option value="lined">Ruled</option><option value="grid">Grid</option><option value="dots">Dots</option>
                </select>
              </div>
            </div>

            {toolMessage && <div className="toolToast" onClick={() => setToolMessage("")}>{toolMessage} ×</div>}

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
