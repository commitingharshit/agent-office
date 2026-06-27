/**
 * Tiny pub/sub the version-history store uses to wake subscribers
 * whenever a snapshot is written / renamed / deleted. The Versions
 * tab subscribes via `useLiveVersionList` and re-queries IDB on tick.
 *
 * Ported verbatim from sheets' `apps/web/src/version-history/live-feed.ts`
 * — kept deliberately tiny: one global subscription set, no
 * granularity, no unsubscribe leaks (subscribers pair subscribe/
 * unsubscribe in their effect cleanup).
 */
export type LiveVersionFeed = {
    tick: () => void;
    subscribe: (fn: () => void) => () => void;
};
export declare function createLiveVersionFeed(): LiveVersionFeed;
//# sourceMappingURL=live-feed.d.ts.map