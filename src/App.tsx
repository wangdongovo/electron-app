import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import '@/index.css';
import DeviceInfo from '@/components/DeviceInfo';
import ImageCompressor from '@/components/ImageCompressor';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen w-full overflow-hidden font-sans bg-zinc-50 text-zinc-900 selection:bg-indigo-500/30">
        
        <div className="w-64 border-r border-zinc-200 bg-white flex flex-none flex-col">
          <div className="p-6">
            <h1 className="text-xl font-bold bg-gradient-to-br from-zinc-900 to-zinc-500 bg-clip-text text-transparent italic tracking-tight">
              SystemDash
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            <NavLink
              to="/device"
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-[0_0_8px_rgba(129,140,248,0.8)]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`
              }
            >
              <div className="w-1.5 h-1.5 rounded-ful" />
              设备监控台
            </NavLink>
            <NavLink
              to="/compressor"
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-[0_0_8px_rgba(129,140,248,0.8)]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`
              }
            >
              <div className="w-1.5 h-1.5 rounded-full" />
              图片压缩
            </NavLink>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <main className="p-8 space-y-8">
            <Routes>
              <Route path="/" element={<Navigate to="/device" replace />} />
              <Route path="/device" element={<DeviceInfo showProcessList />} />
              <Route path="/compressor" element={<ImageCompressor />} />
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
