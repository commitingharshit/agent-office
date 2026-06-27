/**
 * Docxtemplater Plugin Command Handlers
 *
 * Handles template-related commands for DocumentAgent.
 */
import type { Document } from '../../types/document';
import type { PluginCommand } from '../types';
/**
 * Insert a template variable at a position
 */
export interface InsertTemplateVariableCommand extends PluginCommand {
    type: 'insertTemplateVariable';
    position: {
        paragraphIndex: number;
        offset: number;
    };
    variableName: string;
}
/**
 * Replace text with a template variable
 */
export interface ReplaceWithTemplateVariableCommand extends PluginCommand {
    type: 'replaceWithTemplateVariable';
    range: {
        start: {
            paragraphIndex: number;
            offset: number;
        };
        end: {
            paragraphIndex: number;
            offset: number;
        };
    };
    variableName: string;
}
/**
 * Handle insertTemplateVariable command
 *
 * Inserts {variableName} at the specified position.
 */
export declare function handleInsertTemplateVariable(doc: Document, command: PluginCommand): Document;
/**
 * Handle replaceWithTemplateVariable command
 *
 * Replaces the text in the range with {variableName}.
 */
export declare function handleReplaceWithTemplateVariable(doc: Document, command: PluginCommand): Document;
//# sourceMappingURL=handlers.d.ts.map