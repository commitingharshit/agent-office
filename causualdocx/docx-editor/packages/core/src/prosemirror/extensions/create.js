/**
 * Extension Factory Functions
 *
 * Creates extension instances from definitions.
 * Each factory returns a function that accepts options and returns an extension instance.
 */
import { Priority } from './types';
/**
 * Create a generic extension (plugins, commands, keymaps — no schema contribution)
 */
export function createExtension(def) {
    return (options) => {
        var _a;
        const mergedOptions = Object.assign(Object.assign({}, def.defaultOptions), options);
        return {
            type: 'extension',
            config: {
                name: def.name,
                priority: (_a = def.priority) !== null && _a !== void 0 ? _a : Priority.Default,
                options: mergedOptions,
            },
            onSchemaReady(ctx) {
                return def.onSchemaReady(ctx, mergedOptions);
            },
        };
    };
}
/**
 * Create a node extension (contributes a NodeSpec to the schema)
 */
export function createNodeExtension(def) {
    return (options) => {
        var _a;
        const mergedOptions = Object.assign(Object.assign({}, def.defaultOptions), options);
        const nodeSpec = typeof def.nodeSpec === 'function' ? def.nodeSpec(mergedOptions) : def.nodeSpec;
        return {
            type: 'node',
            config: {
                name: def.name,
                priority: (_a = def.priority) !== null && _a !== void 0 ? _a : Priority.Default,
                options: mergedOptions,
                schemaNodeName: def.schemaNodeName,
                nodeSpec,
            },
            onSchemaReady(ctx) {
                var _a, _b;
                return (_b = (_a = def.onSchemaReady) === null || _a === void 0 ? void 0 : _a.call(def, ctx, mergedOptions)) !== null && _b !== void 0 ? _b : {};
            },
        };
    };
}
/**
 * Create a mark extension (contributes a MarkSpec to the schema)
 */
export function createMarkExtension(def) {
    return (options) => {
        var _a;
        const mergedOptions = Object.assign(Object.assign({}, def.defaultOptions), options);
        const markSpec = typeof def.markSpec === 'function' ? def.markSpec(mergedOptions) : def.markSpec;
        return {
            type: 'mark',
            config: {
                name: def.name,
                priority: (_a = def.priority) !== null && _a !== void 0 ? _a : Priority.Default,
                options: mergedOptions,
                schemaMarkName: def.schemaMarkName,
                markSpec,
            },
            onSchemaReady(ctx) {
                var _a, _b;
                return (_b = (_a = def.onSchemaReady) === null || _a === void 0 ? void 0 : _a.call(def, ctx, mergedOptions)) !== null && _b !== void 0 ? _b : {};
            },
        };
    };
}
//# sourceMappingURL=create.js.map