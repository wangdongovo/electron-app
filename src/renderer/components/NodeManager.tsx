
import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Download, 
  Check, 
  Trash2, 
  Loader2, 
  Server, 
  HardDrive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface LocalVersion {
  version: string;
  path: string;
  active: boolean;
  installedAt?: number;
  source: 'local' | 'nvm' | 'system';
}

interface RemoteVersion {
  version: string;
  date: string;
  lts: boolean | string;
  files: string[];
}

const NodeManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local');
  const [localVersions, setLocalVersions] = useState<LocalVersion[]>([]);
  const [remoteVersions, setRemoteVersions] = useState<RemoteVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState<{ isConfigured: boolean; shellConfigFile: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination for remote versions
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchLocalVersions();
    checkEnvStatus();
    if (activeTab === 'remote' && remoteVersions.length === 0) {
      fetchRemoteVersions();
    }
  }, [activeTab]);

  const checkEnvStatus = async () => {
    try {
      const status = await window.nodeManager.checkEnvStatus();
      setEnvStatus(status);
    } catch (error) {
      console.error('Failed to check env status', error);
    }
  };

  const handleSetupEnv = async () => {
    try {
      const result = await window.nodeManager.setupEnv();
      if (result.success) {
        await checkEnvStatus();
        alert('Configuration added! Please restart your terminal or run "source ~/.zshrc" (or your shell profile) to apply changes.');
      } else {
        alert(`Setup failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Setup env error', error);
    }
  };

  const fetchLocalVersions = async () => {
    try {
      const result = await window.nodeManager.getLocalVersions();
      setLocalVersions(result.versions);
      setCurrentVersion(result.currentVersion);
    } catch (error) {
      console.error('Failed to fetch local versions', error);
    }
  };

  const fetchRemoteVersions = async () => {
    setLoading(true);
    try {
      const versions = await window.nodeManager.getRemoteVersions();
      setRemoteVersions(versions);
    } catch (error) {
      console.error('Failed to fetch remote versions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (version: string) => {
    setDownloading(version);
    try {
      const result = await window.nodeManager.downloadVersion(version);
      if (result.success) {
        await fetchLocalVersions();
      } else {
        alert(`Download failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Download error', error);
    } finally {
      setDownloading(null);
    }
  };

  const handleActivate = async (version: string) => {
    setActivating(version);
    try {
      const result = await window.nodeManager.activateVersion(version);
      if (result.success) {
        await fetchLocalVersions();
      } else {
        alert(`Activation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Activation error', error);
    } finally {
      setActivating(null);
    }
  };

  const handleRemove = async (version: string) => {
    if (!confirm(`Are you sure you want to remove Node.js ${version}?`)) return;
    try {
      const result = await window.nodeManager.removeVersion(version);
      if (result.success) {
        await fetchLocalVersions();
      } else {
        alert(`Removal failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Removal error', error);
    }
  };

  const isInstalled = (version: string) => {
    return localVersions.some(v => v.version === version);
  };

  const activeLocalVersion = useMemo(() => localVersions.find(v => v.active), [localVersions]);

  const displayedLocalVersions = useMemo(() => {
    // Deduplicate local versions: prefer active, then 'local' source, then others
    const uniqueMap = new Map<string, LocalVersion>();
    
    localVersions.forEach(v => {
      if (!uniqueMap.has(v.version)) {
        uniqueMap.set(v.version, v);
      } else {
        const existing = uniqueMap.get(v.version)!;
        // If current is active, replace existing
        if (v.active) {
          uniqueMap.set(v.version, v);
        }
        // If existing is not active and current is 'local', replace existing (prefer local source for deletion)
        else if (!existing.active && v.source === 'local') {
          uniqueMap.set(v.version, v);
        }
      }
    });

    const filtered = Array.from(uniqueMap.values()).filter(v => 
      v.version.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Sort: Active first, then by version desc
    return filtered.sort((a, b) => {
      if (a.active) return -1;
      if (b.active) return 1;
      return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [localVersions, searchQuery]);

  const displayedVersions = useMemo(() => {
    let remoteList = remoteVersions;
    
    if (searchQuery) {
      remoteList = remoteVersions.filter(v => 
        v.version.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (!activeLocalVersion) return remoteList;
    
    const isActiveInRemote = remoteList.some(v => v.version === activeLocalVersion.version);
    if (isActiveInRemote) return remoteList;

    const activeAsRemote: RemoteVersion = {
      version: activeLocalVersion.version,
      date: activeLocalVersion.installedAt ? new Date(activeLocalVersion.installedAt).toISOString().split('T')[0] : '-',
      lts: false,
      files: []
    };

    // If search query is present, only add active version if it matches
    if (searchQuery && !activeAsRemote.version.toLowerCase().includes(searchQuery.toLowerCase())) {
      return remoteList;
    }

    return [activeAsRemote, ...remoteList];
  }, [remoteVersions, activeLocalVersion, searchQuery]);

  const paginatedRemoteVersions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedVersions.slice(start, start + pageSize);
  }, [displayedVersions, currentPage]);

  const totalPages = Math.ceil(displayedVersions.length / pageSize);

  const renderStatus = (version: string, isActive: boolean, installed: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
          <Check size={12} /> Active
        </Badge>
      );
    }
    if (installed) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
          Installed
        </Badge>
      );
    }
    return <span className="text-zinc-400 text-sm">Not Installed</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Node Manager</h1>
            {envStatus && !envStatus.isConfigured && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSetupEnv}
                className="h-6 px-2 text-xs"
              >
                <AlertTriangle size={12} className="mr-1" />
                Setup Env
              </Button>
            )}
          </div>
          <p className="text-zinc-500 mt-1">Manage your local and remote Node.js versions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
             <input
              type="text"
              placeholder="Search version..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10 w-48 transition-all"
            />
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'local' 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <HardDrive size={16} />
              Local Versions
            </div>
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'remote' 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Server size={16} />
              Remote Versions
            </div>
          </button>
        </div>
      </div>
    </div>

    <Card className="border-zinc-200/60 shadow-xl shadow-zinc-200/20 overflow-hidden rounded-[24px]">
      <Table>
        <TableHeader className="bg-zinc-50/50 border-none">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-8 py-5 font-bold text-zinc-400 uppercase text-[11px] tracking-widest">Version</TableHead>
            <TableHead className="py-5 font-bold text-zinc-400 uppercase text-[11px] tracking-widest">Type</TableHead>
            <TableHead className="py-5 font-bold text-zinc-400 uppercase text-[11px] tracking-widest">Release Date</TableHead>
            <TableHead className="py-5 font-bold text-zinc-400 uppercase text-[11px] tracking-widest">Status</TableHead>
            <TableHead className="py-5 pr-8 text-right font-bold text-zinc-400 uppercase text-[11px] tracking-widest">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeTab === 'local' ? (
            displayedLocalVersions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                  {searchQuery ? 'No local versions match your search.' : 'No local versions found. Switch to Remote tab to download one.'}
                </TableCell>
              </TableRow>
            ) : (
              displayedLocalVersions.map((v) => (
                <TableRow key={v.version} className="group hover:bg-zinc-50/30">
                  <TableCell className="pl-8 py-4 font-mono font-medium text-zinc-700">{v.version}</TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="text-zinc-500 border-zinc-200 uppercase">{v.source}</Badge>
                  </TableCell>
                  <TableCell className="py-4 text-zinc-500">
                    {v.installedAt ? new Date(v.installedAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="py-4">
                    {renderStatus(v.version, v.active, true)}
                  </TableCell>
                  <TableCell className="py-4 pr-8 text-right">
                    <div className="flex justify-end gap-2">
                      {!v.active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivate(v.version)}
                          disabled={!!activating}
                          className="h-8 text-xs"
                        >
                          {activating === v.version ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Use'}
                        </Button>
                      )}
                      {!v.active && v.source !== 'system' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(v.version)}
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )
          ) : (
              loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      Loading versions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRemoteVersions.map((v) => {
                  const installed = isInstalled(v.version);
                  const active = currentVersion === v.version;
                  
                  return (
                    <TableRow key={v.version} className="group hover:bg-zinc-50/30">
                      <TableCell className="pl-8 py-4 font-mono font-medium text-zinc-700">{v.version}</TableCell>
                      <TableCell className="py-4">
                        {v.lts ? (
                          <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200">LTS</Badge>
                        ) : (
                          <Badge variant="outline" className="text-zinc-500">Current</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-zinc-500">{v.date}</TableCell>
                      <TableCell className="py-4">
                        {renderStatus(v.version, active, installed)}
                      </TableCell>
                      <TableCell className="py-4 pr-8 text-right">
                        {installed ? (
                          active ? (
                            <Button size="sm" variant="outline" disabled className="h-8 text-xs opacity-50">
                              Active
                            </Button>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivate(v.version)}
                                disabled={!!activating}
                                className="h-8 text-xs"
                              >
                                {activating === v.version ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Use'}
                              </Button>
                              {localVersions.find(lv => lv.version === v.version)?.source !== 'system' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemove(v.version)}
                                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800"
                            onClick={() => handleDownload(v.version)}
                            disabled={!!downloading}
                          >
                            {downloading === v.version ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Installing
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                Install
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )
            )}
          </TableBody>
        </Table>
        
        {activeTab === 'remote' && !loading && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-zinc-100 bg-zinc-50/30">
            <span className="text-sm text-zinc-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, displayedVersions.length)} of {displayedVersions.length} versions
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NodeManager;
