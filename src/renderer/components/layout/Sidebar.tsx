import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarItem {
  to: string;
  label: string;
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  return (
    <div className="w-64 border-r border-zinc-200 bg-white flex flex-none flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-br from-zinc-900 to-zinc-500 bg-clip-text text-transparent italic tracking-tight">
          
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-sm font-medium ${
                isActive
                  ? 'nav-active-glow'
                  : 'bg-white text-zinc-700 border-white hover:bg-zinc-50'
              }`
            }
          >
            <div className="w-1.5 h-1.5 rounded-full" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
