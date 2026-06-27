/**
 * Command Executor
 *
 * Executes agent commands on a document immutably:
 * - Handles all command types from AgentCommand
 * - Preserves surrounding formatting
 * - Returns new document (immutable updates)
 */
import type { Document } from '../types/document';
import type { AgentCommand } from '../types/agentApi';
/**
 * Execute an agent command on a document
 * Returns a new document with the command applied (immutable)
 *
 * Dispatch order:
 * 1. Try plugin handlers first (allows plugins to override built-in commands)
 * 2. Fall back to built-in handlers
 *
 * @param doc - The document to modify
 * @param command - The command to execute
 * @returns New document with command applied
 */
export declare function executeCommand(doc: Document, command: AgentCommand): Document;
/**
 * Execute multiple commands in sequence
 *
 * @param doc - The document to modify
 * @param commands - Commands to execute in order
 * @returns New document with all commands applied
 */
export declare function executeCommands(doc: Document, commands: AgentCommand[]): Document;
//# sourceMappingURL=executor.d.ts.map