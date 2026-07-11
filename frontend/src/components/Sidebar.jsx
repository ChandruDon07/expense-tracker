import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  Wallet, 
  TrendingUp, 
  Sparkles, 
  Settings, 
  X,
  ShieldCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Accounts', path: '/accounts', icon: Wallet },
    { name: 'Budgets & Limits', path: '/budgets', icon: TrendingUp },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden"
        ></div>
      )}

      {/* Main Sidebar Wrapper */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col glass border-r border-border/40 
        transition-transform duration-300 md:sticky md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              CitizenLex
            </span>
          </div>
          <button 
            onClick={closeSidebar}
            className="p-1 hover:bg-secondary rounded-lg transition-colors md:hidden text-foreground"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15 scale-[1.02]' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }
                `}
              >
                <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110 duration-200" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-border/40">
          <div className="rounded-xl bg-secondary/40 p-4 border border-border/20 text-center">
            <span className="text-xs text-muted-foreground block">Role Authorization</span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide block mt-0.5">Enterprise Member</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
