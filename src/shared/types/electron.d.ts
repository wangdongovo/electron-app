export {};

declare global {
  interface GitKeyValue {
    key: string;
    value: string;
  }

  interface GitInfoData {
    user: {
      name?: string;
      email?: string;
      signingkey?: string;
    };
    global: GitKeyValue[];
    system: GitKeyValue[];
  }

  interface SystemInfo {
    cpu: {
      manufacturer: string;
      brand: string;
      cores: number;
      speed: string;
    };
    mem: {
      total: number;
      used: number;
      free: number;
    };
    os: {
      distro: string;
      release: string;
      arch: string;
    };
    disk: Array<{
      name?: string;
      type?: string;
      interfaceType?: string;
    }>;
    battery: {
      hasBattery: boolean;
      percent: number;
      isCharging: boolean;
      cycleCount: number;
    };
    system: {
      manufacturer?: string;
      model?: string;
      serial?: string;
    };
    graphics: {
      controllers: Array<{
        model?: string;
        vram?: number;
      }>;
      displays: Array<{
        model?: string;
        resolutionX?: number;
        resolutionY?: number;
      }>;
    };
    user: {
      username: string;
      hostname: string;
      homedir: string;
      shell?: string;
    };
    network: {
      defaultInterface?: string;
      interfaces: Array<{
        iface: string;
        ip4?: string;
        ip6?: string;
        mac?: string;
        type?: string;
        speed?: number;
        internal?: boolean;
      }>;
    };
  }

  interface AppMemoryInfo {
    name: string;
    mem: number;
    cpu: number;
    processCount: number;
    icon?: string;
    path?: string;
    isSystemApp?: boolean;
  }

  interface LocalNodeVersion {
    version: string;
    path: string;
    active: boolean;
    installedAt?: number;
  }

  interface RemoteNodeVersion {
    version: string;
    lts: boolean | string;
    date: string;
    v8?: string;
    npm?: string;
  }

  interface NodeVersionsResult {
  versions: LocalNodeVersion[];
  systemVersion: string | null;
  systemPath: string | null;
}

  type PackageManagerName = 'npm' | 'pnpm';

  interface PackageInfo {
    name: string;
    version: string;
    description?: string;
    homepage?: string;
    path?: string;
    author?: string;
  }

  interface PackageManagerPackagesResult {
    manager: PackageManagerName;
    global: PackageInfo[];
    local: PackageInfo[];
  }

  interface Window {
    electron: {
      getSystemInfo: () => Promise<SystemInfo>;
      getProcessInfo: () => Promise<any[]>;
      getAppMemoryInfo: () => Promise<AppMemoryInfo[]>;
      uninstallApp: (path: string) => Promise<{ success: boolean; message?: string }>;
      getGitInfo: () => Promise<GitInfoData>;
      getPackageManagers: () => Promise<PackageManagerPackagesResult[]>;
    };
    nodeManager: {
      getLocalVersions: () => Promise<NodeVersionsResult>;
      getRemoteVersions: () => Promise<RemoteNodeVersion[]>;
      downloadVersion: (version: string) => Promise<{ success: boolean }>;
      activateVersion: (version: string) => Promise<{ success: boolean }>;
      setupShell: () => Promise<{ success: boolean; message: string }>;
    };
  }
}
