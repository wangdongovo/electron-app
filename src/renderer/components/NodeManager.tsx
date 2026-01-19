import React, { useEffect, useMemo, useState } from 'react';
import { Box, Download, RefreshCw, Zap, Search, Terminal, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import NpmRegistryManager from './NpmRegistryManager';

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

interface NodeManagerApi {
  getLocalVersions: () => Promise<NodeVersionsResult>;
  getRemoteVersions: () => Promise<RemoteNodeVersion[]>;
  downloadVersion: (version: string) => Promise<{ success: boolean }>;
  activateVersion: (version: string) => Promise<{ success: boolean }>;
  setupShell: () => Promise<{ success: boolean; message: string }>;
}

declare global {
  interface Window {
    nodeManager: NodeManagerApi;
    nodeEnv: {
      checkStatus: () => Promise<{
        node: { installed: boolean; version: string | null };
        npm: { installed: boolean; version: string | null };
        platform: string;
        arch: string;
      }>;
    };
  }
}

const NodeManager: React.FC = () => {
  const [localVersions, setLocalVersions] = useState<LocalNodeVersion[]>([]);
  const [systemVersion, setSystemVersion] = useState<string | null>(null);
  const [systemPath, setSystemPath] = useState<string | null>(null);
  const [remoteVersions, setRemoteVersions] = useState<RemoteNodeVersion[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [busyVersion, setBusyVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shellSetupStatus, setShellSetupStatus] = useState<string | null>(null);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [nodeEnvStatus, setNodeEnvStatus] = useState<{
    node: { installed: boolean; version: string | null };
    npm: { installed: boolean; version: string | null };
    platform: string;
    arch: string;
  } | null>(null);
  const [envLoading, setEnvLoading] = useState(true);

  const activeVersion = useMemo(
    () => localVersions.find(v => v.active) || null,
    [localVersions],
  );

  const loadPackages = async () => {
    setPackagesLoading(true);
    setPackagesError(null);
    try {
      const list = await window.electron.getPackageManagers();
      setPackages(list);
    } catch (err: any) {
      setPackagesError(err?.message ?? '获取包管理器依赖信息失败');
    } finally {
      setPackagesLoading(false);
    }
  };

  const checkEnvStatus = async () => {
    setEnvLoading(true);
    try {
      const status = await window.nodeEnv.checkStatus();
      setNodeEnvStatus(status);
    } catch (err) {
      console.error('Failed to check env status:', err);
    } finally {
      setEnvLoading(false);
    }
  };

  const copyExportCommand = () => {
    if (!activeVersion) return;
    // Assuming the structure is .../node-versions/vX.X.X
    // And we want to add .../node-versions/current/bin to PATH
    const binPath = activeVersion.path.replace(activeVersion.version, 'current/bin');
    const cmd = `export PATH="${binPath}:$PATH"`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setupShell = async () => {
    try {
      const result = await window.nodeManager.setupShell();
      setShellSetupStatus(result.message);
      setTimeout(() => setShellSetupStatus(null), 3000);
    } catch (err: any) {
      setShellSetupStatus('Failed to setup shell: ' + err.message);
    }
  };

  const refreshLocal = async () => {
    setLoadingLocal(true);
    setError(null);
    try {
      const result = await window.nodeManager.getLocalVersions();
      setLocalVersions(result.versions);
      setSystemVersion(result.systemVersion);
      setSystemPath(result.systemPath);
    } catch (err: any) {
      setError(err?.message ?? '获取本地 Node 版本失败');
    } finally {
      setLoadingLocal(false);
    }
  };

  const refreshRemote = async () => {
    setLoadingRemote(true);
    setError(null);
    try {
      const versions = await window.nodeManager.getRemoteVersions();
      setRemoteVersions(versions);
    } catch (err: any) {
      setError(err?.message ?? '获取远程 Node 版本失败');
    } finally {
      setLoadingRemote(false);
    }
  };

  useEffect(() => {
    refreshLocal();
    refreshRemote();
    loadPackages();
    checkEnvStatus();
  }, []);

  const handleDownload = async (version: string) => {
    setBusyVersion(version);
    setError(null);
    try {
      await window.nodeManager.downloadVersion(version);
      await refreshLocal();
    } catch (err: any) {
      setError(err?.message ?? `下载版本 ${version} 失败`);
    } finally {
      setBusyVersion(null);
    }
  };

  const handleActivate = async (version: string) => {
    setBusyVersion(version);
    setError(null);
    try {
      await window.nodeManager.activateVersion(version);
      await refreshLocal();
    } catch (err: any) {
      setError(err?.message ?? `切换版本 ${version} 失败`);
    } finally {
      setBusyVersion(null);
    }
  };

  const formatDate = (value?: number | string) => {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isBusy = (version: string) => busyVersion === version;

  return (
    <div className="space-y-6 pb-12">
      {/* Node Environment Detection Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <ShieldCheck className="w-32 h-32 text-zinc-900" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${nodeEnvStatus?.node.installed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Node Environment Detect</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Global runtime availability status</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-center px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 min-w-[120px]">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Node.js</span>
                {envLoading ? (
                  <div className="h-5 w-12 bg-zinc-200 animate-pulse rounded"></div>
                ) : (
                  <span className={`text-sm font-mono font-bold ${nodeEnvStatus?.node.installed ? 'text-zinc-900' : 'text-rose-500'}`}>
                    {nodeEnvStatus?.node.installed ? nodeEnvStatus.node.version : 'Not Found'}
                  </span>
                )}
             </div>
             <div className="flex flex-col items-center px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 min-w-[120px]">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">NPM</span>
                {envLoading ? (
                  <div className="h-5 w-12 bg-zinc-200 animate-pulse rounded"></div>
                ) : (
                  <span className={`text-sm font-mono font-bold ${nodeEnvStatus?.npm.installed ? 'text-zinc-900' : 'text-rose-500'}`}>
                    {nodeEnvStatus?.npm.installed ? `v${nodeEnvStatus.npm.version}` : 'Not Found'}
                  </span>
                )}
             </div>
             <button 
                onClick={checkEnvStatus}
                className="p-3 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all shadow-sm group"
                title="Refresh Environment Status"
             >
                <RefreshCw className={`w-5 h-5 ${envLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
             </button>
          </div>
        </div>

        {!envLoading && !nodeEnvStatus?.node.installed && (
          <div className="mt-5 flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-800">Node.js is not detected on your system.</p>
              <p className="text-xs text-rose-600 mt-0.5">Please install Node.js to use full functionality of this toolbox. You can use the version manager below to install a managed version.</p>
            </div>
          </div>
        )}
      </div>

      {/* NPM Registry Manager */}
      <NpmRegistryManager />

      {/* System Status Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-zinc-100 rounded-lg">
            <Zap className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <div className="text-xs text-zinc-500">System Node Version</div>
            <div className="text-lg font-bold font-mono text-zinc-900">
              {systemVersion ? `v${systemVersion}` : 'Not Detected'}
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-200 mx-2"></div>
          <div>
            <div className="text-xs text-zinc-500">App Managed Active</div>
            <div className="text-lg font-bold font-mono text-emerald-600">
              {activeVersion ? activeVersion.version : 'None'}
            </div>
          </div>
        </div>
        {activeVersion && systemVersion && activeVersion.version !== `v${systemVersion}` && (
          <div className="flex flex-col gap-2 items-end">
             <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 max-w-md">
               <strong>Note:</strong> System version differs from App Managed version.
               <br/>
               Terminal uses: <code className="bg-amber-100 px-1 rounded">{systemPath || 'Unknown'}</code>
             </div>
             <div className="flex gap-2">
               <button
                 onClick={setupShell}
                 className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors"
               >
                 <Terminal className="w-3.5 h-3.5" />
                 Add to Shell Profile
               </button>
               <button
                 onClick={copyExportCommand}
                 className="flex items-center gap-1.5 text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-700 transition-colors"
               >
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                 {copied ? 'Copied!' : 'Copy PATH Export'}
               </button>
             </div>
             {shellSetupStatus && (
               <div className="text-xs text-zinc-500">{shellSetupStatus}</div>
             )}
          </div>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-900">Versions</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshRemote()}
              className="inline-flex items-center gap-1 rounded-md bg-amber-500 text-white px-3 py-1.5 text-xs hover:bg-amber-400"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Data Update
            </button>
            <button
              type="button"
              onClick={() => {
                refreshLocal();
                refreshRemote();
              }}
              className="inline-flex items-center gap-1 rounded-md bg-blue-500 text-white px-3 py-1.5 text-xs hover:bg-blue-400"
            >
              Page Reload
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-3 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-3 py-2 text-xs">
            {error}
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter Version"
              className="pl-9 pr-3 py-1.5 rounded-md bg-white border border-zinc-300 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>
          <div className="text-[11px] text-zinc-500">
            {loadingRemote ? 'Loading remote…' : `Total ${remoteVersions.length}`}
          </div>
        </div>
        <div className="mt-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-2">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-200">
                <th className="text-left font-medium py-2">Version</th>
                <th className="text-left font-medium py-2">V8 Version</th>
                <th className="text-left font-medium py-2">NPM Version</th>
                <th className="text-left font-medium py-2">Release Date</th>
                <th className="text-left font-medium py-2">Status</th>
                <th className="text-right font-medium py-2">Operation</th>
              </tr>
            </thead>
            <tbody>
              {remoteVersions
                .filter(v => v.version.toLowerCase().includes(filter.toLowerCase()))
                .map(v => {
                  const local = localVersions.find(l => l.version === v.version);
                  const installed = Boolean(local);
                  return (
                    <tr key={v.version} className="border-t border-zinc-100">
                      <td className="py-2 text-zinc-900 font-mono">{v.version}</td>
                      <td className="py-2 text-zinc-700">{v.v8 ?? '-'}</td>
                      <td className="py-2 text-zinc-700">{v.npm ?? '-'}</td>
                      <td className="py-2 text-zinc-600">{v.date}</td>
                      <td className="py-2">
                        {installed ? (
                          local?.active ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">
                              In Use
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200">
                              Downloaded
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 text-zinc-500 px-2 py-0.5 border border-zinc-200">
                            Not Installed
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {installed ? (
                          local?.active ? (
                            <span className="text-emerald-600 text-xs px-2">In Use</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(v.version)}
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 text-zinc-700 px-2 py-0.5 hover:bg-zinc-100 text-xs"
                            >
                              Switch
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy(v.version)}
                            onClick={() => handleDownload(v.version)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500 text-emerald-600 px-2 py-0.5 hover:bg-emerald-50 disabled:opacity-60 text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Install
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NodeManager;
