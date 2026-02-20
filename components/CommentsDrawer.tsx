import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageSquare } from 'lucide-react';
import { Comment } from '../types';

interface CommentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    testCaseId: string;
    testCaseTitle: string;
    comments: Comment[];
    currentUser: any;
    onAddComment: (content: string) => Promise<void>;
    onDeleteComment: (id: string) => Promise<void>;
}

const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
    isOpen, onClose, testCaseId, testCaseTitle, comments, currentUser, onAddComment, onDeleteComment
}) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, comments]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(newComment);
            setNewComment('');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-[400px] bg-[#0a0a0a] border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                            <MessageSquare size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">Comments</h3>
                            <p className="text-[10px] text-white/40 truncate font-mono max-w-[250px]">{testCaseTitle || testCaseId}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[#050505]">
                    {comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2">
                            <MessageSquare size={32} strokeWidth={1} />
                            <p className="text-xs">No comments yet. Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((comment) => {
                            const isMe = comment.userId === currentUser.uid;
                            return (
                                <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 overflow-hidden border border-white/5">
                                        {comment.userPhoto ? (
                                            <img
                                                src={comment.userPhoto}
                                                alt={comment.userName}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/50">${comment.userName.charAt(0)}</div>`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/50">
                                                {comment.userName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-white/40 font-bold">{comment.userName}</span>
                                            <span className="text-[9px] text-white/20">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`group relative px-3 py-2 rounded-lg text-xs leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/80 rounded-tl-none'}`}>
                                            {comment.content}
                                            {isMe && (
                                                <button
                                                    onClick={() => onDeleteComment(comment.id)}
                                                    className="absolute -left-8 top-1/2 -py-1/2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    title="Delete message"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                    <div className="relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:bg-white/10 transition-all hover:bg-blue-500"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CommentsDrawer;
