import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@/index.css';
import DeviceInfo from './components/DeviceInfo';

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
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-sm font-medium bg-indigo-50 text-indigo-600 border-indigo-200">
              <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)] bg-indigo-600" />
              设备监控台
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <main className="p-8 space-y-8">
            <DeviceInfo showProcessList />
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
