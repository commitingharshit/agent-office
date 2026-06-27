/**
 * Selection Tracker Extension — wraps createSelectionTrackerPlugin
 */
import { createExtension } from '../create';
import { createSelectionTrackerPlugin, extractSelectionContext, } from '../../plugins/selectionTracker';
export const SelectionTrackerExtension = createExtension({
    name: 'selectionTracker',
    defaultOptions: {},
    onSchemaReady(_ctx, options) {
        return {
            plugins: [createSelectionTrackerPlugin(options.onSelectionChange)],
            commands: {
                extractSelectionContext: () => {
                    // This is a query, not a command, but we expose it for convenience
                    return (state, _dispatch) => {
                        extractSelectionContext(state);
                        return true;
                    };
                },
            },
        };
    },
});
//# sourceMappingURL=SelectionTrackerExtension.js.map