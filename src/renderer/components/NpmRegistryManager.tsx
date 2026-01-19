import React, { useEffect, useState } from 'react';
import { Globe, Plus, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';

interface Registry {
  name: string;
  url: string;
}

interface RegistryListResult {
  registries: Registry[];
  current: string;
}

declare global {
  interface Window {
    npmRegistryManager: {
      list: () => Promise<RegistryListResult>;
      add: (registry: Registry) => Promise<{ success: boolean }>;
      delete: (url: string) => Promise<{ success: boolean }>;
      set: (url: string) => Promise<{ success: boolean; message?: string }>;
    };
  }
}

const NpmRegistryManager: React.FC = () => {
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [currentRegistry, setCurrentRegistry] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRegistries = async () => {
    setLoading(true);
    try {
      const result = await window.npmRegistryManager.list();
      setRegistries(result.registries);
      setCurrentRegistry(result.current);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch registries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistries();
  }, []);

  const handleSetRegistry = async (url: string) => {
    setActionLoading(url);
    try {
      const result = await window.npmRegistryManager.set(url);
      if (result.success) {
        setCurrentRegistry(url);
      } else {
        setError(result.message || 'Failed to set registry');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update registry');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRegistry = async (url: string) => {
    if (!window.confirm('Are you sure you want to delete this registry?')) return;
    setActionLoading(url);
    try {
      await window.npmRegistryManager.delete(url);
      await fetchRegistries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete registry');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;
    setLoading(true);
    try {
      await window.npmRegistryManager.add({ name: newName, url: newUrl });
      setNewName('');
      setNewUrl('');
      setShowAddForm(false);
      await fetchRegistries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add registry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-50 rounded-xl">
            <Globe className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">NPM Registry Manager</h2>
            <p className="text-sm text-zinc-500">Switch and manage your npm sources</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <Plus className={`w-6 h-6 text-zinc-600 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddRegistry} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Registry Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. My Private Registry"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Registry URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all text-sm"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Add Registry
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
          </div>
        ) : (
          registries.map((registry: Registry) => {
            const isActive = currentRegistry.startsWith(registry.url) || registry.url.startsWith(currentRegistry);
            const isDefault = ['npm', 'taobao', 'tencent', 'cnpm'].includes(registry.name);

            return (
              <div
                key={registry.url}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-zinc-50 border-zinc-300 shadow-sm ring-1 ring-zinc-200'
                    : 'bg-white border-zinc-100 hover:border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white shadow-sm' : 'bg-zinc-50'}`}>
                    <Globe className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900">{registry.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 font-mono mt-0.5 block">{registry.url}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => handleSetRegistry(registry.url)}
                      disabled={actionLoading !== null}
                      className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === registry.url ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mx-2" />
                      ) : (
                        'Use This'
                      )}
                    </button>
                  )}
                  {!isDefault && (
                    <button
                      onClick={() => handleDeleteRegistry(registry.url)}
                      disabled={actionLoading !== null}
                      className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {isActive && <Check className="w-5 h-5 text-emerald-500 mr-2" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NpmRegistryManager;
