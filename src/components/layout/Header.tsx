import { 
  Search, 
  Sun, 
  Settings, 
  PanelLeft
} from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-md z-10">
      <div className="flex items-center gap-4">
        <button className="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-colors">
          <PanelLeft size={20} />
        </button>
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-muted/50 border rounded-md py-1.5 pl-10 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-9"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 border rounded px-1.5 py-0.5 text-[10px] text-muted-foreground bg-background leading-none">
            ⌘ K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button className="p-2 hover:bg-accent rounded-md text-muted-foreground transition-colors">
          <Sun size={20} />
        </button>
        <button className="p-2 hover:bg-accent rounded-md text-muted-foreground transition-colors">
          <Settings size={20} />
        </button>
        <button className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium ml-2">
          SN
        </button>
      </div>
    </header>
  );
};

export default Header;
