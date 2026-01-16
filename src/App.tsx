import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/index.css';


const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden font-sans">
        <div className="flex-1 overflow-y-auto bg-white/50">
        文件压缩
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