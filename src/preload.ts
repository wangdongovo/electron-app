import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getProcessInfo: () => ipcRenderer.invoke('get-process-info'),
  getAppMemoryInfo: () => ipcRenderer.invoke('get-app-memory'),
  uninstallApp: (path: string) => ipcRenderer.invoke('uninstall-app', path),
  getGitInfo: () => ipcRenderer.invoke('get-git-info'),
  getPackageManagers: () => ipcRenderer.invoke('package-manager:get-packages'),
});

contextBridge.exposeInMainWorld('nodeManager', {
  getLocalVersions: () => ipcRenderer.invoke('node-manager:get-local-versions'),
  getRemoteVersions: () => ipcRenderer.invoke('node-manager:get-remote-versions'),
  downloadVersion: (version: string) =>
    ipcRenderer.invoke('node-manager:download-version', version),
  activateVersion: (version: string) =>
    ipcRenderer.invoke('node-manager:activate-version', version),
  setupShell: () => ipcRenderer.invoke('node-manager:setup-shell'),
});
