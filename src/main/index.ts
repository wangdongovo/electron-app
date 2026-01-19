import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import started from 'electron-squirrel-startup';
import axios from 'axios';
import si from 'systeminformation';

const execAsync = promisify(exec);

// Declare globals injected by Vite plugin
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

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
        } else if (key === 'NVM_DIR') {
          process.env.NVM_DIR = value;
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
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- Existing IPC Handlers ---

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
  } catch (error: unknown) {
    console.error('Failed to uninstall app:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '卸载失败，请在访达中手动删除该应用。',
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

ipcMain.handle('node-manager:check-env-status', async () => {
  const versionsDir = getVersionsDir();
  const binPath = path.join(versionsDir, 'current', 'bin');
  
  // Check if binPath is in user's PATH (basic check)
  const shell = process.env.SHELL || '/bin/bash';
  const profilePath = path.join(os.homedir(), shell.endsWith('zsh') ? '.zshrc' : '.bash_profile');
  
  let isConfigured = false;
  try {
    if (fs.existsSync(profilePath)) {
      const content = fs.readFileSync(profilePath, 'utf-8');
      isConfigured = content.includes(versionsDir);
    }
  } catch (error) {
    console.error('Failed to check shell profile:', error);
  }

  return {
    isConfigured,
    expectedPath: binPath,
    shellConfigFile: profilePath
  };
});

ipcMain.handle('node-manager:setup-env', async () => {
  const versionsDir = getVersionsDir();
  const binPath = path.join(versionsDir, 'current', 'bin');
  const shell = process.env.SHELL || '/bin/bash';
  const profilePath = path.join(os.homedir(), shell.endsWith('zsh') ? '.zshrc' : '.bash_profile');
  
  const exportCmd = `\n# DevToolbox Node Manager\nexport PATH="${binPath}:$PATH"\n`;
  
  try {
    fs.appendFileSync(profilePath, exportCmd);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update shell profile:', error);
    return { success: false, message: error.message };
  }
});

// --- Node Manager Logic ---

const getVersionsDir = () => {
  const userDataPath = app.getPath('userData');
  const versionsDir = path.join(userDataPath, 'node-versions');
  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }
  return versionsDir;
};

const getActiveVersion = async () => {
  const versionsDir = getVersionsDir();
  const currentLink = path.join(versionsDir, 'current');
  try {
    const linkPath = await fs.promises.readlink(currentLink);
    // linkPath is likely absolute or relative. If it's relative like "v18.0.0", we just return it.
    // If it's absolute, we extract basename.
    return path.basename(linkPath);
  } catch (error) {
    return null;
  }
};

const getNvmVersions = async (): Promise<any[]> => {
  const nvmDir = process.env.NVM_DIR || path.join(os.homedir(), '.nvm');
  const versionsDir = path.join(nvmDir, 'versions', 'node');

  if (!fs.existsSync(versionsDir)) {
    return [];
  }

  try {
    const items = await fs.promises.readdir(versionsDir, { withFileTypes: true });
    return items
      .filter((item: fs.Dirent) => item.isDirectory() && item.name.startsWith('v'))
      .map((item: fs.Dirent) => ({
        version: item.name,
        path: path.join(versionsDir, item.name),
        active: false,
        installedAt: fs.statSync(path.join(versionsDir, item.name)).birthtimeMs,
        source: 'nvm'
      }));
  } catch (error) {
    console.error('Failed to get NVM versions:', error);
    return [];
  }
};

const getSystemVersion = async (): Promise<any | null> => {
  try {
    const { stdout: nodePath } = await execAsync('which node');
    const { stdout: nodeVersion } = await execAsync('node -v');

    if (nodePath && nodeVersion) {
      const binPath = path.dirname(nodePath.trim());
      const installPath = path.dirname(binPath);
      
      // Ensure it looks like a valid node install (has bin directory)
      if (fs.existsSync(path.join(installPath, 'bin', 'node'))) {
        return {
          version: nodeVersion.trim(),
          path: installPath,
          active: false,
          installedAt: Date.now(),
          source: 'system'
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

ipcMain.handle('node-manager:get-local-versions', async () => {
  const versionsDir = getVersionsDir();
  
  // 1. App local versions
  let localVersions: any[] = [];
  try {
    const items = await fs.promises.readdir(versionsDir, { withFileTypes: true });
    localVersions = items
      .filter((item: fs.Dirent) => item.isDirectory() && item.name !== 'current' && item.name.startsWith('v'))
      .map((item: fs.Dirent) => ({
        version: item.name,
        path: path.join(versionsDir, item.name),
        active: false,
        installedAt: fs.statSync(path.join(versionsDir, item.name)).birthtimeMs,
        source: 'local'
      }));
  } catch (error) {
    console.error('Failed to get local versions:', error);
  }

  // 2. NVM versions
  const nvmVersions = await getNvmVersions();

  // 3. System version
  const systemVersion = await getSystemVersion();
  const allSystemVersions = systemVersion ? [systemVersion] : [];

  // Merge
  const allVersions = [...localVersions, ...nvmVersions, ...allSystemVersions];

  // Determine active version by checking what 'node' command resolves to in system
  let activePath: string | null = null;
  try {
    const { stdout } = await execAsync('which node');
    if (stdout) {
      // Resolve symlinks to get the real path (e.g. /usr/local/bin/node -> ... -> v22.22.0/bin/node)
      activePath = await fs.promises.realpath(stdout.trim());
      // Move up two levels to get the installation root (bin/node -> bin -> root)
      activePath = path.dirname(path.dirname(activePath));
    }
  } catch (e) {
    // If 'which node' fails, try the internal current link as fallback
    const currentLink = path.join(versionsDir, 'current');
    try {
      if (fs.existsSync(currentLink)) {
        activePath = await fs.promises.readlink(currentLink);
        if (!path.isAbsolute(activePath)) {
          activePath = path.join(versionsDir, activePath);
        }
      }
    } catch (err) {
       // Ignore fallback error
     }
   }
 
   const finalVersions = allVersions.map(v => {
       // Normalize paths for comparison (resolve symlinks, standardize separators)
       // v.path is the installation root
       let isPathMatch = false;
       if (activePath) {
         try {
            const normalizedVPath = path.resolve(v.path);
            const normalizedActivePath = path.resolve(activePath);
            isPathMatch = normalizedActivePath === normalizedVPath;
         } catch(e) {
           // Ignore path resolution errors
         }
       }

      return {
        ...v,
        active: isPathMatch
      };
  });

  const currentVersion = finalVersions.find(v => v.active)?.version || null;
      
  return {
    versions: finalVersions,
    currentVersion
  };
});

ipcMain.handle('node-manager:get-remote-versions', async () => {
  try {
    const response = await axios.get('https://nodejs.org/dist/index.json');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch remote versions:', error);
    return [];
  }
});

ipcMain.handle('node-manager:download-version', async (_event, version: string) => {
  const versionsDir = getVersionsDir();
  const targetDir = path.join(versionsDir, version);
  
  if (fs.existsSync(targetDir)) {
    return { success: true, message: 'Version already installed' };
  }

  const platform = process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'win32' : 'linux';
  const arch = process.arch; // 'x64' or 'arm64'
  const extension = platform === 'win32' ? 'zip' : 'tar.gz';
  const fileName = `node-${version}-${platform}-${arch}.${extension}`;
  const url = `https://nodejs.org/dist/${version}/${fileName}`;
  const tempFile = path.join(os.tmpdir(), fileName);

  try {
    // 1. Download
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(tempFile);
    
    await new Promise((resolve, reject) => {
      (response.data as any).pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // 2. Extract
    if (extension === 'tar.gz') {
      await execAsync(`tar -xzf "${tempFile}" -C "${versionsDir}"`);
    } else {
      // Basic zip support for completeness, though we are on macos
      await execAsync(`unzip "${tempFile}" -d "${versionsDir}"`);
    }

    // 3. Rename folder
    const extractedName = fileName.replace(`.${extension}`, '');
    const extractedPath = path.join(versionsDir, extractedName);
    
    if (fs.existsSync(extractedPath)) {
      await fs.promises.rename(extractedPath, targetDir);
    } else {
      // Fallback: try to find what was extracted
      const items = await fs.promises.readdir(versionsDir);
      const candidate = items.find((i: string) => i.startsWith(`node-${version}`));
      if (candidate) {
        await fs.promises.rename(path.join(versionsDir, candidate), targetDir);
      } else {
        throw new Error('Extraction failed: folder not found');
      }
    }

    // 4. Cleanup
    fs.unlinkSync(tempFile);

    return { success: true };
  } catch (error: any) {
    console.error('Download failed:', error);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('node-manager:activate-version', async (_event, version: string) => {
  const versionsDir = getVersionsDir();
  const currentLink = path.join(versionsDir, 'current');

  // Search for the version path
  let targetPath = path.join(versionsDir, version);
  
  if (!fs.existsSync(targetPath)) {
    // Check NVM
    const nvmVersions = await getNvmVersions();
    const nvmCandidate = nvmVersions.find(v => v.version === version);
    if (nvmCandidate) {
      targetPath = nvmCandidate.path;
    } else {
      // Check System
      const systemVersion = await getSystemVersion();
      if (systemVersion && systemVersion.version === version) {
        targetPath = systemVersion.path;
      } else {
        return { success: false, message: 'Version not installed' };
      }
    }
  }

  try {
    // Remove existing link if it exists
    try {
      const stats = fs.lstatSync(currentLink);
      // If it exists (even as a broken link), remove it
      fs.unlinkSync(currentLink);
    } catch (e: any) {
      // Ignore ENOENT (file doesn't exist), rethrow others
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
    
    // Create symlink
    await fs.promises.symlink(targetPath, currentLink);

    // Auto-setup Env if needed
    const binPath = path.join(versionsDir, 'current', 'bin');
    const shell = process.env.SHELL || '/bin/bash';
    const profilePath = path.join(os.homedir(), shell.endsWith('zsh') ? '.zshrc' : '.bash_profile');
    
    // Update current process PATH so that subsequent checks (like get-local-versions)
    // see the change immediately without restarting the app
    if (process.env.PATH && !process.env.PATH.startsWith(binPath)) {
       process.env.PATH = `${binPath}${path.delimiter}${process.env.PATH}`;
    }

    try {
      let isConfigured = false;
      if (fs.existsSync(profilePath)) {
        const content = fs.readFileSync(profilePath, 'utf-8');
        isConfigured = content.includes(versionsDir);
      }

      if (!isConfigured) {
        const exportCmd = `\n# DevToolbox Node Manager\nexport PATH="${binPath}:$PATH"\n`;
        fs.appendFileSync(profilePath, exportCmd);
      }
    } catch (envError) {
      console.error('Auto-setup env failed:', envError);
      // Don't fail the activation if env setup fails
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Activation failed:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('node-manager:remove-version', async (_event, version: string) => {
  const versionsDir = getVersionsDir();
  const targetPath = path.join(versionsDir, version);
  const activeVersion = await getActiveVersion();

  if (activeVersion === version) {
    return { success: false, message: 'Cannot remove active version' };
  }

  try {
    if (fs.existsSync(targetPath)) {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
