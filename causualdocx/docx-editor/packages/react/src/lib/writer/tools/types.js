/**
 * Tool types — MCP-flavoured but local to the editor.
 *
 * A `Tool` is the contract a specialist agent satisfies: given
 * structured args + an editor context, it produces a structured
 * result the ChatPanel knows how to render (insert table, insert
 * tracked-change, render bubble, surface error).
 *
 * Result is a discriminated union so the panel's render path is
 * exhaustive — no string-matching on free-form replies.
 */
export {};
//# sourceMappingURL=types.js.map