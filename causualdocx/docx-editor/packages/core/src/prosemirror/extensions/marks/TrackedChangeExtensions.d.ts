/**
 * Tracked Change Mark Extensions — insertion and deletion marks
 *
 * Renders insertions with green underline and deletions with red strikethrough,
 * matching the standard MS Word display for tracked changes.
 */
/**
 * Insertion mark — text added in tracked changes
 * Renders with green color and underline.
 */
export declare const InsertionExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").MarkExtension;
/**
 * Deletion mark — text removed in tracked changes
 * Renders with red color and strikethrough.
 */
export declare const DeletionExtension: (options?: Partial<Record<string, unknown>> | undefined) => import("../types").MarkExtension;
//# sourceMappingURL=TrackedChangeExtensions.d.ts.map