import type * as vscode from 'vscode';

export type WebviewToExtensionMessage =
  | {
      type: 'ready';
    }
  | {
      type: 'change';
      hasChanges: boolean;
      reason?: string;
    }
  | {
      type: 'save';
      documentBytes: Uint8Array;
      requestId?: string;
    }
  | {
      type: 'error';
      error: string;
    }
  | {
      type: 'saveShortcut';
    }
  | {
      type: 'triggerCommand';
      command: string;
    };

export type HermesUiMessage = {
  type: 'hermesUi';
  phase: 'idle' | 'thinking' | 'streaming' | 'done' | 'error';
  message: string;
  transcript?: string;
};

export type ExtensionToWebviewMessage =
  | HermesUiMessage
  | {
      type: 'init';
      fileUri: string;
      documentBytes: Uint8Array;
      isDirty: boolean;
      requestId?: string;
    }
  | {
      type: 'setDocument';
      documentBytes: Uint8Array;
      requestId?: string;
    }
  | {
      type: 'getDocument';
      requestId: string;
    };

export interface DocxSavePayload {
  bytes: Uint8Array;
  uri: vscode.Uri;
}
