/**
 * Core Plugin System Types
 *
 * Defines the interfaces for headless plugins that work in Node.js
 * without React/DOM dependencies. These plugins extend DocumentAgent
 * with additional commands and expose MCP tools for AI integration.
 */
/**
 * Check if a schema is Zod-like
 */
export function isZodSchema(schema) {
    return (typeof schema === 'object' &&
        schema !== null &&
        ('_def' in schema || 'parse' in schema || 'safeParse' in schema));
}
//# sourceMappingURL=types.js.map