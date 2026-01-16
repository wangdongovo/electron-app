import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  LayoutGrid, 
  MessageSquare, 
  Users, 
  Lock, 
  ShieldAlert, 
  Settings, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  badge?: string | number;
  active?: boolean;
  hasSub?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, badge, active, hasSub, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
      active ? "bg-slate-200 text-foreground font-medium" : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
    )}>
    <div className="flex items-center gap-3">
      <Icon size={18} />
      <span>{label}</span>
      {badge && (
        <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </div>
    {hasSub && (active ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
  </div>
);

const NavGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-6">
    <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {title}
    </h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 h-screen border-r bg-white flex flex-col pt-10 relative">
      <div className="absolute top-0 left-0 w-full h-10 -webkit-app-region-drag pointer-events-none" style={{ WebkitAppRegion: 'drag' } as any} />
      
      <div className="px-4 flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-foreground rounded-lg flex items-center justify-center">
            <Command size={18} className="text-background" />
        </div>
        <div>
          <h2 className="font-bold text-sm leading-none">Shadcn Admin</h2>
          <p className="text-[10px] text-muted-foreground mt-1">Vite + ShadcnUI</p>
        </div>
        <ChevronRight className="ml-auto text-muted-foreground rotate-90" size={14} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 mt-4">
        <NavGroup title="General">
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={isActive('/dashboard')} 
            onClick={() => navigate('/dashboard')} 
          />
          <NavItem icon={CheckSquare} label="Tasks" />
          <NavItem icon={LayoutGrid} label="Apps" />
          <NavItem icon={MessageSquare} label="Chats" badge={3} />
          <NavItem 
            icon={Users} 
            label="Users" 
            active={isActive('/users')} 
            onClick={() => navigate('/users')} 
          />
          <NavItem icon={ShieldAlert} label="Secured by Clerk" hasSub />
        </NavGroup>

        <NavGroup title="Pages">
          <NavItem icon={Lock} label="Auth" hasSub />
          <NavItem icon={ShieldAlert} label="Errors" hasSub />
        </NavGroup>

        <NavGroup title="Other">
          <NavItem icon={Settings} label="Settings" hasSub />
          <NavItem icon={HelpCircle} label="Help Center" />
        </NavGroup>
      </div>

      <div className="p-4 border-t flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">SN</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">satnaing</p>
          <p className="text-[10px] text-muted-foreground truncate">satnaingdev@gmail.com</p>
        </div>
        <ChevronDown size={14} className="text-muted-foreground rotate-[270deg]" />
      </div>
    </div>
  );
};

export default Sidebar;
