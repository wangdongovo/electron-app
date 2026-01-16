import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/index.css';
import DeviceInfo from '@/components/DeviceInfo';
import ImageCompressor from '@/components/ImageCompressor';
import Sidebar from '@/components/layout/Sidebar';
import GitInfo from '@/components/GitInfo';
import NodeManager from '@/components/NodeManager';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen w-full overflow-hidden font-sans bg-zinc-50 text-zinc-900 selection:bg-indigo-500/30">
        <Sidebar
          items={[
            { to: '/device', label: '设备监控台' },
            { to: '/compressor', label: '图片压缩' },
            { to: '/git', label: 'Git 账号' },
            { to: '/node-manager', label: 'Node 管理器' },
          ]}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <main className="p-8 space-y-8">
            <Routes>
              <Route path="/" element={<Navigate to="/device" replace />} />
              <Route path="/device" element={<DeviceInfo showProcessList />} />
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
