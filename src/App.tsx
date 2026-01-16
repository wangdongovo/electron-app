import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import UserListContent from './components/UserListContent';

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-white/50">
          <UserListContent />
        </main>
      </div>
    </div>
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