export function createLiveVersionFeed() {
    const subs = new Set();
    return {
        tick: () => {
            for (const fn of subs) {
                try {
                    fn();
                }
                catch (err) {
                    console.warn('[version-history] subscriber threw', err);
                }
            }
        },
        subscribe: (fn) => {
            subs.add(fn);
            return () => {
                subs.delete(fn);
            };
        },
    };
}
//# sourceMappingURL=live-feed.js.map