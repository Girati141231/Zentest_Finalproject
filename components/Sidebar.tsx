import React, { useState } from 'react';
import {
  Menu, ChevronLeft, Plus, Share2, Settings, LogOut, User, Shield, Key
} from 'lucide-react';
import { Project, COLORS } from '../types';

interface SidebarProps {
  user: any;
  isPro?: boolean; // New prop
  projects: Project[];
  activeProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onCreateProject: () => void;
  onJoinProject: () => void;
  onSettings: () => void;
  onLicense: () => void;
  onCreateLicense?: () => void; // New optional prop for testing
  onLogout: () => void;
  onBackToHome: () => void; // New prop
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  isPro, // Destructure
  projects,
  activeProjectId,
  onProjectSelect,
  onCreateProject,
  onJoinProject,
  onSettings,
  onLicense, // Destructure
  onCreateLicense,
  onLogout,
  onBackToHome, // Destructure
  isExpanded,
  onToggleExpand
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <aside
      className={`h-full bg-[#020202] border-r border-white/5 flex flex-col transition-all duration-300 relative z-20 ${isExpanded ? 'w-64' : 'w-16'}`}
    >
      <div className="p-4 flex items-center justify-between mb-2 h-16 flex-shrink-0">
        <button
          onClick={onBackToHome}
          className={`flex items-center gap-3 transition-opacity duration-300 hover:opacity-80 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'}`}
          title="Back to Landing Page"
        >
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/Zenlogo.png" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="font-bold tracking-tighter text-white whitespace-nowrap text-lg">ZENTEST</span>
        </button>
        <button
          onClick={onToggleExpand}
          className={`text-white/40 hover:text-white transition-colors p-1.5 rounded-sm hover:bg-white/5 ${!isExpanded ? 'mx-auto' : ''}`}
        >
          {isExpanded ? <ChevronLeft size={18} className="rotate-180" /> : <Menu size={18} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar px-3">
        <div className={`px-2 py-2 text-[10px] uppercase tracking-widest text-white/20 font-bold overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 h-auto mb-2' : 'opacity-0 h-0'}`}>
          Scopes
        </div>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => onProjectSelect(p.id)}
            className={`flex items-center rounded-sm transition-all duration-200 flex-shrink-0 group hover:scale-[1.02] active:scale-[0.98] ${activeProjectId === p.id ? 'bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border border-transparent opacity-50 hover:opacity-100 hover:bg-white/[0.03]'} ${isExpanded ? 'gap-3 p-2.5' : 'justify-center mx-auto w-10 h-10'}`}
            title={!isExpanded ? p.name : ''}
          >
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0 font-bold text-[10px] overflow-hidden"
              style={{ backgroundColor: `${p.color}20`, color: p.color, boxShadow: activeProjectId === p.id ? `0 0 10px ${p.color}40` : 'none' }}
            >
              {p.photoURL ? (
                <img src={p.photoURL} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                p.initial
              )}
            </div>
            {isExpanded && (
              <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className={`text-sm font-medium truncate transition-colors ${activeProjectId === p.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                  {p.name}
                </span>
              </div>
            )}
          </button>
        ))}

        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={onCreateProject}
            className={`flex items-center rounded-sm border border-dashed border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/30 transition-all duration-200 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] ${isExpanded ? 'gap-3 p-2.5' : 'justify-center mx-auto w-10 h-10'}`}
            title="Create New Scope"
          >
            <Plus size={16} className="flex-shrink-0" />
            {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-300">New Project</span>}
          </button>
          <button
            onClick={onJoinProject}
            className={`flex items-center rounded-sm border border-dashed border-blue-500/20 text-blue-500/60 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-200 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] ${isExpanded ? 'gap-3 p-2.5' : 'justify-center mx-auto w-10 h-10'}`}
            title="Join Existing Scope"
          >
            <Share2 size={16} className="flex-shrink-0" />
            {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-300">Join Project</span>}
          </button>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-white/5 flex flex-col gap-4 bg-[#080808]">
        {onCreateLicense && (
          <button
            onClick={onCreateLicense}
            className={`flex items-center text-white/30 hover:text-white transition-colors hover:bg-white/5 rounded-sm py-1 border border-dashed border-white/10 hover:border-white/30 ${isExpanded ? 'gap-3 px-2' : 'justify-center'}`}
            title="Create Real License (Admin)"
          >
            <Key size={14} className="flex-shrink-0" />
            {isExpanded && <span className="text-sm animate-in fade-in duration-300">Create Key</span>}
          </button>
        )}
        <button
          onClick={onLicense}
          className={`flex items-center text-white/40 hover:text-green-400 transition-colors rounded-sm py-1 ${isExpanded ? 'gap-3 px-2' : 'justify-center'}`}
        >
          <Shield size={18} className="flex-shrink-0" />
          {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-300">Membership</span>}
        </button>
        <button
          disabled={!activeProjectId}
          onClick={onSettings}
          className={`flex items-center text-white/40 hover:text-white transition-colors disabled:opacity-20 rounded-sm py-1 ${isExpanded ? 'gap-3 px-2' : 'justify-center'}`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-300">Config</span>}
        </button>
        <button
          onClick={onLogout}
          className={`flex items-center text-white/40 hover:text-red-500 transition-colors rounded-sm py-1 ${isExpanded ? 'gap-3 px-2' : 'justify-center'}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-300">Sign Out</span>}
        </button>

        <div className={`flex items-center overflow-hidden transition-all duration-300 pt-2 border-t border-white/5 ${isExpanded ? 'gap-3 w-full' : 'justify-center w-full'}`}>
          <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
            {user.photoURL && !imageError ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <User size={14} className="m-auto mt-2 text-white/50" />
            )}
          </div>
          {isExpanded && (
            <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
              <span className="text-[11px] font-bold truncate text-white">
                {user.displayName || 'Enterprise User'}
                {isPro ? (
                  <span className="ml-2 text-[9px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.2)] tracking-wider">PRO</span>
                ) : (
                  <span className="ml-2 text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded border border-white/10 tracking-wider">FREE</span>
                )}
              </span>
              <span className="text-[9px] text-white/30 truncate">{user.email}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
