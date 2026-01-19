import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import https from 'node:https';
import started from 'electron-squirrel-startup';

import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import si from 'systeminformation';
const execAsync = promisify(exec);

// Fix PATH for macOS/Linux GUI apps to match user's shell
const fixPath = () => {
  if (process.platform === 'win32') return;
  try {
    const shell = process.env.SHELL || '/bin/bash';
    const env = execSync(`${shell} -i -c "env"`, { encoding: 'utf8' });
    const lines = env.split('\n');
    for (const line of lines) {
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.slice(0, idx);
        const value = line.slice(idx + 1);
        if (key === 'PATH') {
          process.env.PATH = value;
          console.log('Fixed PATH:', value);
          break;
        }
      }
    }
  } catch (err) {
    console.error('Failed to fix PATH:', err);
  }
};

fixPath();

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

  // Set dev Dock icon on macOS when running with Vite dev server
  if (process.platform === 'darwin' && typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    try {
      const candidates = [
        path.resolve(process.cwd(), 'images/icon.png'),
        path.resolve(process.cwd(), 'images/icon.icns'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          app.dock.setIcon(p);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to set dev dock icon:', err);
    }
  }

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

ipcMain.handle('get-system-env', async () => {
  const getVersion = async (cmd: string) => {
    try {
      const { stdout } = await execAsync(cmd);
      return stdout.trim();
    } catch (err) {
      return null;
    }
  };

  try {
    const uuid = await si.uuid();
    const system = await si.system();
    
    // Generate a reasonably unique ID if uuid is not available
    const deviceId = uuid.os || uuid.hardware || system.serial || 'unknown-device';

    const [nodeVersion, gitVersion, mysqlVersion] = await Promise.all([
      getVersion('node -v'),
      getVersion('git --version'),
      getVersion('mysql --version'),
    ]);

    return {
      deviceId,
      software: {
        node: nodeVersion,
        git: gitVersion,
        mysql: mysqlVersion,
      }
    };
  } catch (error) {
    console.error('Failed to get system env:', error);
    return {
      deviceId: 'error',
      software: {
        node: null,
        git: null,
        mysql: null,
      }
    };
  }
});


ipcMain.handle('uninstall-app', async (_event, appPath: string) => {
  try {
    await shell.trashItem(appPath);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to uninstall app:', error);
    return {
      success: false,
      message: error?.message || '卸载失败，请在访达中手动删除该应用。',
    };
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

type PackageManagerName = 'npm' | 'pnpm';

type PackageInfo = {
  name: string;
  version: string;
  description?: string;
  homepage?: string;
  path?: string;
  author?: string;
};

type PackageManagerPackagesResult = {
  manager: PackageManagerName;
  global: PackageInfo[];
  local: PackageInfo[];
};

const parseNpmLikeList = (jsonStr: string): PackageInfo[] => {
  try {
    const parsed = JSON.parse(jsonStr);
    const result: PackageInfo[] = [];
    const addDeps = (deps: Record<string, unknown>, basePath?: string) => {
      Object.keys(deps).forEach(key => {
        const raw = deps[key];
        if (!raw || typeof raw !== 'object') return;
        const item = raw as {
          version?: string;
          description?: string;
          homepage?: string;
          path?: string;
          author?: string | { name?: string };
        };
        const author =
          typeof item.author === 'string'
            ? item.author
            : item.author && typeof item.author === 'object'
            ? item.author.name
            : undefined;
        const info: PackageInfo = {
          name: key,
          version: typeof item.version === 'string' ? item.version : '',
          description: typeof item.description === 'string' ? item.description : undefined,
          homepage: typeof item.homepage === 'string' ? item.homepage : undefined,
          path: typeof item.path === 'string' ? item.path : basePath,
          author,
        };
        result.push(info);
      });
    };

    if (Array.isArray(parsed)) {
      parsed.forEach(entry => {
        if (!entry || typeof entry !== 'object') return;
        const obj = entry as { dependencies?: Record<string, unknown>; path?: string; name?: string; version?: string };
        if (obj.dependencies && typeof obj.dependencies === 'object') {
          addDeps(obj.dependencies, obj.path);
        } else if (obj.name && obj.version) {
          result.push({
            name: obj.name,
            version: obj.version,
            path: obj.path,
          });
        }
      });
    } else if (parsed && typeof parsed === 'object') {
      const root = parsed as { dependencies?: Record<string, unknown>; path?: string };
      if (root.dependencies && typeof root.dependencies === 'object') {
        addDeps(root.dependencies, root.path);
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to parse package list:', error);
    return [];
  }
};

const getManagerPackages = async (manager: PackageManagerName): Promise<PackageManagerPackagesResult> => {
  const run = async (scope: 'global' | 'local'): Promise<PackageInfo[]> => {
    try {
      let cmd: string;
      if (manager === 'npm') {
        cmd = scope === 'global' ? 'npm ls -g --depth=0 --json' : 'npm ls --depth=0 --json';
      } else {
        cmd = scope === 'global' ? 'pnpm ls -g --depth=0 --json' : 'pnpm ls --depth=0 --json';
      }
      const { stdout } = await execAsync(cmd);
      return parseNpmLikeList(stdout);
    } catch (error) {
      console.error(`Failed to get ${manager} packages (${scope}):`, error);
      return [];
    }
  };

  const [global, local] = await Promise.all([
    run('global'),
    run('local'),
  ]);

  return {
    manager,
    global,
    local,
  };
};

ipcMain.handle('package-manager:get-packages', async () => {
  const results: PackageManagerPackagesResult[] = [];

  try {
    results.push(await getManagerPackages('npm'));
  } catch (error) {
    console.error('npm packages fetch failed:', error);
  }

  try {
    results.push(await getManagerPackages('pnpm'));
  } catch (error) {
    console.error('pnpm packages fetch failed:', error);
  }

  return results;
});

type LocalNodeVersion = {
  version: string;
  path: string;
  active: boolean;
  installedAt?: number;
};

type RemoteNodeVersion = {
  version: string;
  lts: boolean | string;
  date: string;
  v8?: string;
  npm?: string;
};

const getNodeBaseDir = () => {
  const base = app.getPath('userData');
  const dir = path.join(base, 'node-versions');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const readActiveNodeVersion = async (baseDir: string) => {
  const file = path.join(baseDir, 'active.json');
  try {
    const content = await fs.promises.readFile(file, 'utf-8');
    const parsed = JSON.parse(content) as { version?: string };
    return parsed.version || null;
  } catch (error) {
    console.error('Failed to read active node version:', error);
    return null;
  }
};

const writeActiveNodeVersion = async (baseDir: string, version: string) => {
  const file = path.join(baseDir, 'active.json');
  await fs.promises.writeFile(file, JSON.stringify({ version }), 'utf-8');
  if (process.platform !== 'win32') {
    const currentLink = path.join(baseDir, 'current');
    try {
      const stat = await fs.promises.lstat(currentLink);
      if (stat.isSymbolicLink() || stat.isDirectory() || stat.isFile()) {
        await fs.promises.unlink(currentLink);
      }
    } catch (error) {
      console.error('Failed to cleanup current node link:', error);
    }
    const target = path.join(baseDir, version);
    try {
      await fs.promises.symlink(target, currentLink, 'dir');
    } catch (error) {
      console.error('Failed to create current node link:', error);
    }
  }
};

const downloadFile = (url: string, dest: string) => {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, res => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`下载失败，状态码 ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', err => {
        file.close();
        fs.unlink(dest, () => {
          reject(err);
        });
      });
  });
};

ipcMain.handle('node-manager:get-local-versions', async () => {
  const baseDir = getNodeBaseDir();
  const active = await readActiveNodeVersion(baseDir);
  const result: LocalNodeVersion[] = [];
  
  // Get system node version
  let systemVersion: string | null = null;
  let systemPath: string | null = null;
  try {
    const { stdout } = await execAsync('node -v');
    systemVersion = stdout.trim();
    if (systemVersion.startsWith('v')) {
      systemVersion = systemVersion.slice(1);
    }
    const { stdout: pathOut } = await execAsync('which node');
    systemPath = pathOut.trim();
  } catch (error) {
    // Ignore error if node is not installed system-wide
  }

  const entries = await fs.promises.readdir(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (entry.name === 'current') {
      continue;
    }
    const version = entry.name;
    const dir = path.join(baseDir, version);
    let installedAt: number | undefined;
    const metaFile = path.join(dir, 'meta.json');
    try {
      const metaContent = await fs.promises.readFile(metaFile, 'utf-8');
      const meta = JSON.parse(metaContent) as { installedAt?: number };
      installedAt = meta.installedAt;
    } catch (error) {
      console.error('Failed to read node version meta:', error);
    }
    result.push({
      version,
      path: dir,
      active: active === version,
      installedAt,
    });
  }
  result.sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return (b.installedAt || 0) - (a.installedAt || 0);
  });
  return { versions: result, systemVersion, systemPath };
});

ipcMain.handle('node-manager:get-remote-versions', async () => {
  const url = 'https://nodejs.org/dist/index.json';
  const data = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    https
      .get(url, res => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`获取版本信息失败，状态码 ${res.statusCode}`));
          return;
        }
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      })
      .on('error', err => reject(err));
  });
  const parsed = JSON.parse(data) as Array<{ version: string; lts: boolean | string; date: string; v8?: string; npm?: string }>;
  const list: RemoteNodeVersion[] = parsed.map(v => ({
    version: v.version,
    lts: v.lts,
    date: v.date,
    v8: v.v8,
    npm: v.npm,
  }));
  list.sort((a, b) => (a.date < b.date ? 1 : -1));
  return list.slice(0, 30);
});

ipcMain.handle('node-manager:download-version', async (_event, version: string) => {
  const baseDir = getNodeBaseDir();
  const targetDir = path.join(baseDir, version);
  try {
    await fs.promises.mkdir(targetDir, { recursive: true });
  } catch (error) {
    console.error('Failed to ensure node version dir:', error);
  }
  const platform = process.platform;
  const arch = process.arch;
  if (platform !== 'darwin' && platform !== 'linux') {
    throw new Error('当前仅支持在 macOS 和 Linux 上安装 Node 版本');
  }
  const mappedArch = arch === 'arm64' ? 'arm64' : 'x64';
  const distName = `node-${version}-${platform}-${mappedArch}`;
  const filename = `${distName}.tar.xz`;
  const url = `https://nodejs.org/dist/${version}/${filename}`;
  const tmpDir = path.join(os.tmpdir(), 'node-manager');
  await fs.promises.mkdir(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, filename);
  await downloadFile(url, tmpFile);
  await execAsync(`tar -xJf "${tmpFile}" -C "${targetDir}" --strip-components=1`);
  const metaFile = path.join(targetDir, 'meta.json');
  await fs.promises.writeFile(
    metaFile,
    JSON.stringify({ installedAt: Date.now(), source: url }),
    'utf-8',
  );
  return { success: true };
});

ipcMain.handle('node-manager:activate-version', async (_event, version: string) => {
  const baseDir = getNodeBaseDir();
  const targetDir = path.join(baseDir, version);
  const exists = fs.existsSync(targetDir);
  if (!exists) {
    throw new Error(`版本 ${version} 未安装`);
  }
  await writeActiveNodeVersion(baseDir, version);
  return { success: true };
});

ipcMain.handle('node-manager:setup-shell', async () => {
  const baseDir = getNodeBaseDir();
  const binPath = path.join(baseDir, 'current', 'bin');
  const exportCmd = `export PATH="${binPath}:$PATH"`;
  
  const shell = process.env.SHELL || '/bin/bash';
  let profilePath = '';
  
  if (shell.endsWith('zsh')) {
    profilePath = path.join(os.homedir(), '.zshrc');
  } else if (shell.endsWith('bash')) {
    profilePath = path.join(os.homedir(), '.bash_profile');
    if (!fs.existsSync(profilePath)) {
      profilePath = path.join(os.homedir(), '.bashrc');
    }
  } else {
    throw new Error('Unsupported shell: ' + shell);
  }

  try {
    let content = '';
    if (fs.existsSync(profilePath)) {
      content = await fs.promises.readFile(profilePath, 'utf-8');
    }
    
    if (content.includes(binPath)) {
      return { success: true, message: 'Already configured' };
    }

    const comment = '\n# Electron App Node Version Manager';
    await fs.promises.appendFile(profilePath, `${comment}\n${exportCmd}\n`, 'utf-8');
    return { success: true, message: 'Configuration added to ' + profilePath };
  } catch (error) {
    console.error('Failed to setup shell:', error);
    throw new Error('Failed to update shell profile');
  }
});
