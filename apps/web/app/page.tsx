"use client";

import { useEffect, useMemo, useState } from "react";
import InkCanvas from "../components/InkCanvas";
import type { IntegrateWorkspace, Notebook, Page, PaperStyle } from "../lib/types";

type Tool = "text" | "pen" | "highlighter" | "eraser";

const STORAGE_KEY = "integrate.workspace.v2";

const starterWorkspace: IntegrateWorkspace = {
  version: 2,
  notebooks: [
    {
      id: "general",
      title: "My Notes",
      emoji: "📘",
      pages: [
        {
          id: "welcome",
          title: "Welcome to Integrate",
          subject: "General",
          body:
            "Integrate is a notebook for every subject. Type normally, switch to Pen or Highlighter to draw on the page, and organize your work into notebooks and pages.",
          paper: "lined",
          strokes: [],
          updatedAt: 1
        },
        {
          id: "history",
          title: "History example",
          subject: "History",
          body:
            "History mode can eventually turn your notes into timelines, cause-and-effect maps, source comparisons, essay prompts, flashcards, and quizzes grounded in what you actually wrote.",
          paper: "lined",
          strokes: [],
          updatedAt: 2
        }
      ]
    },
    {
      id: "stem",
      title: "STEM",
      emoji: "🧠",
      pages: [
        {
          id: "calculus",
          title: "Calculus example",
          subject: "Calculus",
          body:
            "The STEM layer will add handwriting-to-math recognition, symbolic step checking, graphing, explanations, hints, and similar-practice generation without taking away normal note-taking.",
          paper: "grid",
          strokes: [],
          updatedAt: 3
        }
      ]
    }
  ]
};

function cloneStarter(): IntegrateWorkspace {
  return JSON.parse(JSON.stringify(starterWorkspace)) as IntegrateWorkspace;
}

function migrateLegacy(): IntegrateWorkspace | null {
  const legacyRaw = window.localStorage.getItem("integrate.notes.v1");
  if (!legacyRaw) return null;

  try {
    const legacy = JSON.parse(legacyRaw) as Array<{
      id: string;
      title: string;
      subject: string;
      content: string;
      updatedAt: number;
    }>;

    if (!Array.isArray(legacy) || legacy.length === 0) return null;

    return {
      version: 2,
      notebooks: [
        {
          id: crypto.randomUUID(),
          title: "Imported Notes",
          emoji: "📥",
          pages: legacy.map((note) => ({
            id: note.id || crypto.randomUUID(),
            title: note.title || "Untitled Note",
            subject: note.subject || "General",
            body: note.content || "",
            paper: "lined",
            strokes: [],
            updatedAt: note.updatedAt || Date.now()
          }))
        }
      ]
    };
  } catch {
    return null;
  }
}

function loadWorkspace(): IntegrateWorkspace {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as IntegrateWorkspace;
      if (parsed.version === 2 && Array.isArray(parsed.notebooks)) return parsed;
    } catch {
      // Fall through to migration/starter workspace.
    }
  }

  return migrateLegacy() ?? cloneStarter();
}

function makePage(title = "Untitled Page"): Page {
  return {
    id: crypto.randomUUID(),
    title,
    subject: "General",
    body: "",
    paper: "lined",
    strokes: [],
    updatedAt: Date.now()
  };
}

