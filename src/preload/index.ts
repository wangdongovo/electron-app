import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  uninstallApp: (path: string) => ipcRenderer.invoke('uninstall-app', path),
  getGitInfo: () => ipcRenderer.invoke('get-git-info'),
  getSystemEnv: () => ipcRenderer.invoke('get-system-env'),
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
