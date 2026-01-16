import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getProcessInfo: () => ipcRenderer.invoke('get-process-info'),
  getAppMemoryInfo: () => ipcRenderer.invoke('get-app-memory'),
});