export default function Home() {
  const [workspace, setWorkspace] = useState<IntegrateWorkspace>(starterWorkspace);
  const [selectedNotebookId, setSelectedNotebookId] = useState("general");
  const [selectedPageId, setSelectedPageId] = useState("welcome");
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState<Tool>("text");
  const [inkColor, setInkColor] = useState("#1f2937");
  const [aiOpen, setAiOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadWorkspace();
    setWorkspace(loaded);
    const firstNotebook = loaded.notebooks[0];
    if (firstNotebook) {
      setSelectedNotebookId(firstNotebook.id);
      if (firstNotebook.pages[0]) setSelectedPageId(firstNotebook.pages[0].id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace, hydrated]);

  const selectedNotebook =
    workspace.notebooks.find((notebook) => notebook.id === selectedNotebookId) ??
    workspace.notebooks[0];

  const selectedPage =
    selectedNotebook?.pages.find((page) => page.id === selectedPageId) ??
    selectedNotebook?.pages[0];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    return workspace.notebooks.flatMap((notebook) =>
      notebook.pages
        .filter(
          (page) =>
            page.title.toLowerCase().includes(q) ||
            page.subject.toLowerCase().includes(q) ||
            page.body.toLowerCase().includes(q)
        )
        .map((page) => ({
          notebookId: notebook.id,
          notebookTitle: notebook.title,
          page
        }))
    );
  }, [query, workspace]);

  function selectNotebook(notebook: Notebook) {
    setSelectedNotebookId(notebook.id);
    setSelectedPageId(notebook.pages[0]?.id ?? "");
  }

  function selectPage(notebookId: string, pageId: string) {
    setSelectedNotebookId(notebookId);
    setSelectedPageId(pageId);
    setQuery("");
  }

  function createNotebook() {
    const page = makePage();
    const notebook: Notebook = {
      id: crypto.randomUUID(),
      title: "New Notebook",
      emoji: "📓",
      pages: [page]
    };

    setWorkspace((current) => ({
      ...current,
      notebooks: [...current.notebooks, notebook]
    }));
    setSelectedNotebookId(notebook.id);
    setSelectedPageId(page.id);
  }

  function createPage() {
    if (!selectedNotebook) return;
    const page = makePage();

    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id === selectedNotebook.id
          ? { ...notebook, pages: [...notebook.pages, page] }
          : notebook
      )
    }));
    setSelectedPageId(page.id);
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
              pages: notebook.pages.map((page) =>
                page.id === selectedPage.id
                  ? { ...page, ...patch, updatedAt: Date.now() }
                  : page
              )
            }
      )
    }));
  }

  function renameNotebook(title: string) {
    if (!selectedNotebook) return;
    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id === selectedNotebook.id ? { ...notebook, title } : notebook
      )
    }));
  }

  function deletePage() {
    if (!selectedNotebook || !selectedPage) return;
    const remaining = selectedNotebook.pages.filter((page) => page.id !== selectedPage.id);

    if (remaining.length === 0) {
      const replacement = makePage();
      setWorkspace((current) => ({
        ...current,
        notebooks: current.notebooks.map((notebook) =>
          notebook.id === selectedNotebook.id ? { ...notebook, pages: [replacement] } : notebook
        )
      }));
      setSelectedPageId(replacement.id);
      return;
    }

    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id === selectedNotebook.id ? { ...notebook, pages: remaining } : notebook
      )
    }));
    setSelectedPageId(remaining[0].id);
  }

  function undoLastStroke() {
    if (!selectedPage || selectedPage.strokes.length === 0) return;
    patchPage({ strokes: selectedPage.strokes.slice(0, -1) });
  }

  function clearInk() {
    if (!selectedPage || selectedPage.strokes.length === 0) return;
    patchPage({ strokes: [] });
  }

  return (
    <main className={`shell ${aiOpen ? "" : "aiClosed"}`}>
      <aside className="sidebar">
        <div className="brandRow">
          <div className="brandMark">∫</div>
          <div>
            <div className="brand">Integrate</div>
            <div className="muted small">AI-native notebook</div>
          </div>
        </div>

        <div className="sidebarActions">
          <button className="primary" onClick={createPage}>+ New page</button>
          <button className="secondaryIcon" onClick={createNotebook} title="New notebook">＋</button>
        </div>

        <input
          className="search"
          placeholder="Search all notes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {searchResults ? (
          <>
            <div className="sectionLabel">Search results</div>
            <div className="pageList">
              {searchResults.length === 0 && <div className="emptySearch">No matching notes</div>}
              {searchResults.map((result) => (
                <button
                  key={result.page.id}
                  className="pageCard"
                  onClick={() => selectPage(result.notebookId, result.page.id)}
                >
                  <span className="pageTitle">{result.page.title || "Untitled Page"}</span>
                  <span className="pageMeta">{result.notebookTitle} · {result.page.subject}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="sectionLabel">Notebooks</div>
            <div className="notebookList">
              {workspace.notebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  className={`notebookRow ${notebook.id === selectedNotebook?.id ? "active" : ""}`}
                  onClick={() => selectNotebook(notebook)}
                >
                  <span>{notebook.emoji}</span>
                  <span className="notebookName">{notebook.title}</span>
                  <span className="count">{notebook.pages.length}</span>
                </button>
              ))}
            </div>

            {selectedNotebook && (
              <>
                <div className="notebookHeader">
                  <input
                    value={selectedNotebook.title}
                    onChange={(event) => renameNotebook(event.target.value)}
                    aria-label="Notebook title"
                  />
                  <button onClick={createPage}>＋</button>
                </div>
                <div className="pageList">
                  {selectedNotebook.pages.map((page) => (
                    <button
                      key={page.id}
                      className={`pageCard ${page.id === selectedPage?.id ? "active" : ""}`}
                      onClick={() => setSelectedPageId(page.id)}
                    >
                      <span className="pageTitle">{page.title || "Untitled Page"}</span>
                      <span className="pageMeta">{page.subject}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </aside>

      <section className="workspace">
        {selectedPage ? (
          <>
            <header className="topbar">
              <div className="toolGroup">
                {(["text", "pen", "highlighter", "eraser"] as Tool[]).map((name) => (
                  <button
                    key={name}
                    className={`tool ${tool === name ? "active" : ""}`}
                    onClick={() => setTool(name)}
                  >
                    {name === "text" ? "Text" : name === "pen" ? "Pen" : name === "highlighter" ? "Highlight" : "Eraser"}
                  </button>
                ))}

                {tool !== "text" && tool !== "eraser" && (
                  <label className="colorControl" title="Ink color">
                    <input
                      type="color"
                      value={inkColor}
                      onChange={(event) => setInkColor(event.target.value)}
                    />
                  </label>
                )}

                <button className="tool" onClick={undoLastStroke} disabled={selectedPage.strokes.length === 0}>
                  Undo ink
                </button>
                <button className="tool" onClick={clearInk} disabled={selectedPage.strokes.length === 0}>
                  Clear ink
                </button>
              </div>

              <div className="toolGroup">
                <select
                  className="paperSelect"
                  value={selectedPage.paper}
                  onChange={(event) => patchPage({ paper: event.target.value as PaperStyle })}
                  aria-label="Paper style"
                >
                  <option value="blank">Blank</option>
                  <option value="lined">Lined</option>
                  <option value="grid">Grid</option>
                  <option value="dots">Dots</option>
                </select>
                <button className="tool aiButton" onClick={() => setAiOpen((value) => !value)}>✦ AI</button>
                <button className="tool danger" onClick={deletePage}>Delete</button>
              </div>
            </header>

            <div className="documentWrap">
              <article className={`document paper-${selectedPage.paper}`}>
                <div className="documentMeta">
                  <input
                    className="titleInput"
                    value={selectedPage.title}
                    onChange={(event) => patchPage({ title: event.target.value })}
                    aria-label="Page title"
                  />
                  <input
                    className="subjectInput"
                    value={selectedPage.subject}
                    onChange={(event) => patchPage({ subject: event.target.value })}
                    aria-label="Subject"
                  />
                </div>

                <div className="pageBody">
                  <textarea
                    className={`editor ${tool !== "text" ? "drawingMode" : ""}`}
                    placeholder="Start taking notes..."
                    value={selectedPage.body}
                    onChange={(event) => patchPage({ body: event.target.value })}
                    readOnly={tool !== "text"}
                  />

                  <InkCanvas
                    strokes={selectedPage.strokes}
                    onChange={(strokes) => patchPage({ strokes })}
                    tool={tool === "text" ? "pen" : tool}
                    color={inkColor}
                    paper={selectedPage.paper}
                    enabled={tool !== "text"}
                  />
                </div>
              </article>
            </div>
          </>
        ) : (
          <div className="empty">
            <div className="brandMark large">∫</div>
            <h1>Create a page to begin</h1>
            <button className="primary" onClick={createNotebook}>New notebook</button>
          </div>
        )}
      </section>

      {aiOpen && selectedPage && (
        <aside className="aiPanel">
          <div className="aiHeader">
            <div>
              <div className="aiTitle">Integrate AI</div>
              <div className="muted small">Context: {selectedPage.title || "this page"}</div>
            </div>
            <button className="iconButton" onClick={() => setAiOpen(false)}>×</button>
          </div>

          <div className="contextPills">
            <button className="contextPill active">Page</button>
            <button className="contextPill">Notebook</button>
            <button className="contextPill">All notes</button>
          </div>

          <div className="aiSuggestionGrid">
            {["Summarize", "Quiz me", "Explain", "Find gaps", "Study guide", "Flashcards"].map((label) => (
              <button key={label} onClick={() => setAiPrompt(label)}>{label}</button>
            ))}
          </div>

          <div className="aiMessage">
            <strong>Page context is ready.</strong>
            <p>
              Integrate now has a notebook/page model plus text and ink data. The next AI service can use
              both as grounded context instead of behaving like a disconnected chatbot.
            </p>
          </div>

          <div className="aiComposer">
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Ask about this page..."
            />
            <button className="primary" disabled={!aiPrompt.trim()}>Send</button>
          </div>
        </aside>
      )}
    </main>
  );
}
