import React, { useEffect, useState } from 'react';
import { LayoutList, Search } from 'lucide-react';

interface AppMemoryInfo {
  name: string;
  mem: number;
  cpu: number;
  processCount: number;
  icon?: string;
}

const ProcessList: React.FC<{ totalMem: number }> = ({ totalMem }) => {
  const [apps, setApps] = useState<AppMemoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const data = await (window as any).electron.getAppMemoryInfo();
        setApps(data);
      } catch (error) {
        console.error('Error fetching processes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024;
    if (mb > 1024) return (mb / 1024).toFixed(2) + ' GB';
    return mb.toFixed(2) + ' MB';
  };

  const filteredApps = apps.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const getColorClass = (name: string) => {
    const palette = [
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-sky-500',
      'bg-violet-500',
    ];
    const index = name.charCodeAt(0) % palette.length;
    return palette[index];
  };

  return (
    <div className="bg-zinc-100/80 border border-zinc-200 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
          <LayoutList className="w-5 h-5 text-indigo-400" />
          应用内存占比
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
            type="text" 
            placeholder="搜索应用..."
            className="pl-9 pr-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-900 transition-all w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((a, i) => (
            <div key={`${a.name}-${i}`} className="group p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-zinc-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  {a.icon && a.icon.length > 0 ? (
                    <img
                      src={a.icon}
                      alt={a.name}
                      className="w-8 h-8 rounded-xl shadow-md bg-zinc-200 object-contain"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold text-white shadow-md ${getColorClass(a.name)}`}>
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-zinc-900 truncate max-w-[150px]">
                      {a.name}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      进程数: {a.processCount}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-500 whitespace-nowrap">
                  {formatBytes(a.mem * 1024)}
                </span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${Math.min(((a.mem * 1024) / totalMem) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="mt-1 flex justify-end">
                <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                  占比: {(((a.mem * 1024) / totalMem) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-zinc-500 text-sm italic">
            未找到匹配的进程
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessList;
