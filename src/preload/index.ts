import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  uninstallApp: (path: string) => ipcRenderer.invoke('uninstall-app', path),
  getGitInfo: () => ipcRenderer.invoke('get-git-info'),
  getSystemEnv: () => ipcRenderer.invoke('get-system-env'),
});

contextBridge.exposeInMainWorld('nodeManager', {
  getLocalVersions: () => ipcRenderer.invoke('node-manager:get-local-versions'),
  getRemoteVersions: () => ipcRenderer.invoke('node-manager:get-remote-versions'),
  downloadVersion: (version: string) => ipcRenderer.invoke('node-manager:download-version', version),
  activateVersion: (version: string) => ipcRenderer.invoke('node-manager:activate-version', version),
  removeVersion: (version: string) => ipcRenderer.invoke('node-manager:remove-version', version),
  checkEnvStatus: () => ipcRenderer.invoke('node-manager:check-env-status'),
  setupEnv: () => ipcRenderer.invoke('node-manager:setup-env'),
});
