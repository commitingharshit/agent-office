import * as fs from 'fs/promises';
import * as vscode from 'vscode';

export class DocxDocument implements vscode.CustomDocument {
  public dirty = false;
  public version = 1;
  public lastSavedBytes: Uint8Array | null = null;
  private _disposed = false;

  constructor(public uri: vscode.Uri, public bytes: Uint8Array) {
    this.lastSavedBytes = new Uint8Array(bytes);
  }

  static async load(uri: vscode.Uri): Promise<DocxDocument> {
    const bytes = new Uint8Array(await fs.readFile(uri.fsPath));
    return new DocxDocument(uri, bytes);
  }

  setBytes(bytes: Uint8Array, markDirty = true): void {
    this.bytes = new Uint8Array(bytes);
    this.version += 1;
    this.dirty = markDirty;
  }

  async save(): Promise<void> {
    await fs.writeFile(this.uri.fsPath, Buffer.from(this.bytes));
    this.lastSavedBytes = new Uint8Array(this.bytes);
    this.dirty = false;
    this.version += 1;
  }

  async saveAs(destination: vscode.Uri): Promise<void> {
    await fs.writeFile(destination.fsPath, Buffer.from(this.bytes));
    this.uri = destination;
    this.lastSavedBytes = new Uint8Array(this.bytes);
    this.dirty = false;
    this.version += 1;
  }

  async revert(): Promise<void> {
    const bytes = new Uint8Array(await fs.readFile(this.uri.fsPath));
    this.bytes = bytes;
    this.lastSavedBytes = new Uint8Array(bytes);
    this.dirty = false;
    this.version += 1;
  }

  async backup(destination: vscode.Uri): Promise<void> {
    await fs.writeFile(destination.fsPath, Buffer.from(this.bytes));
  }

  dispose(): void {
    this._disposed = true;
  }

  get isDisposed(): boolean {
    return this._disposed;
  }
}
