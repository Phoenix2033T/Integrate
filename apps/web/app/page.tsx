"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  id: string;
  title: string;
  subject: string;
  content: string;
  updatedAt: number;
};

const starterNotes: Note[] = [
  {
    id: "welcome",
    title: "Welcome to Integrate",
    subject: "General",
    content:
      "Integrate is your notebook for every subject. Type notes here now; handwriting, PDFs, canvas tools, and context-aware AI are coming into the same workspace.",
    updatedAt: Date.now()
  },
  {
    id: "history",
    title: "History example",
    subject: "History",
    content:
      "Use Integrate for timelines, cause-and-effect notes, primary-source annotations, essay planning, and AI study questions grounded in your own notes.",
    updatedAt: Date.now() - 1000
  },
  {
    id: "calculus",
    title: "Calculus example",
    subject: "Calculus",
    content:
      "Math notes will support handwriting recognition, symbolic step checking, graphs, explanations, hints, and similar-practice generation.",
    updatedAt: Date.now() - 2000
  }
];

function loadNotes(): Note[] {
  if (typeof window === "undefined") return starterNotes;
  const raw = window.localStorage.getItem("integrate.notes.v1");
  if (!raw) return starterNotes;
  try {
    return JSON.parse(raw) as Note[];
  } catch {
    return starterNotes;
  }
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>(starterNotes);
  const [selectedId, setSelectedId] = useState("welcome");
  const [query, setQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    if (loaded[0]) setSelectedId(loaded[0].id);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("integrate.notes.v1", JSON.stringify(notes));
  }, [notes]);

  const selected = notes.find((n) => n.id === selectedId) ?? notes[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.subject.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
    );
  }, [notes, query]);

  function createNote() {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Untitled Note",
      subject: "General",
      content: "",
      updatedAt: Date.now()
    };
    setNotes((current) => [note, ...current]);
    setSelectedId(note.id);
  }

  function patchSelected(patch: Partial<Note>) {
    if (!selected) return;
    setNotes((current) =>
      current.map((note) =>
        note.id === selected.id ? { ...note, ...patch, updatedAt: Date.now() } : note
      )
    );
  }

  function removeSelected() {
    if (!selected) return;
    const remaining = notes.filter((note) => note.id !== selected.id);
    setNotes(remaining);
    setSelectedId(remaining[0]?.id ?? "");
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brandRow">
          <div className="brandMark">∫</div>
          <div>
            <div className="brand">Integrate</div>
            <div className="muted small">AI-native notebook</div>
          </div>
        </div>

        <button className="primary" onClick={createNote}>+ New note</button>
        <input
          className="search"
          placeholder="Search notes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="sectionLabel">Notes</div>
        <div className="noteList">
          {filtered.map((note) => (
            <button
              key={note.id}
              className={"noteCard " + (note.id === selectedId ? "active" : "")}
              onClick={() => setSelectedId(note.id)}
            >
              <span className="noteTitle">{note.title || "Untitled Note"}</span>
              <span className="noteMeta">{note.subject}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        {selected ? (
          <>
            <header className="topbar">
              <div className="toolGroup">
                <button className="tool active">Text</button>
                <button className="tool" title="Canvas drawing is next">Pen</button>
                <button className="tool" title="Canvas drawing is next">Highlighter</button>
                <button className="tool" title="PDF import is next">PDF</button>
              </div>
              <div className="toolGroup">
                <button className="tool" onClick={() => setAiOpen((v) => !v)}>✦ AI</button>
                <button className="tool danger" onClick={removeSelected}>Delete</button>
              </div>
            </header>

            <div className="document">
              <input
                className="titleInput"
                value={selected.title}
                onChange={(e) => patchSelected({ title: e.target.value })}
                aria-label="Note title"
              />
              <input
                className="subjectInput"
                value={selected.subject}
                onChange={(e) => patchSelected({ subject: e.target.value })}
                aria-label="Subject"
              />
              <textarea
                className="editor"
                placeholder="Start taking notes..."
                value={selected.content}
                onChange={(e) => patchSelected({ content: e.target.value })}
              />
            </div>
          </>
        ) : (
          <div className="empty">
            <div className="brandMark large">∫</div>
            <h1>Create your first note</h1>
            <button className="primary" onClick={createNote}>New note</button>
          </div>
        )}
      </section>

      {aiOpen && selected && (
        <aside className="aiPanel">
          <div className="aiHeader">
            <div>
              <div className="aiTitle">Integrate AI</div>
              <div className="muted small">Context: this note</div>
            </div>
            <button className="iconButton" onClick={() => setAiOpen(false)}>×</button>
          </div>

          <div className="aiSuggestionGrid">
            {["Summarize", "Quiz me", "Explain", "Find gaps"].map((label) => (
              <button key={label} onClick={() => setAiPrompt(label)}>{label}</button>
            ))}
          </div>

          <div className="aiMessage">
            <strong>AI workspace ready.</strong>
            <p>
              This panel is wired as the product surface. The upcoming AI service will ground answers
              in the current selection, page, notebook, or all of your notes.
            </p>
          </div>

          <div className="aiComposer">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask about your notes..."
            />
            <button className="primary" disabled={!aiPrompt.trim()}>Send</button>
          </div>
        </aside>
      )}
    </main>
  );
}
