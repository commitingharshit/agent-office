/**
 * Extension System Type Definitions
 *
 * Tiptap-style extension architecture for ProseMirror.
 * Three extension types:
 * - Extension: plugins, commands, keymaps (no schema)
 * - NodeExtension: adds a node spec to the schema
 * - MarkExtension: adds a mark spec to the schema
 */
export const Priority = {
    Highest: 0,
    High: 50,
    Default: 100,
    Low: 150,
    Lowest: 200,
};
//# sourceMappingURL=types.js.map