/** Rebuild the Comment[] from the shared map, ordered by id (creation order). */
export function commentsFromMap(map) {
    const out = [];
    map.forEach((value) => {
        if (value && typeof value === 'object')
            out.push(value);
    });
    out.sort((a, b) => a.id - b.id);
    return out;
}
/**
 * Reconcile the full Comment[] into the shared map in one transaction: upsert
 * every current comment by id, delete entries that no longer exist. Skips the
 * write entirely when nothing changed so we don't echo our own observer.
 */
export function writeCommentsToMap(map, comments) {
    const doc = map.doc;
    const apply = () => {
        const nextIds = new Set(comments.map((c) => String(c.id)));
        // Delete removed.
        for (const key of Array.from(map.keys())) {
            if (!nextIds.has(key))
                map.delete(key);
        }
        // Upsert changed (cheap deep-equal via JSON to avoid redundant churn).
        for (const c of comments) {
            const key = String(c.id);
            const existing = map.get(key);
            if (!existing || JSON.stringify(existing) !== JSON.stringify(c)) {
                map.set(key, c);
            }
        }
    };
    if (doc)
        doc.transact(apply);
    else
        apply();
}
/** Observe remote+local map changes; fire `cb` with the rebuilt Comment[]. */
export function observeComments(map, cb) {
    const handler = () => cb(commentsFromMap(map));
    map.observe(handler);
    return () => map.unobserve(handler);
}
//# sourceMappingURL=commentSync.js.map