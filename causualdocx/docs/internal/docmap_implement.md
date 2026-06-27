# DocMap / DocPatch Kernel Implementation Plan

> Separate backend kernel, not part of the Code-OSS extension or the DOCX editor UI.

**Goal:** build a fast Rust-backed DOCX indexing kernel that can inspect OOXML packages, build a stable DocMap + Merkle tree, store SQLite indexes, and expose search/locate/diff primitives for Hermes via a thin MCP wrapper.

**Architecture:** keep the kernel outside the editor stack. The Rust binary owns DOCX unzip/XML traversal, hashing, and SQLite sidecars. A TypeScript MCP server will call the binary later. The editor and Code-OSS extension stay unchanged during the kernel work.

**Tech Stack:** Rust (`clap`, `serde`, `serde_json`, `zip`, `quick-xml` or `roxmltree`, `blake3`, `rusqlite`, `walkdir`, `anyhow`, `thiserror`, `similar`), plus Node/TypeScript for the MCP wrapper.

---

## 1) Feasibility against the current repo

This is feasible in the current project structure, with one important caveat: the repo already contains a legacy `backend/` directory for the old Go y-websocket gateway, and the root docs explicitly mark that backend as superseded for sync/persistence work. That means the new kernel should not be threaded into the old Go service.

Recommended placement:

```text
causualdocx/
├── backend/
│   ├── docpatch-kernel/   # new Rust workspace / CLI
│   └── ... legacy Go gateway (untouched)
└── mcp/
    └── docpatch-mcp/      # new TypeScript MCP wrapper
```

Why this fits:

- The repo already supports a multi-language layout (`docx-editor/` is Bun/TS, `backend/` already exists, docs live under `docs/internal/`).
- Nothing in the current editor build depends on the legacy Go backend directory, so a sibling Rust workspace will not disturb the extension.
- The desired runtime split is clean: Hermes → MCP server → Rust CLI → DOCX / SQLite.

Risks / constraints:

- The root repo has many in-flight changes and generated artifacts right now. Kernel work should stay isolated to new files until the plan is executed.
- We need a separate dependency story for Rust tooling and CI. The existing editor toolchain is Bun/TypeScript; the kernel must not inherit that assumption.
- `.docx` fidelity is the hard part, not the folder scan. Phase 1 should stay narrow so we can validate package traversal before broadening to full DocMap extraction.

Conclusion: the architecture is viable, and the repository shape is compatible, as long as the new kernel is created as an independent backend module and the legacy Go backend is left untouched.

---

## 2) Implementation strategy

Build in phases, with each phase ending in a working CLI command and a testable artifact.

### Phase 0 — kernel scaffold

Objective: create the Rust workspace / CLI and verify the binary can run.

**Target Path:** `/home/harshit/coding/agent-office/causualdocx/backend/docpatch-kernel/`

**File-level scope:**
- `Cargo.toml` — Workspace + dependencies (`clap`, `serde`, `serde_json`, `zip`, `quick-xml`, `blake3`, `rusqlite`, `walkdir`, `anyhow`, `thiserror`)
- `src/main.rs` — CLI entry point (`clap` setup, command routing)
- `src/types.rs` — Shared internal models (`DocNode`, `PartNode`, `FolderDoc`, `TargetAddress`)

**CLI Command Set:**
- `docpatch --help`
- `docpatch inspect <file.docx> --json` (Phase 1)
- `docpatch map <file.docx> --out <db.sqlite> --json` (Phase 2)
- `docpatch merkle <file.docx> --json` (Phase 3)
- `docpatch folder-index <path> --out <db.sqlite> --json` (Phase 4)
- `docpatch search <path> "<query>" --json` (Phase 4)
- `docpatch locate <file.docx> --quote "<quote>" --json` (Phase 5)
- `docpatch diff-map <old.sqlite> <new.sqlite> --json` (Phase 6)

### Phase 1 — DOCX package inspection

**File-level scope:**
- `src/docx_reader.rs` — OPC ZIP logic (using `zip` crate)
- `src/main.rs` — wiring for `inspect` command

### Phase 2 — DocMap V1

