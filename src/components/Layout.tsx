import React from 'react';
import { UserProfile } from '../types';
import { Button } from './UI';
import { LayoutDashboard, BookOpen, ClipboardCheck, LogOut, User as UserIcon, Zap, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  profile: UserProfile;
  activeTab: 'dashboard' | 'learn' | 'assess' | 'settings' | 'family';
  onTabChange: (tab: 'dashboard' | 'learn' | 'assess' | 'settings' | 'family') => void;
  onLogout: () => void;
}

export const Layout = ({ children, profile, activeTab, onTabChange, onLogout }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-black/5 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-emerald-600 rounded-xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Wallington Ace</span>
        </div>

        <nav className="flex-1 space-y-2">
          {profile.role === 'parent' ? (
            <NavItem 
              icon={<LayoutDashboard />} 
              label="Family Overview" 
              active={activeTab === 'dashboard' || activeTab === 'family'} 
              onClick={() => onTabChange('dashboard')} 
            />
          ) : (
            <>
              <NavItem 
                icon={<LayoutDashboard />} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => onTabChange('dashboard')} 
              />
              <NavItem 
                icon={<BookOpen />} 
                label="Daily Plan" 
                active={activeTab === 'learn'} 
                onClick={() => onTabChange('learn')} 
              />
              <NavItem 
                icon={<ClipboardCheck />} 
                label="Assessment" 
                active={activeTab === 'assess'} 
                onClick={() => onTabChange('assess')} 
              />
            </>
          )}
          <NavItem 
            icon={<Settings />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => onTabChange('settings')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-black/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {profile.displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile.displayName}</p>
              <p className="text-xs text-stone-500">{profile.role === 'parent' ? 'Parent' : `Level ${profile.level}`}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-stone-500 hover:text-red-600"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? "bg-emerald-50 text-emerald-700 font-semibold" 
        : "text-stone-500 hover:bg-stone-100"
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
    <span>{label}</span>
  </button>
);
