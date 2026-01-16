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
  }

  interface AppMemoryInfo {
    name: string;
    mem: number;
    cpu: number;
    processCount: number;
    icon?: string;
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

  interface Window {
    electron: {
      getSystemInfo: () => Promise<SystemInfo>;
      getProcessInfo: () => Promise<any[]>;
      getAppMemoryInfo: () => Promise<AppMemoryInfo[]>;
      getGitInfo: () => Promise<GitInfoData>;
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
