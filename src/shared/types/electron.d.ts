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
    source: 'local' | 'nvm' | 'system';
  }

  interface RemoteNodeVersion {
    version: string;
    date: string;
    files: string[];
    npm?: string;
    v8?: string;
    uv?: string;
    zlib?: string;
    openssl?: string;
    modules?: string;
    lts: boolean | string;
    security?: boolean;
  }

  interface NodeVersionsResult {
    versions: LocalNodeVersion[];
    currentVersion: string | null;
  }

  interface Window {
    electron: {
      getSystemInfo: () => Promise<SystemInfo>;
      getProcessInfo: () => Promise<any[]>;
      getAppMemoryInfo: () => Promise<AppMemoryInfo[]>;
      uninstallApp: (path: string) => Promise<{ success: boolean; message?: string }>;
      getGitInfo: () => Promise<GitInfoData>;
    };
    nodeManager: {
      getLocalVersions: () => Promise<NodeVersionsResult>;
      getRemoteVersions: () => Promise<RemoteNodeVersion[]>;
      downloadVersion: (version: string) => Promise<{ success: boolean; message?: string }>;
      activateVersion: (version: string) => Promise<{ success: boolean; message?: string }>;
      removeVersion: (version: string) => Promise<{ success: boolean; message?: string }>;
      checkEnvStatus: () => Promise<{ isConfigured: boolean; expectedPath: string; shellConfigFile: string }>;
      setupEnv: () => Promise<{ success: boolean; message?: string }>;
    };
  }
}
