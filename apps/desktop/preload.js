/**
 * SuperDoc Desktop - Preload Script
 * 
 * This script runs before the renderer process and exposes
 * a safe subset of Electron APIs to the renderer.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // IPC Methods
    send: (channel, data) => {
      // Whitelist channels
      const validChannels = [
        'open-folder',
        'open-file',
        'get-workspace-state',
        'set-workspace-path',
        'add-tab',
        'set-active-tab',
        'close-tab',
        'toggle-agent-panel'
      ];
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.send(channel, data);
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
    
    invoke: async (channel, data) => {
      // Whitelist channels
      const validChannels = [
        'open-folder',
        'open-file',
        'get-workspace-state',
        'set-workspace-path',
        'add-tab',
        'set-active-tab',
        'close-tab',
        'toggle-agent-panel'
      ];
      
      if (validChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, data);
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
    
    // Receive messages from main process
    receive: (channel, func) => {
      const validChannels = [
        'open-folder',
        'open-file'
      ];
      
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    
    // Remove listener
    removeListener: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    }
  }
);

// Also expose a simple version for direct use
contextBridge.exposeInMainWorld(
  'electronAPI', {
    ipcRenderer: {
      send: ipcRenderer.send.bind(ipcRenderer),
      invoke: ipcRenderer.invoke.bind(ipcRenderer),
      on: ipcRenderer.on.bind(ipcRenderer),
      removeListener: ipcRenderer.removeListener.bind(ipcRenderer)
    }
  }
);
