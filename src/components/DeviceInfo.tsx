import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, Laptop, Activity, Battery, Info, Network, Monitor, User } from 'lucide-react';


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
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const mainDisk = info.disk[0];
  const mainGpu = info.graphics.controllers[0];
  const display = info.graphics.displays[0];
  const activeNet =
    info.network.interfaces.find(n => !n.internal && n.ip4) ||
    info.network.interfaces[0];

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-40 h-24 rounded-2xl bg-gradient-to-br from-sky-200 to-sky-400 flex items-center justify-center">
            <Laptop className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-xs text-zinc-500">关于本机</div>
          <div className="text-2xl font-semibold text-zinc-900">
            {info.user.hostname}
          </div>
          <div className="text-sm text-zinc-600">
            {info.system.manufacturer} {info.system.model}
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-600">
            <div>
              <div className="text-[11px] text-zinc-400">处理器</div>
              <div className="font-medium">
                {info.cpu.brand}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">内存</div>
              <div className="font-medium">
                {formatBytes(info.mem.total)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">图形卡</div>
              <div className="font-medium truncate">
                {mainGpu?.model || '未知'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">系统版本</div>
              <div className="font-medium">
                {info.os.distro} {info.os.release}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-zinc-900">本机账号</h3>
          </div>
          <div className="space-y-2 text-xs text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-400">用户名</span>
              <span className="font-mono text-zinc-800">{info.user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">主目录</span>
              <span className="font-mono text-zinc-800 truncate max-w-[180px]">
                {info.user.homedir}
              </span>
            </div>
            {info.user.shell && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Shell</span>
                <span className="font-mono text-zinc-800 truncate max-w-[180px]">
                  {info.user.shell}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-900">处理器与内存</h3>
          </div>
          <div className="space-y-2 text-xs text-zinc-600">
            <div className="font-medium text-sm text-zinc-900">
              {info.cpu.manufacturer} {info.cpu.brand}
            </div>
            <div>核心数：{info.cpu.cores} | 主频：{info.cpu.speed} GHz</div>
            <div>内存总量：{formatBytes(info.mem.total)}</div>
            <div className="mt-2">
              <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${(info.mem.used / info.mem.total) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 flex justify-between">
                <span>已用 {formatBytes(info.mem.used)}</span>
                <span>可用 {formatBytes(info.mem.free)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-900">存储与硬件</h3>
          </div>
          <div className="space-y-2 text-xs text-zinc-600">
            <div>
              <div className="text-[11px] text-zinc-400">主硬盘</div>
              <div className="font-medium text-sm text-zinc-900">
                {mainDisk?.name || '未知磁盘'}
              </div>
              <div className="text-[11px] text-zinc-500">
                类型：{mainDisk?.type || '-'} | 接口：{mainDisk?.interfaceType || '-'}
              </div>
            </div>
            <div className="pt-1">
              <div className="text-[11px] text-zinc-400">序列号</div>
              <div className="font-mono text-xs text-zinc-800">
                {info.system.serial || '不可用'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-semibold text-zinc-900">显示与图形</h3>
          </div>
          <div className="space-y-2 text-xs text-zinc-600">
            <div>
              <div className="text-[11px] text-zinc-400">图形卡</div>
              <div className="font-medium text-sm text-zinc-900">
                {mainGpu?.model || '未知图形卡'}
              </div>
            </div>
            {display && (
              <div>
                <div className="text-[11px] text-zinc-400">主显示器</div>
                <div className="font-medium text-sm text-zinc-900">
                  {display.model || '内置显示器'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  分辨率：{display.resolutionX} × {display.resolutionY}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-zinc-900">网络信息</h3>
          </div>
          <div className="space-y-2 text-xs text-zinc-600">
            {activeNet ? (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-400">接口</span>
                  <span className="font-mono text-zinc-800">{activeNet.iface}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">IPv4</span>
                  <span className="font-mono text-zinc-800">{activeNet.ip4 || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">MAC</span>
                  <span className="font-mono text-zinc-800">{activeNet.mac || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">类型</span>
                  <span className="text-zinc-800">
                    {activeNet.type || '-'} {activeNet.internal ? '(内置)' : ''}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-zinc-500">未检测到有效网络接口</div>
            )}
          </div>
        </div>

        {info.battery.hasBattery && (
          <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Battery className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-semibold text-zinc-900">电池信息</h3>
            </div>
            <div className="space-y-2 text-xs text-zinc-600">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">电量</span>
                <span className="font-medium text-zinc-900">{info.battery.percent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">状态</span>
                <span className="text-zinc-900">
                  {info.battery.isCharging ? '正在充电' : '放电中'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">循环次数</span>
                <span className="text-zinc-900">{info.battery.cycleCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default DeviceInfo;
