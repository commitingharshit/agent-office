/**
 * Tool registry — single place the pipeline looks up which tool
 * handles which intent.
 */
import { applyRewriteTool } from './applyRewrite';
import { chatReplyTool } from './chatReply';
import { findIssuesTool } from './findIssues';
import { insertOutlineTool } from './insertOutline';
import { insertTableTool } from './insertTable';
import { researchTool } from './researchTool';
import { summarizeDocTool } from './summarizeDoc';
import { transformDocTool } from './transformDoc';
import { translateRangeTool } from './translateRange';
const TOOLS = {
    insertTable: insertTableTool,
    summarize: summarizeDocTool,
    rewrite: applyRewriteTool,
    outline: insertOutlineTool,
    translate: translateRangeTool,
    findIssues: findIssuesTool,
    transformDoc: transformDocTool,
    research: researchTool,
    chat: chatReplyTool,
};
export function getTool(name) {
    return TOOLS[name];
}
export function listTools() {
    return Object.keys(TOOLS).map((name) => ({
        name,
        description: TOOLS[name].description,
    }));
}
//# sourceMappingURL=registry.js.map