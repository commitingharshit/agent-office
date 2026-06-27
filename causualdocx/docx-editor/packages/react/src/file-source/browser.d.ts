/**
 * BrowserFileSource — the FileSource implementation for Mode 1
 * (Pages). Wraps the existing IDB-backed recent-files store so the
 * landing screen + File menu have a uniform contract regardless of
 * deploy mode.
 *
 * Scope of this implementation is intentionally narrow — Mode 1 is
 * the "single-device hosted demo" deploy and doesn't try to be a
 * real file system. The File System Access integration listed in
 * docs/internal/11-storage-modes.md is Phase A and lands separately;
 * this class is the no-FSA baseline.
 */
import type { FileEntry, FileSource } from './types';
export declare class BrowserFileSource implements FileSource {
    readonly kind: "browser";
    readonly label = "This browser";
    private readonly recent;
    list(): Promise<FileEntry[]>;
    open(id: string): Promise<{
        bytes: ArrayBuffer;
        name: string;
        etag?: string;
    }>;
    save(id: string | null, bytes: ArrayBuffer, opts?: {
        name?: string;
    }): Promise<{
        id: string;
        etag: string;
    }>;
    rename(): Promise<void>;
    delete(id: string): Promise<void>;
    watchRecent(cb: (recent: FileEntry[]) => void): () => void;
    rememberLastOpened(id: string | null): Promise<void>;
    lastOpened(): Promise<string | null>;
}
//# sourceMappingURL=browser.d.ts.map