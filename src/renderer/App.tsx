import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/styles/index.css';
import ImageCompressor from '@/components/ImageCompressor';
import Sidebar from '@/components/layout/Sidebar';
import GitInfo from '@/components/GitInfo';
import NodeManager from '@/components/NodeManager';
import DateManager from '@/components/DateManager';
import EnvDetection from '@/components/EnvDetection';

const App: React.FC = () => {
  const sidebarItems = useMemo(() => [
    { to: '/env-detection', label: '环境检测' },
    { to: '/date', label: '日期管理' },
    { to: '/compressor', label: '图片压缩' },
    { to: '/git', label: 'Git 账号' },
    { to: '/node-manager', label: 'Node 管理器' },
  ], []);

  return (
    <HashRouter>
      <div className="flex h-screen w-full overflow-hidden font-sans bg-zinc-50 text-zinc-900 selection:bg-indigo-500/30">
        <Sidebar items={sidebarItems} />

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <main className="p-8 space-y-8">
            <Routes>
              <Route path="/" element={<Navigate to="/env-detection" replace />} />
              <Route path="/env-detection" element={<EnvDetection />} />
              <Route path="/date" element={<DateManager />} />
              <Route path="/compressor" element={<ImageCompressor />} />
              <Route path="/git" element={<GitInfo />} />
              <Route path="/node-manager" element={<NodeManager />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};



const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
