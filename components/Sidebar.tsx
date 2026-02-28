import React, { useState } from 'react';
import {
  Menu, ChevronLeft, Plus, Share2, Settings, LogOut, User, Shield, Key, Copy
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
  onCreateLicense?: () => void; // New optional prop for testing
  onLogout: () => void;
  onBackToHome: () => void; // New prop
  isExpanded: boolean;
  onToggleExpand: () => void;
  pendingRequestCount?: number;
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
  onCreateLicense,
  onLogout,
  onBackToHome, // Destructure
  isExpanded,
  onToggleExpand,
  pendingRequestCount
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <aside
      className={`h-full bg-[#020202] border-r border-white/5 flex flex-col transition-all duration-200 relative z-20 overflow-hidden ${isExpanded ? 'w-64' : 'w-16'}`}
    >
      <div className={`p-4 flex items-center ${isExpanded ? 'justify-between flex-row h-16' : 'flex-col justify-center gap-6 py-6'} mb-2 flex-shrink-0 transition-all duration-300`}>
        <button
          onClick={onBackToHome}
          className={`flex items-center transition-opacity duration-300 hover:opacity-80 ${isExpanded ? 'gap-3 opacity-100' : 'justify-center'}`}
          title="Back to Home"
        >
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/Zenlogo.png" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className={`font-bold tracking-tighter text-white text-lg transition-all duration-200 whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>ZENTEST</span>
        </button>
        <button
          onClick={onToggleExpand}
          className={`text-white/40 hover:text-white transition-colors p-1.5 rounded-sm hover:bg-white/5 ${!isExpanded ? 'mx-auto' : ''}`}
        >
          {isExpanded ? <ChevronLeft size={18} className="rotate-180" /> : <Menu size={18} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar px-3">
        <div className={`px-2 py-2 text-[10px] uppercase tracking-widest text-white/20 font-bold overflow-hidden transition-all duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100 h-auto mb-2' : 'opacity-0 h-0 mb-0'}`}>
          Projects
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
                <img
                  src={p.photoURL}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<span class="font-bold text-[10px] text-white/50">${p.initial || p.name.charAt(0)}</span>`;
                  }}
                />
              ) : (
                p.initial
              )}
            </div>
            {isExpanded && (
              <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-200 overflow-hidden">
                <span className={`text-sm font-medium truncate transition-colors whitespace-nowrap ${activeProjectId === p.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
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
            title="Create New Project"
          >
            <Plus size={16} className="flex-shrink-0" />
            {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-200 whitespace-nowrap overflow-hidden">New Project</span>}
          </button>
          <button
            onClick={onJoinProject}
            className={`flex items-center rounded-sm border border-dashed border-blue-500/20 text-blue-500/60 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-200 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] ${isExpanded ? 'gap-3 p-2.5' : 'justify-center mx-auto w-10 h-10'}`}
            title="Join Project"
          >
            <Share2 size={16} className="flex-shrink-0" />
            {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-200 whitespace-nowrap overflow-hidden">Join Project</span>}
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
          disabled={!activeProjectId}
          onClick={onSettings}
          className={`relative flex items-center text-white/40 hover:text-white transition-colors disabled:opacity-20 rounded-sm py-1 ${isExpanded ? 'gap-3 px-2' : 'justify-center'}`}
        >
          <div className="relative">
            <Settings size={18} className="flex-shrink-0" />
            {pendingRequestCount !== undefined && pendingRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 text-[8px] font-bold text-white items-center justify-center">
                  {isExpanded ? '' : ''}
                </span>
              </span>
            )}
          </div>
          {isExpanded && (
            <div className="flex items-center justify-between flex-1">
              <span className="font-medium text-sm animate-in fade-in duration-200 whitespace-nowrap overflow-hidden">Settings</span>
              {pendingRequestCount !== undefined && pendingRequestCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full">{pendingRequestCount}</span>
              )}
            </div>
          )}
        </button>
        <button
          onClick={onLogout}
          className={`flex items-center text-white/40 hover:text-red-500 transition-colors rounded-sm py-1 ${isExpanded ? 'gap-3 px-2' : 'justify-center'}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {isExpanded && <span className="font-medium text-sm animate-in fade-in duration-200 whitespace-nowrap overflow-hidden">Sign Out</span>}
        </button>

        <div className={`flex items-center overflow-hidden transition-all duration-300 pt-2 border-t border-white/5 ${isExpanded ? 'gap-3 w-full' : 'justify-center w-full'}`}>
          <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center flex-shrink-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-blue-400 text-[10px]">${user.displayName?.[0] || '?'}</div>`;
                }}
              />
            ) : (
              <User size={14} className="text-white/30" />
            )}
          </div>
          <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-black truncate text-white tracking-tight">
                {user.displayName || 'Enterprise User'}
              </span>
              {isPro ? (
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-black tracking-widest uppercase animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.3)]">PRO</span>
              ) : (
                <span className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded-full border border-white/10 font-black tracking-widest uppercase">FREE</span>
              )}
            </div>

            {/* Enhanced Connection Key UI */}
            <div className="relative group/key">
              <div
                onClick={() => {
                  navigator.clipboard.writeText(user.uid);
                  alert("Connection Key copied to clipboard!");
                }}
                className="flex flex-col gap-0.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg py-1.5 px-2.5 transition-all cursor-pointer group-hover/key:border-purple-500/30"
              >
                <div className="flex justify-between items-center group-hover/key:pb-0.5 transition-all">
                  <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Connection Key</span>
                  <Copy size={8} className="text-white/20 group-hover/key:text-purple-400" />
                </div>
                <span className="text-[9px] font-mono text-white/40 group-hover/key:text-white/80 transition-colors truncate">
                  {user.uid}
                </span>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute -top-8 left-0 scale-75 opacity-0 group-hover/key:opacity-100 group-hover/key:scale-100 transition-all pointer-events-none bg-purple-600 text-white text-[9px] font-bold px-3 py-1.5 rounded shadow-2xl z-50 whitespace-nowrap">
                Click to Copy (Paste in Extension)
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
