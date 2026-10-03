"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import InkCanvas from "../components/InkCanvas";
import type {
  AiScope,
  IntegrateWorkspace,
  Notebook,
  NoteAttachment,
  Page,
  PaperStyle,
  Revision
} from "../lib/types";

type Tool = "text" | "pen" | "highlighter" | "eraser";

const STORAGE_KEY = "integrate.workspace.v3";
const LEGACY_V2_KEY = "integrate.workspace.v2";
const LEGACY_V1_KEY = "integrate.notes.v1";

function normalizePage(page: Partial<Page> & { id?: string }): Page {
  return {
    id: page.id || crypto.randomUUID(),
    title: page.title || "Untitled Page",
    subject: page.subject || "General",
    body: page.body || "",
    paper: page.paper || "lined",
    strokes: page.strokes || [],
    tags: page.tags || [],
    favorite: page.favorite || false,
    attachments: page.attachments || [],
    revisions: page.revisions || [],
    updatedAt: page.updatedAt || Date.now()
  };
}

const starterWorkspace: IntegrateWorkspace = {
  version: 3,
  notebooks: [
    {
      id: "general",
      title: "My Notes",
      emoji: "📘",
      pages: [
        normalizePage({
          id: "welcome",
          title: "Welcome to Integrate",
          subject: "General",
          body:
            "Integrate is a notebook for every subject. Type normally, draw with pen or highlighter, add tags and attachments, and use Integrate AI to study directly from your notes."
        }),
        normalizePage({
          id: "history",
          title: "History example",
          subject: "History",
          body:
            "History notes can be turned into timelines, cause-and-effect explanations, essay prompts, flashcards, quizzes, and study guides grounded in what you actually wrote.",
          tags: ["history", "study"]
        })
      ]
    },
    {
      id: "stem",
      title: "STEM",
      emoji: "🧠",
      pages: [
        normalizePage({
          id: "calculus",
          title: "Calculus example",
          subject: "Calculus",
          body:
            "The STEM layer will build on normal notes with handwriting-to-math recognition, symbolic checking, graphing, explanations, and practice generation.",
          paper: "grid",
          tags: ["math"]
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
      if (parsed.version === 3) return parsed;
    } catch {}
  }

  const oldV2 = window.localStorage.getItem(LEGACY_V2_KEY);
  if (oldV2) {
    try {
      const parsed = JSON.parse(oldV2) as {
        notebooks: Array<{
          id: string;
          title: string;
          emoji: string;
          pages: Array<Partial<Page> & { id?: string }>;
        }>;
      };

      return {
        version: 3,
        notebooks: parsed.notebooks.map((notebook) => ({
          ...notebook,
          pages: notebook.pages.map(normalizePage)
        }))
      };
    } catch {}
  }

  const oldV1 = window.localStorage.getItem(LEGACY_V1_KEY);
  if (oldV1) {
    try {
      const notes = JSON.parse(oldV1) as Array<{
        id: string;
        title: string;
        subject: string;
        content: string;
        updatedAt: number;
      }>;

      return {
        version: 3,
        notebooks: [
          {
            id: crypto.randomUUID(),
            title: "Imported Notes",
            emoji: "📥",
            pages: notes.map((note) =>
              normalizePage({
                id: note.id,
                title: note.title,
                subject: note.subject,
                body: note.content,
                updatedAt: note.updatedAt
              })
            )
          }
        ]
      };
    } catch {}
  }

  return JSON.parse(JSON.stringify(starterWorkspace)) as IntegrateWorkspace;
}

function makePage(): Page {
  return normalizePage({ title: "Untitled Page" });
}

function bytesLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Home() {
  const [workspace, setWorkspace] = useState<IntegrateWorkspace>(starterWorkspace);
  const [selectedNotebookId, setSelectedNotebookId] = useState("general");
  const [selectedPageId, setSelectedPageId] = useState("welcome");
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState<Tool>("text");
  const [inkColor, setInkColor] = useState("#1f2937");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [tagDraft, setTagDraft] = useState("");

  const [aiOpen, setAiOpen] = useState(true);
  const [aiScope, setAiScope] = useState<AiScope>("page");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState("");

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
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
    if (!hydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
      setSaveState("saved");
    }, 250);
    return () => window.clearTimeout(timer);
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
        .filter((page) => {
          const searchable = [
            page.title,
            page.subject,
            page.body,
            page.tags.join(" "),
            notebook.title
          ]
            .join(" ")
            .toLowerCase();
          return searchable.includes(q);
        })
        .map((page) => ({ notebookId: notebook.id, notebookTitle: notebook.title, page }))
    );
  }, [query, workspace]);

  const favoriteResults = useMemo(
    () =>
      workspace.notebooks.flatMap((notebook) =>
        notebook.pages
          .filter((page) => page.favorite)
          .map((page) => ({ notebookId: notebook.id, notebookTitle: notebook.title, page }))
      ),
    [workspace]
  );

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
    setWorkspace((current) => ({ ...current, notebooks: [...current.notebooks, notebook] }));
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
    let remaining = selectedNotebook.pages.filter((page) => page.id !== selectedPage.id);
    if (remaining.length === 0) remaining = [makePage()];

    setWorkspace((current) => ({
      ...current,
      notebooks: current.notebooks.map((notebook) =>
        notebook.id === selectedNotebook.id ? { ...notebook, pages: remaining } : notebook
      )
    }));
    setSelectedPageId(remaining[0].id);
  }

  function addTag() {
    if (!selectedPage) return;
    const clean = tagDraft.trim().replace(/^#/, "");
    if (!clean || selectedPage.tags.some((tag) => tag.toLowerCase() === clean.toLowerCase())) {
      setTagDraft("");
      return;
    }
    patchPage({ tags: [...selectedPage.tags, clean] });
    setTagDraft("");
  }

  function saveRevision() {
    if (!selectedPage) return;
    const revision: Revision = {
      id: crypto.randomUUID(),
      title: selectedPage.title,
      subject: selectedPage.subject,
      body: selectedPage.body,
      createdAt: Date.now()
    };
    patchPage({ revisions: [revision, ...selectedPage.revisions].slice(0, 10) });
  }

  function restoreRevision(revision: Revision) {
    patchPage({
      title: revision.title,
      subject: revision.subject,
      body: revision.body
    });
  }

  async function addAttachments(files: FileList | null) {
    if (!files || !selectedPage) return;
    const next: NoteAttachment[] = [];

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) continue;

      let dataUrl: string | undefined;
      if (isImage && file.size <= 1_500_000) {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }

      next.push({
        id: crypto.randomUUID(),
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
        page.tags.length ? `TAGS: ${page.tags.join(", ")}` : "",
        page.body,
        page.strokes.length
          ? `[This page also contains ${page.strokes.length} handwritten/drawn ink strokes that are not yet OCR-transcribed.]`
          : "",
        page.attachments.length
          ? `ATTACHMENTS: ${page.attachments.map((attachment) => attachment.name).join(", ")}`
          : ""
      ]
        .filter(Boolean)
        .join("\n");

    if (!selectedPage || !selectedNotebook) return "";
    if (scope === "page") return renderPage(selectedPage);
    if (scope === "notebook") {
      return [
        `NOTEBOOK: ${selectedNotebook.title}`,
        ...selectedNotebook.pages.map(renderPage)
      ].join("\n\n");
    }

    return workspace.notebooks
      .map((notebook) =>
        [`NOTEBOOK: ${notebook.title}`, ...notebook.pages.map(renderPage)].join("\n\n")
      )
      .join("\n\n=====\n\n");
  }

  async function askAi(promptOverride?: string, action = "") {
    const prompt = (promptOverride ?? aiPrompt).trim();
    if (!prompt) return;

    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    setAiAction(action);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          action,
          scope: aiScope,
          context: buildAiContext(aiScope)
        })
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

  function runQuickAction(action: string) {
    const prompts: Record<string, string> = {
      Summarize: "Summarize these notes into the most important ideas I should remember.",
      "Quiz me": "Create a quiz from these notes. Mix multiple choice and short answer. Do not give the answers until the end.",
      Explain: "Teach me the ideas in these notes clearly, assuming I am learning them for a test.",
      "Find gaps": "Find important gaps, unclear points, or missing connections in these notes. Separate what is definitely missing from what might be worth adding.",
      "Study guide": "Create a structured study guide from these notes with key concepts, definitions, relationships, and likely testable details.",
      Flashcards: "Create concise flashcards from these notes in Question — Answer format."
    };
    setAiPrompt(prompts[action]);
    void askAi(prompts[action], action);
  }

  function formatSelection(prefix: string, suffix = prefix, fallback = "text") {
    if (!selectedPage || !editorRef.current) return;
    const editor = editorRef.current;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const picked = selectedPage.body.slice(start, end) || fallback;
    patchPage({
      body:
        selectedPage.body.slice(0, start) +
        prefix +
        picked +
        suffix +
        selectedPage.body.slice(end)
    });
  }

  function insertLinePrefix(prefix: string) {
    if (!selectedPage || !editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const lineStart = selectedPage.body.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    patchPage({
      body: selectedPage.body.slice(0, lineStart) + prefix + selectedPage.body.slice(lineStart)
    });
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
          placeholder="Search notes, subjects, tags"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {favoriteResults.length > 0 && !query && (
          <>
            <div className="sectionLabel">Favorites</div>
            <div className="pageList">
              {favoriteResults.map((result) => (
                <button
                  key={result.page.id}
                  className="pageCard"
                  onClick={() => selectPage(result.notebookId, result.page.id)}
                >
                  <span className="pageTitle">★ {result.page.title}</span>
                  <span className="pageMeta">{result.notebookTitle}</span>
                </button>
              ))}
            </div>
          </>
        )}

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
                  <span className="pageTitle">{result.page.title}</span>
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
                      <span className="pageTitle">{page.favorite ? "★ " : ""}{page.title}</span>
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
        {selectedPage && (
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
                {tool === "text" && (
                  <>
                    <button className="tool compact" onClick={() => formatSelection("**", "**", "bold text")}><strong>B</strong></button>
                    <button className="tool compact" onClick={() => insertLinePrefix("## ")}>H</button>
                    <button className="tool compact" onClick={() => insertLinePrefix("- [ ] ")}>☑</button>
                  </>
                )}
                {tool !== "text" && tool !== "eraser" && (
                  <label className="colorControl">
                    <input type="color" value={inkColor} onChange={(event) => setInkColor(event.target.value)} />
                  </label>
                )}
                <button className="tool" onClick={() => patchPage({ strokes: selectedPage.strokes.slice(0, -1) })} disabled={!selectedPage.strokes.length}>Undo ink</button>
              </div>

              <div className="toolGroup">
                <span className={`saveState ${saveState}`}>{saveState === "saved" ? "Saved" : "Saving…"}</span>
                <button className={`tool favoriteButton ${selectedPage.favorite ? "favorite" : ""}`} onClick={() => patchPage({ favorite: !selectedPage.favorite })}>★</button>
                <button className="tool" onClick={() => fileInputRef.current?.click()}>Attach</button>
                <input ref={fileInputRef} className="hiddenInput" type="file" multiple accept="image/*,application/pdf" onChange={(event) => void addAttachments(event.target.files)} />
                <select className="paperSelect" value={selectedPage.paper} onChange={(event) => patchPage({ paper: event.target.value as PaperStyle })}>
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
                  <input className="titleInput" value={selectedPage.title} onChange={(event) => patchPage({ title: event.target.value })} />
                  <input className="subjectInput" value={selectedPage.subject} onChange={(event) => patchPage({ subject: event.target.value })} />

                  <div className="tagRow">
                    {selectedPage.tags.map((tag) => (
                      <button key={tag} className="tagPill" onClick={() => patchPage({ tags: selectedPage.tags.filter((value) => value !== tag) })}>#{tag} ×</button>
                    ))}
                    <input
                      className="tagInput"
                      placeholder="+ tag"
                      value={tagDraft}
                      onChange={(event) => setTagDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      onBlur={addTag}
                    />
                  </div>

                  {selectedPage.attachments.length > 0 && (
                    <div className="attachmentGrid">
                      {selectedPage.attachments.map((attachment) => (
                        <div className="attachmentCard" key={attachment.id}>
                          {attachment.type === "image" && attachment.dataUrl ? (
                            <img src={attachment.dataUrl} alt={attachment.name} />
                          ) : (
                            <div className="fileIcon">{attachment.type === "pdf" ? "PDF" : "IMG"}</div>
                          )}
                          <div className="attachmentInfo">
                            <strong>{attachment.name}</strong>
                            <span>{bytesLabel(attachment.size)}</span>
                          </div>
                          <button onClick={() => patchPage({ attachments: selectedPage.attachments.filter((item) => item.id !== attachment.id) })}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="versionRow">
                    <button className="linkButton" onClick={saveRevision}>Save version</button>
                    {selectedPage.revisions.slice(0, 3).map((revision) => (
                      <button key={revision.id} className="revisionChip" onClick={() => restoreRevision(revision)}>
                        {new Date(revision.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pageBody">
                  <textarea
                    ref={editorRef}
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
        )}
      </section>

      {aiOpen && selectedPage && (
        <aside className="aiPanel">
          <div className="aiHeader">
            <div>
              <div className="aiTitle">Integrate AI</div>
              <div className="muted small">Grounded in your notes</div>
            </div>
            <button className="iconButton" onClick={() => setAiOpen(false)}>×</button>
          </div>

          <div className="contextPills">
            {(["page", "notebook", "all"] as AiScope[]).map((scope) => (
              <button
                key={scope}
                className={`contextPill ${aiScope === scope ? "active" : ""}`}
                onClick={() => setAiScope(scope)}
              >
                {scope === "page" ? "Page" : scope === "notebook" ? "Notebook" : "All notes"}
              </button>
            ))}
          </div>

          <div className="aiSuggestionGrid">
            {["Summarize", "Quiz me", "Explain", "Find gaps", "Study guide", "Flashcards"].map((label) => (
              <button key={label} onClick={() => runQuickAction(label)} disabled={aiLoading}>{label}</button>
            ))}
          </div>

          <div className="aiResult">
            {aiLoading && <div className="aiStatus">Integrate AI is thinking…</div>}
            {aiError && <div className="aiError">{aiError}</div>}
            {aiResponse && (
              <>
                {aiAction && <div className="aiResultLabel">{aiAction}</div>}
                <div className="aiResponseText">{aiResponse}</div>
              </>
            )}
            {!aiLoading && !aiError && !aiResponse && (
              <div className="aiMessage">
                Ask about this page, the whole notebook, or all of your notes. AI answers are sent with that selected context.
              </div>
            )}
          </div>

          <div className="aiComposer">
            <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Ask about your notes..." />
            <button className="primary" onClick={() => void askAi()} disabled={!aiPrompt.trim() || aiLoading}>
              {aiLoading ? "Working…" : "Send"}
            </button>
          </div>
        </aside>
      )}
    </main>
  );
}
