/**
 * Footnote Reference Mark Extension
 *
 * Provides footnoteRef mark + insert/delete commands for footnotes and endnotes.
 */
import { createMarkExtension } from '../create';
export const FootnoteRefExtension = createMarkExtension({
    name: 'footnoteRef',
    schemaMarkName: 'footnoteRef',
    markSpec: {
        attrs: {
            id: {},
            noteType: { default: 'footnote' },
        },
        parseDOM: [
            {
                tag: 'sup.docx-footnote-ref',
                getAttrs: (dom) => {
                    const element = dom;
                    return {
                        id: element.dataset.id || '',
                        noteType: element.dataset.noteType || 'footnote',
                    };
                },
            },
        ],
        toDOM(mark) {
            const attrs = mark.attrs;
            return [
                'sup',
                {
                    class: `docx-${attrs.noteType}-ref`,
                    'data-id': attrs.id,
                    'data-note-type': attrs.noteType,
                },
                0,
            ];
        },
    },
    onSchemaReady(ctx) {
        const { schema } = ctx;
        function makeInsertNote(noteType) {
            return (id) => {
                return (state, dispatch) => {
                    if (!dispatch)
                        return true;
                    const mark = schema.marks.footnoteRef.create({
                        id: String(id),
                        noteType,
                    });
                    const text = schema.text(String(id), [mark]);
                    const tr = state.tr.replaceSelectionWith(text, false);
                    dispatch(tr.scrollIntoView());
                    return true;
                };
            };
        }
        const deleteNoteRef = (state, dispatch) => {
            const { $from, $to } = state.selection;
            if (!dispatch)
                return true;
            let tr = state.tr;
            const markType = schema.marks.footnoteRef;
            // Remove footnoteRef marks in selection range
            tr = tr.removeMark($from.pos, $to.pos, markType);
            dispatch(tr.scrollIntoView());
            return true;
        };
        return {
            commands: {
                insertFootnote: makeInsertNote('footnote'),
                insertEndnote: makeInsertNote('endnote'),
                deleteNoteRef: () => deleteNoteRef,
            },
        };
    },
});
//# sourceMappingURL=FootnoteRefExtension.js.map