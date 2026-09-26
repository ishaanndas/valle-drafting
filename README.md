# Valle Legal Drafting Desk

A working UI prototype of an AI legal drafting platform, built in Valle Legal's brand.
Conversational drafting against a permission-trimmed knowledge base, with SharePoint and
Clio as the systems of record and a Word-grade document editor on the right.

**Live:** https://ishaanndas.github.io/valle-drafting/

> Prototype. The matter, client, and document content are fictional. Integrations are
> represented in the interface but not wired to live SharePoint or Clio tenants.

## What it does

**Drafting desk** — a chat thread beside a live document. Responses stream in with a
retrieval trace that collapses into an expandable source list. Drafted provisions land in
the document marked as pending review, with Accept / Revise on the insertion.

**Three document modes**
- **Edit** — contenteditable page with a Word-style toolbar: undo/redo, paragraph styles,
  bold/italic/underline with live state, lists, alignment, insert-from-clause-bank.
- **Preview** — real pagination into US Letter sheets with page numbers. What the export
  looks like, page for page.
- **Sources** — the document side by side with a provenance panel. Every provision traced
  to the passage it was built from, quoted verbatim with its system and locator. Clicking a
  clause in either pane highlights it in the other. Provisions with no source say so.

**Export** — `.docx` generated in the browser (hand-built OOXML in a stored zip, no
dependencies) that opens in Word fully editable. Copy puts the document on the clipboard
as rich HTML plus plain text.

**Other sections** — a documents repository, the knowledge base index with source filters,
Clio-synced matters, the firm clause bank, and connection settings for SharePoint and Clio.

**Interface** — collapsible sidebar, draggable chat/document split, zoom-to-fit, full
screen (`F`), light and dark themes. Layout choices persist across reloads.

## Design

Brand tokens are taken from `speakers.vallelegal.com`: navy `oklch(28% .055 258)`, a gold
accent, warm paper ground, and Libre Baskerville, which carries headings and the document
itself. IBM Plex Sans handles UI chrome and IBM Plex Mono carries matter numbers, clause
codes, and citation locators.

## Running it

It is one self-contained HTML file. Open `index.html` directly, or:

```bash
node server.js     # http://localhost:4900
```

## Building

Sources live in `src/` and are concatenated into `index.html`. Edit the sources, not the
built file.

```bash
python3 build.py
```

| Path | Contents |
| --- | --- |
| `src/01-tokens.css` | Colour, type, and theme tokens |
| `src/02-shell.css` | Sidebar, top bar, chat thread, composer |
| `src/03-document.css` | Document pane, page, editor, provenance panel |
| `src/10-workspace.html` | Sidebar and the drafting workspace |
| `src/11-views.html` | Documents, knowledge base, matters, clauses, connections |
| `src/20-core.js` | Navigation, theme, sidebar, pane resize, citations |
| `src/21-docx.js` | OOXML and zip writer for `.docx` export |
| `src/22-editor.js` | Editing commands, word count, copy, download |
| `src/23-views.js` | Modes, zoom, pagination, provenance |
| `src/24-chat.js` | Streaming responses and the composer |

The logo is inlined as a data URI at build time, so the built file makes no external
requests apart from Google Fonts.
