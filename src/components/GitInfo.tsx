import React, { useEffect, useState } from 'react';
import { GitBranch, User, List } from 'lucide-react';

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

declare global {
  interface Window {
    electron: {
      getGitInfo: () => Promise<GitInfoData>;
    };
  }
}

const GitInfo: React.FC = () => {
  const [data, setData] = useState<GitInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGit = async () => {
      try {
        const info = await window.electron.getGitInfo();
        setData(info);
      } catch (err: any) {
        setError(err?.message ?? '无法获取 Git 信息');
      } finally {
        setLoading(false);
      }
    };
    fetchGit();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-xl p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-zinc-500">
        无数据
      </div>
    );
  }

  const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white/80 border border-zinc-200 p-5 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-indigo-400" />
          Git 账号信息
        </h2>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20">
          来自本机配置
        </span>
      </div>

      <SectionCard
        title="用户信息"
        icon={<User className="w-5 h-5 text-indigo-400" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-zinc-200 rounded-xl p-4 bg-white">
            <div className="text-xs text-zinc-500 mb-1">user.name</div>
            <div className="text-sm font-medium">{data.user.name ?? '未配置'}</div>
          </div>
          <div className="border border-zinc-200 rounded-xl p-4 bg-white">
            <div className="text-xs text-zinc-500 mb-1">user.email</div>
            <div className="text-sm font-medium">{data.user.email ?? '未配置'}</div>
          </div>
          <div className="border border-zinc-200 rounded-xl p-4 bg-white">
            <div className="text-xs text-zinc-500 mb-1">user.signingkey</div>
            <div className="text-sm font-medium">{data.user.signingkey ?? '未配置'}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="全局配置 (~/.gitconfig)"
        icon={<List className="w-5 h-5 text-indigo-400" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.global.length === 0 ? (
            <div className="text-sm text-zinc-500">无</div>
          ) : (
            data.global.map((kv, idx) => (
              <div key={`${kv.key}-${idx}`} className="border border-zinc-200 rounded-xl p-3 bg-white">
                <div className="text-xs text-zinc-500">{kv.key}</div>
                <div className="text-sm font-medium text-zinc-900">{kv.value}</div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="系统配置 (/etc/gitconfig)"
        icon={<List className="w-5 h-5 text-indigo-400" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.system.length === 0 ? (
            <div className="text-sm text-zinc-500">无</div>
          ) : (
            data.system.map((kv, idx) => (
              <div key={`${kv.key}-${idx}`} className="border border-zinc-200 rounded-xl p-3 bg-white">
                <div className="text-xs text-zinc-500">{kv.key}</div>
                <div className="text-sm font-medium text-zinc-900">{kv.value}</div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default GitInfo;

