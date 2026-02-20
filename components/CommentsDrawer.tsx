import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageSquare, Paperclip } from 'lucide-react';
import { Comment } from '../types';

interface CommentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    testCaseId: string;
    testCaseTitle: string;
    comments: Comment[];
    currentUser: any;
    onAddComment: (content: string, attachments?: any[]) => Promise<void>;
    onDeleteComment: (id: string) => Promise<void>;
}

const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
    isOpen, onClose, testCaseId, testCaseTitle, comments, currentUser, onAddComment, onDeleteComment
}) => {
    const [newComment, setNewComment] = useState('');
    const [attachments, setAttachments] = useState<{ type: 'image' | 'file'; name: string; url: string; size?: number }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, comments]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        processFiles(Array.from(files));
    };

    const processFiles = (files: File[]) => {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setAttachments(prev => [...prev, {
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    name: file.name,
                    url: base64,
                    size: file.size
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) files.push(file);
            }
        }
        if (files.length > 0) {
            processFiles(files);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newComment.trim() && attachments.length === 0) || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(newComment, attachments);
            setNewComment('');
            setAttachments([]);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-all duration-300 ease-out ${isOpen ? 'opacity-100 pointer-events-auto backdrop-blur-[4px]' : 'opacity-0 pointer-events-none backdrop-blur-0'}`}
                style={{ willChange: 'opacity, backdrop-filter' }}
                onClick={onClose}
            />

            {/* Lightbox Overlay */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={previewImage}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        alt="Preview"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 w-[450px] bg-[#0a0a0a] border-l border-white/10 z-50 shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ willChange: 'transform' }}
            >
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
                                    <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-white/40 font-bold">{comment.userName}</span>
                                            <span className="text-[9px] text-white/20">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`group relative px-3 py-2 rounded-lg text-xs leading-relaxed space-y-2 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/80 rounded-tl-none'}`}>
                                            {comment.content && <div>{comment.content}</div>}

                                            {comment.attachments && comment.attachments.length > 0 && (
                                                <div className="grid grid-cols-1 gap-2 mt-2">
                                                    {comment.attachments.map((att, ai) => (
                                                        <div key={ai} className="rounded-md overflow-hidden border border-white/10 bg-black/20">
                                                            {att.type === 'image' ? (
                                                                <div
                                                                    className="cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                    onClick={() => setPreviewImage(att.url)}
                                                                >
                                                                    <img src={att.url} className="max-w-full h-auto" alt={att.name} />
                                                                </div>
                                                            ) : (
                                                                <div className="p-2 flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                                                                        <Paperclip size={14} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="truncate font-medium">{att.name}</div>
                                                                        {att.size && <div className="text-[9px] opacity-50">{(att.size / 1024).toFixed(1)} KB</div>}
                                                                    </div>
                                                                    <a
                                                                        href={att.url}
                                                                        download={att.name}
                                                                        className="p-1 px-2 bg-white/10 hover:bg-white/20 rounded text-[10px]"
                                                                    >
                                                                        Download
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

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
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a] space-y-3">
                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-2">
                            {attachments.map((att, i) => (
                                <div key={i} className="relative group w-20 h-20 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                                    {att.type === 'image' ? (
                                        <img src={att.url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                                            <Paperclip size={16} className="text-white/40 mb-1" />
                                            <div className="text-[8px] text-white/60 truncate w-full">{att.name}</div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeAttachment(i)}
                                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onPaste={handlePaste}
                                placeholder="Type your message or paste an image..."
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    multiple
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 text-white/40 hover:text-white transition-colors"
                                    title="Attach files"
                                >
                                    <Paperclip size={16} />
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={(!newComment.trim() && attachments.length === 0) || isSubmitting}
                            className="p-3 bg-blue-600 rounded-full text-white flex-shrink-0 disabled:opacity-50 disabled:bg-white/10 transition-all hover:bg-blue-500"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                    <div className="text-[9px] text-white/20 text-center uppercase tracking-widest font-bold">
                        Tip: You can paste images directly from clipboard (Ctrl+V)
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommentsDrawer;
