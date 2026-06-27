import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import * as path from "path";

const server = new Server(
  { name: "docpatch-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

const DOCPATCH_PATH = path.resolve("../../backend/docpatch-kernel/target/debug/docpatch");

const execDocPatch = (args: string[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    const child = spawn(DOCPATCH_PATH, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data: Buffer) => (stdout += data.toString()));
    child.stderr.on("data", (data: Buffer) => (stderr += data.toString()));
    child.on("close", (code: number | null) => {
      if (code === 0) {
        try { resolve(JSON.parse(stdout)); } catch { resolve(stdout); }
      } else {
        reject(new Error(`Exit code ${code}: ${stderr}`));
      }
    });
  });
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "inspect",
      description: "Inspect DOCX structure",
      inputSchema: { type: "object", properties: { file: { type: "string" } }, required: ["file"] }
    },
    {
      name: "folder_index",
      description: "Index an entire matter folder",
      inputSchema: { type: "object", properties: { folder: { type: "string" }, out: { type: "string" } }, required: ["folder", "out"] }
    },
    {
      name: "search",
      description: "Search indexed folder",
      inputSchema: { type: "object", properties: { db: { type: "string" }, query: { type: "string" } }, required: ["db", "query"] }
    },
    {
      name: "locate",
      description: "Locate quote in DOCX",
      inputSchema: { type: "object", properties: { db: { type: "string" }, quote: { type: "string" } }, required: ["db", "quote"] }
    },
    {
      name: "preview_patch",
      description: "Generate diff preview",
      inputSchema: { type: "object", properties: { old: { type: "string" }, new: { type: "string" } }, required: ["old", "new"] }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments || {};
  switch (request.params.name) {
    case "inspect": return { content: [{ type: "text", text: JSON.stringify(await execDocPatch(["inspect", args.file as string, "--json"])) }] };
    case "folder_index": return { content: [{ type: "text", text: JSON.stringify(await execDocPatch(["folder-index", args.folder as string, "--out", args.out as string])) }] };
    case "search": return { content: [{ type: "text", text: JSON.stringify(await execDocPatch(["search", args.db as string, args.query as string])) }] };
    case "locate": return { content: [{ type: "text", text: JSON.stringify(await execDocPatch(["locate", args.db as string, "--quote", args.quote as string])) }] };
    case "preview_patch": return { content: [{ type: "text", text: JSON.stringify(await execDocPatch(["preview-patch", args.old as string, args.new as string])) }] };
    default: throw new Error("Tool not found");
  }
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
