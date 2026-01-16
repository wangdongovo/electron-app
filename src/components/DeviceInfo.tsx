import React, { useEffect, useState } from 'react';
 
import { Cpu, HardDrive, Laptop, Activity, Battery, Info } from 'lucide-react';

import ProcessList from './ProcessList';

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

declare global {
  interface Window {
    electron: {
      getSystemInfo: () => Promise<SystemInfo>;
      getProcessInfo: () => Promise<any[]>;
      getAppMemoryInfo: () => Promise<{ name: string; mem: number; cpu: number; processCount: number; icon?: string }[]>;
    };
  }
}

interface DeviceInfoProps {
  showProcessList?: boolean;
}

const DeviceInfo: React.FC<DeviceInfoProps> = ({ showProcessList }) => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await window.electron.getSystemInfo();
        setInfo(data);
      } catch (error) {
        console.error('Error fetching system info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <Info className="w-12 h-12 mb-4 opacity-20" />
        <p>无法获取设备信息</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Laptop className="w-6 h-6 text-indigo-400" />
          设备概览
        </h2>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20">
          实时数据
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl hover:border-indigo-500/30 transition-colors group shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <Activity className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">处理器 (CPU)</h3>
          <p className="text-lg font-semibold truncate">{info.cpu.manufacturer} {info.cpu.brand}</p>
          <div className="mt-2 text-xs text-zinc-500">
            核心数: {info.cpu.cores} | 基础频率: {info.cpu.speed}GHz
          </div>
        </div>

        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl hover:border-emerald-500/30 transition-colors group shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">内存 (RAM)</h3>
          <p className="text-lg font-semibold">{formatBytes(info.mem.total)}</p>
          <div className="mt-2 w-full bg-zinc-800 rounded-full h-1">
            <div 
              className="bg-emerald-500 h-1 rounded-full transition-all duration-1000" 
              style={{ width: `${(info.mem.used / info.mem.total) * 100}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            已使用: {formatBytes(info.mem.used)} | 可用: {formatBytes(info.mem.free)}
          </div>
        </div>

        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl hover:border-amber-500/30 transition-colors group shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">存储设备</h3>
          <p className="text-lg font-semibold">{info.disk[0]?.name || '未知磁盘'}</p>
          <div className="mt-2 text-xs text-zinc-500">
            类型: {info.disk[0]?.type} | 接口: {info.disk[0]?.interfaceType}
          </div>
        </div>

        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl hover:border-sky-500/30 transition-colors group shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-sky-500/10 rounded-lg group-hover:bg-sky-500/20 transition-colors">
              <Info className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">操作系统</h3>
          <p className="text-lg font-semibold">{info.os.distro}</p>
          <div className="mt-2 text-xs text-zinc-500">
            版本: {info.os.release} | 架构: {info.os.arch}
          </div>
        </div>

        {info.battery.hasBattery && (
          <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl hover:border-rose-500/30 transition-colors group shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                <Battery className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-zinc-400 mb-1">电池状态</h3>
            <p className="text-lg font-semibold">{info.battery.percent}%</p>
            <div className="mt-2 text-xs text-zinc-500">
              {info.battery.isCharging ? '正在充电' : '放电中'} | 循环: {info.battery.cycleCount}
            </div>
          </div>
        )}
      </div>
      {showProcessList && (
        <div className="mt-6">
          <ProcessList totalMem={info.mem.total} />
        </div>
      )}
    </div>
  );
};

export default DeviceInfo;
