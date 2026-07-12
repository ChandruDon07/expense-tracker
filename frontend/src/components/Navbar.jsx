import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, Menu, User, Bell } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-30 w-full glass border-b border-border/40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-secondary rounded-lg transition-colors md:hidden text-foreground"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Workspace</span>
          <span className="text-base font-bold text-foreground bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
            WalletIQ
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark Mode Switcher */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
          title="Toggle color theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Icon (Mock for Phase 1) */}
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
        </button>

        <div className="h-6 w-px bg-border/60 mx-1"></div>

        {/* User profile dropdown summary */}
        <div className="flex items-center gap-3 pl-1">
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-inner uppercase">
            {user?.firstName ? user.firstName.charAt(0) : <User size={16} />}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-semibold text-foreground leading-tight">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground leading-none">
              {user?.email}
            </span>
          </div>
          
          <button
            onClick={logout}
            className="p-2 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
            title="Log out of session"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