**File-level scope:**
- `src/xml_parser.rs` — OOXML traversal (using `quick-xml`)
- `src/docmap.rs` — structural tree building
- `src/index_store.rs` — SQLite schema definitions (`rusqlite`)
- `src/main.rs` — wiring for `map` command

### Phase 3 — Merkle forest

**File-level scope:**
- `src/merkle.rs` — tree hashing logic (using `blake3`)

### Phase 4 — Folder indexing

**File-level scope:**
- `src/foldermap.rs` — Matter folder recursive scan (`walkdir`)
- `src/search.rs` — FTS5/BM25 search logic

### Phase 5 — Locator API

**File-level scope:**
- `src/locator.rs` — quote/offset lookup logic

### Phase 6 — Diff preview

**File-level scope:**
- `src/diff.rs` — merge-join comparison of node lists

### Phase 7 — MCP wrapper

**Target Path:** `/home/harshit/coding/agent-office/causualdocx/mcp/docpatch-mcp/`

**File-level scope:**
- `package.json` — dependencies (`@modelcontextprotocol/sdk`)
- `src/index.ts` — MCP tool registration for the `docpatch` binary calls

---

## 3) Data model to target

### `DocNode`
```ts
type DocNode = {
  nodeId: string;
  parentId?: string;
  type: "package" | "part" | "body" | "paragraph" | "run" | "table" | "row" | "cell" | "comment";
  partName: string;
  stableId?: string;
  xpath: string;
  orderIndex: number;
  startOffset?: number;
  endOffset?: number;
  text?: string;
  textHash: string;
  xmlHash: string;
  structureHash: string;
  merkleHash: string;
  children: string[];
};
```

### `PartNode`
```ts
type PartNode = {
  partName: string;
  contentType: string;
  relsHash?: string;
  rootNodeId: string;
  partHash: string;
};
```

### `FolderDoc`
```ts
type FolderDoc = {
  docId: string;
  path: string;
  fileName: string;
  fileType: "docx" | "pdf" | "xml" | "txt" | "unknown";
  modifiedAt: number;
  sizeBytes: number;
  packageHash: string;
  textHash: string;
  summary?: string;
};
```

### `TargetAddress`
```ts
type TargetAddress = {
  docId: string;
  filePath: string;
  partName: string;
  nodeId: string;
  stableId?: string;
  xpath: string;
  quote?: string;
  prefix?: string;
  suffix?: string;
  expectedTextHash: string;
  expectedXmlHash?: string;
};
```

---

## 4) Algorithm choices

- Merkle build: post-order DFS, bottom-up hash propagation
- Offset lookup: sort by `(partName, startOffset, endOffset)` and binary search
- Direct lookup: hash maps for `nodeId`, `stableId`, `xpath`
- Diffing: merge-join two sorted node streams
- Pruning: compare parent hashes first, descend only on mismatch
- Search: Bloom filter precheck, then FTS5/BM25 ranking

---

## 5) Phase-by-phase execution order

1. Write the Rust CLI scaffold and one fixture-based inspect test.
2. Implement DOCX package inspection and JSON output.
3. Implement Word document parsing and DocMap SQLite persistence.
4. Add Merkle hashing on top of the DocMap.
5. Add locate and search primitives.
6. Add diff preview.
7. Add MCP wrapper.

---

## 6) Success criteria for Phase 1–2

The first milestone should be real commands that work end-to-end:

```bash
docpatch inspect sample.docx --json
docpatch map sample.docx --out sample.sqlite --json
docpatch locate sample.docx --quote "some text from the document" --json
```

If those commands work reliably on small fixtures, the rest of the kernel becomes a scaling and coverage problem rather than a design problem.

---

## 7) Assumptions

- We are intentionally building a separate backend kernel, not extending the Code-OSS extension.
- The current repo's legacy Go backend remains untouched during this effort.
- Rust is the core implementation language for the kernel; TypeScript is reserved for the MCP wrapper.
- Initial scope is read/index/locate/diff-preview only; actual patch write-back comes later.
- A small, deterministic fixture suite is enough for the first phase.
