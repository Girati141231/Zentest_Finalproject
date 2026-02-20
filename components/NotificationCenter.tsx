import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, Activity, UserPlus, Info, Check, Trash2, X } from 'lucide-react';
import { Notification, NotificationType } from '../types';
import { NotificationService } from '../services/NotificationService';

interface NotificationCenterProps {
    userId: string;
    notifications: Notification[];
    onNavigate: (link: Notification['link']) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, notifications, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'comment': return <MessageSquare size={14} className="text-blue-400" />;
            case 'status': return <Activity size={14} className="text-emerald-400" />;
            case 'request': return <UserPlus size={14} className="text-amber-400" />;
            default: return <Info size={14} className="text-white/40" />;
        }
    };

    const handleNotifClick = async (n: Notification) => {
        if (!n.isRead) {
            await NotificationService.markRead(n.id);
        }
        if (n.link) {
            onNavigate(n.link);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full transition-all group ${isOpen ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Notifications</h3>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => NotificationService.markAllRead(userId)}
                                    className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-emerald-400 transition-colors"
                                    title="Mark all as read"
                                >
                                    <Check size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => NotificationService.clearAll(userId)}
                                className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-red-400 transition-colors"
                                title="Clear all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-white/20 gap-2">
                                <Bell size={32} strokeWidth={1} />
                                <p className="text-[10px] uppercase tracking-wider font-bold">All caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotifClick(n)}
                                    className={`p-3 border-b border-white/5 flex gap-3 transition-colors cursor-pointer group ${n.isRead ? 'opacity-60' : 'bg-white/[0.03] hover:bg-white/[0.05]'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0 mt-1">
                                        {n.userPhoto ? (
                                            <img src={n.userPhoto} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            getIcon(n.type)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`text-[11px] font-bold truncate ${n.isRead ? 'text-white/60' : 'text-white'}`}>{n.title}</p>
                                            <span className="text-[9px] text-white/20 whitespace-nowrap">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[10px] text-white/40 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                                    </div>
                                    {!n.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2 self-start" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-2 border-t border-white/5 text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-[9px] text-white/20 hover:text-white uppercase tracking-widest font-bold w-full py-1 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
