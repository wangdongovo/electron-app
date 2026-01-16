import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import si from 'systeminformation';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
   mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle('get-system-info', async () => {
  try {
    const [cpu, mem, os, disk, battery] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.diskLayout(),
      si.battery(),
    ]);

    return {
      cpu,
      mem,
      os,
      disk,
      battery,
    };
  } catch (error) {
    console.error('Failed to get system info:', error);
    return null;
  }
});
ipcMain.handle('get-process-info', async () => {
  try {
    const processes = await si.processes();
    const sorted = processes.list
      .sort((a, b) => b.memRss - a.memRss)
      .map(p => ({
        name: p.name,
        mem: p.memRss,
        cpu: p.cpu,
        user: p.user,
        path: (p as any).path ?? '',
      }));

    return sorted;
  } catch (error) {
    console.error('Failed to get process info:', error);
    return [];
  }
});

const appIconCache = new Map<string, string>();

ipcMain.handle('get-app-memory', async () => {
  try {
    const processes = await si.processes();
    const map = new Map<
      string,
      {
        name: string;
        mem: number;
        cpu: number;
        processCount: number;
        appPath?: string;
      }
    >();

    const extractAppInfo = (pathStr: string, name: string) => {
      if (process.platform === 'darwin' && pathStr) {
        const bundleMatch = pathStr.match(/(\/.*?\.app)\//);
        if (bundleMatch && bundleMatch[1]) {
          const appPath = bundleMatch[1];
          const appName = appPath.split('/').pop() || name;
          const inApplications =
            appPath.startsWith('/Applications/') ||
            appPath.startsWith('/System/Applications/');
          return { appName, appPath, inApplications };
        }
      }
      return { appName: name, appPath: '', inApplications: false };
    };

    for (const p of processes.list) {
      const rawPath = (p as any).path || '';
      const { appName, appPath, inApplications } = extractAppInfo(rawPath, p.name);

      if (process.platform === 'darwin' && !inApplications) {
        continue;
      }

      const key = appPath || appName;
      const prev = map.get(key);
      const mem = p.memRss;
      const cpu = p.cpu || 0;

      if (prev) {
        prev.mem += mem;
        prev.cpu += cpu;
        prev.processCount += 1;
      } else {
        map.set(key, {
          name: appName,
          mem,
          cpu,
          processCount: 1,
          appPath: appPath || undefined,
        });
      }
    }

    const aggregated = Array.from(map.values()).sort((a, b) => b.mem - a.mem);

    for (const appInfo of aggregated) {
      if (!appInfo.appPath) {
        continue;
      }
      if (!appIconCache.has(appInfo.appPath)) {
        try {
          const icon = await app.getFileIcon(appInfo.appPath, { size: 'small' });
          appIconCache.set(appInfo.appPath, icon.toDataURL());
        } catch {
          appIconCache.set(appInfo.appPath, '');
        }
      }
    }

    return aggregated.map(a => ({
      name: a.name,
      mem: a.mem,
      cpu: a.cpu,
      processCount: a.processCount,
      icon: a.appPath ? appIconCache.get(a.appPath) ?? '' : '',
    }));
  } catch (error) {
    console.error('Failed to get app memory:', error);
    return [];
  }
});

ipcMain.handle('get-git-info', async () => {
  const parseList = (output: string): { key: string; value: string }[] => {
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const idx = line.indexOf('=');
        if (idx === -1) {
          return { key: line, value: '' };
        }
        return { key: line.slice(0, idx), value: line.slice(idx + 1) };
      });
  };

  try {
    const [globalList, systemList, userName, userEmail, signingKey] = await Promise.all([
      execAsync('git config --global --list').then(r => r.stdout).catch(() => ''),
      execAsync('git config --system --list').then(r => r.stdout).catch(() => ''),
      execAsync('git config --global user.name').then(r => r.stdout.trim()).catch(() => ''),
      execAsync('git config --global user.email').then(r => r.stdout.trim()).catch(() => ''),
      execAsync('git config --global user.signingkey').then(r => r.stdout.trim()).catch(() => ''),
    ]);

    return {
      user: {
        name: userName || undefined,
        email: userEmail || undefined,
        signingkey: signingKey || undefined,
      },
      global: parseList(globalList),
      system: parseList(systemList),
    };
  } catch (error) {
    console.error('Failed to get git info:', error);
    return {
      user: {},
      global: [],
      system: [],
    };
  }
});
