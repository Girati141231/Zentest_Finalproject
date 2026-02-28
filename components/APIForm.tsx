import React, { useState, useEffect } from 'react';
import { Plus, XCircle, Trash2 } from 'lucide-react';
import Modal from './ui/Modal';
import { APITestCase, Module, PRIORITIES, STATUSES } from '../types';

interface APIFormProps {
    isOpen: boolean;
    onClose: () => void;
    activeProjectId: string | null;
    modules: Module[];
    editingCase: APITestCase | null;
    onSave: (data: Partial<APITestCase>, isNew: boolean) => Promise<void>;
}

const DEFAULT_FORM: Partial<APITestCase> = {
    title: '',
    module: '',
    priority: 'Medium',
    status: 'Pending',
    method: 'GET',
    url: '',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: '',
    expectedStatus: 200,
    expectedBody: '',
    round: 1
};

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const COMMON_HEADERS = [
    'Authorization',
    'Content-Type',
    'Accept',
    'Accept-Language',
    'Cache-Control',
    'User-Agent',
    'X-API-Key',
    'X-Auth-Token',
    'Origin',
    'Referer'
];


const APIForm: React.FC<APIFormProps> = ({
    isOpen, onClose, activeProjectId, modules, editingCase, onSave
}) => {
    const [form, setForm] = useState<Partial<APITestCase>>(DEFAULT_FORM);
    const [showModuleDropdown, setShowModuleDropdown] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (editingCase) {
            setForm({ ...editingCase, headers: editingCase.headers || [] });
        } else {
            setForm({ ...DEFAULT_FORM, module: modules[0]?.name || '' });
        }
    }, [isOpen, editingCase, modules]);

    useEffect(() => {
        if (!editingCase) {
            // 1. Automatic Status Code Suggestion (Triggers on Method change)
            const method = form.method || 'GET';
            let suggestedStatus = 200;
            if (method === 'POST') suggestedStatus = 201;
            else if (method === 'DELETE') suggestedStatus = 204;

            if (form.expectedStatus !== suggestedStatus) {
                setForm(prev => ({ ...prev, expectedStatus: suggestedStatus }));
            }
        }
    }, [form.method, editingCase]);

    useEffect(() => {
        if (!editingCase && (form.url || form.title)) {
            // 2. Automatic Priority Assessment (Triggers on URL/Title change)
            const url = (form.url || '').toLowerCase();
            const title = (form.title || '').toLowerCase();
            const method = form.method || 'GET';

            let suggestedPriority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';

            if (url.includes('payment') || url.includes('checkout') || title.includes('pay') || title.includes('order')) {
                suggestedPriority = 'Critical';
            } else if (method === 'DELETE' || url.includes('auth') || url.includes('login') || title.includes('delete') || title.includes('auth')) {
                suggestedPriority = 'High';
            } else if (url.includes('user') || url.includes('profile') || method === 'POST' || method === 'PUT') {
                suggestedPriority = 'Medium';
            } else {
                suggestedPriority = 'Low';
            }

            if (form.priority !== suggestedPriority) {
                setForm(prev => ({ ...prev, priority: suggestedPriority }));
            }
        }
    }, [form.url, form.title, editingCase]);

    const handleSave = async () => {
        if (!form.url || !activeProjectId) return;

        // Smart URL: Auto-prepend http:// if protocol is missing
        let processedUrl = form.url.trim();
        if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
            // Check if it looks like a domain or localhost
            if (processedUrl.includes('.') || processedUrl.startsWith('localhost')) {
                processedUrl = 'http://' + processedUrl;
            }
        }

        const data = {
            ...form,
            url: processedUrl,
            projectId: activeProjectId,
        };
        await onSave(data, !editingCase);
        onClose();
    };

    const addHeader = () => {
        setForm({ ...form, headers: [...(form.headers || []), { key: '', value: '' }] });
    };

    const removeHeader = (idx: number) => {
        setForm({ ...form, headers: form.headers?.filter((_, i) => i !== idx) });
    };

    const getHeaderDefaults = (key: string): { value: string; placeholder: string; suggestions: string[] } => {
        const defaults: Record<string, { v: string; p: string; s: string[] }> = {
            'Authorization': { v: '', p: 'Paste token only', s: [] },
            'Content-Type': {
                v: 'application/json', p: 'e.g. application/json',
                s: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain', 'application/xml']
            },
            'Accept': {
                v: 'application/json', p: 'e.g. application/json',
                s: ['application/json', 'application/xml', 'text/html', 'image/png', '*/*']
            },
            'Accept-Language': { v: 'en-US,en;q=0.9', p: 'e.g. en-US, th', s: ['en-US,en;q=0.9', 'th-TH,th;q=0.9,en;q=0.8'] },
            'Cache-Control': { v: 'no-cache', p: 'e.g. no-cache', s: ['no-cache', 'no-store', 'max-age=0', 'must-revalidate', 'public', 'private'] },
            'User-Agent': { v: '', p: 'Mozilla/5.0...', s: [] },
            'X-API-Key': { v: '', p: 'Your secret key', s: [] },
            'X-Auth-Token': { v: '', p: 'Authentication token', s: [] },
            'Origin': { v: '', p: 'e.g. http://localhost:3000', s: [] },
            'Referer': { v: '', p: 'Source URL', s: [] }
        };
        const d = defaults[key] || { v: '', p: 'Header Value', s: [] };
        return { value: d.v, placeholder: d.p, suggestions: d.s };
    };

    const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
        const nh = [...(form.headers || [])];

        if (field === 'key') {
            const { value } = getHeaderDefaults(val);
            nh[idx] = { key: val, value: value };
        } else {
            nh[idx] = { ...nh[idx], [field]: val };
        }

        setForm({ ...form, headers: nh });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingCase ? `Modify API Request ${editingCase.id}` : 'Create API Definition'}
            footer={
                <button onClick={handleSave} className="bg-white text-black px-8 py-2.5 rounded-sm text-xs font-bold hover:bg-white/90 transition-all uppercase tracking-widest shadow-lg">
                    Commit Changes
                </button>
            }
        >
            <div className="flex flex-col gap-6">
                {/* Core Info */}
                <div className="grid grid-cols-[100px_1fr] gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Method</label>
                        <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as any })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20 font-bold">
                            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Endpoint URL</label>
                        <input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 outline-none focus:border-white/20 transition-all text-xs text-white" placeholder="https://api.example.com/v1/users" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Title</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 outline-none focus:border-white/20 transition-all text-xs text-white" placeholder="e.g. Get All Users" />
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Module</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={form.module}
                                onFocus={() => { setShowModuleDropdown(true); setIsTyping(false); }}
                                onBlur={() => setTimeout(() => setShowModuleDropdown(false), 200)}
                                onChange={(e) => { setForm({ ...form, module: e.target.value }); setIsTyping(true); }}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none text-xs text-white focus:border-white/20 transition-all pr-8"
                                placeholder="Select or type..."
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 transition-colors">
                                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            {showModuleDropdown && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f0f0f] border border-white/10 rounded-sm shadow-2xl z-[100] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                                    {modules
                                        .filter(m => !isTyping || !form.module || m.name.toLowerCase().includes(form.module.toLowerCase()))
                                        .map(m => (
                                            <div
                                                key={m.id}
                                                onClick={() => { setForm({ ...form, module: m.name }); setShowModuleDropdown(false); }}
                                                className="px-3 py-2 text-[10px] text-white/70 hover:bg-white/5 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-none"
                                            >
                                                {m.name}
                                            </div>
                                        ))}
                                    {modules.filter(m => !isTyping || !form.module || m.name.toLowerCase().includes(form.module.toLowerCase())).length === 0 && (
                                        <div className="px-3 py-3 text-[10px] text-white/20 italic text-center">No matches found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Priority</label>
                        <select
                            value={form.priority}
                            onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20 font-bold"
                        >
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Expected Status</label>
                        <input type="number" value={form.expectedStatus} onChange={(e) => setForm({ ...form, expectedStatus: parseInt(e.target.value) })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none text-xs text-white focus:border-white/20" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Round</label>
                        <input type="number" min="1" value={form.round || 1} onChange={(e) => setForm({ ...form, round: parseInt(e.target.value) })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none text-xs text-white focus:border-white/20" />
                    </div>
                </div>

                {/* Headers */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Request Headers</label>
                        <button onClick={addHeader} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">+ Add Header</button>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar bg-white/[0.01] p-3 rounded border border-white/5">
                        {form.headers?.map((h, i) => {
                            const isCustom = h.key !== '' && h.key !== 'Authorization' && !COMMON_HEADERS.includes(h.key);
                            return (
                                <div key={i} className="flex gap-3 group items-center mb-1 last:mb-0 bg-white/[0.02] p-1.5 rounded-sm border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex-1">
                                        {isCustom ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={h.key}
                                                    autoFocus
                                                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                                                    className="w-full bg-transparent border-b border-blue-500/30 px-2 py-1 outline-none text-xs text-white transition-all font-mono"
                                                    placeholder="Custom Key"
                                                />
                                                <button onClick={() => updateHeader(i, 'key', 'Content-Type')} className="text-white/20 hover:text-white transition-colors" title="Switch to list">
                                                    <XCircle size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                value={h.key}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '__custom__') {
                                                        updateHeader(i, 'key', 'X-Custom-Header');
                                                    } else {
                                                        updateHeader(i, 'key', val);
                                                    }
                                                }}
                                                className="w-full bg-transparent border-b border-white/5 px-1 py-1 outline-none text-xs text-white/80 focus:text-white cursor-pointer appearance-none font-bold"
                                            >
                                                {!h.key && <option value="">Select Header</option>}
                                                {COMMON_HEADERS.map(k => <option key={k} value={k} className="bg-[#111111]">{k}</option>)}
                                                <option value="__custom__" className="bg-[#111111] text-blue-400">+ Custom Header...</option>
                                            </select>
                                        )}
                                    </div>
                                    <span className="text-white/10 text-xs">:</span>
                                    <div className="flex-[1.8] flex items-center gap-1.5 bg-black/40 rounded-sm px-2 border border-white/5 focus-within:border-emerald-500/50 transition-all">
                                        {h.key.toLowerCase() === 'authorization' && (
                                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-tight">Bearer</span>
                                        )}
                                        <input
                                            type="text"
                                            list={`val-suggestions-${i}`}
                                            value={h.key.toLowerCase() === 'authorization' ? h.value.replace(/^Bearer\s+/i, '') : h.value}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (h.key.toLowerCase() === 'authorization') {
                                                    val = val.trim() ? `Bearer ${val.trim()}` : '';
                                                }
                                                updateHeader(i, 'value', val);
                                            }}
                                            className="w-full bg-transparent py-1.5 outline-none text-xs text-emerald-400/80 focus:text-emerald-400 font-mono"
                                            placeholder={getHeaderDefaults(h.key).placeholder}
                                        />
                                        <datalist id={`val-suggestions-${i}`}>
                                            {getHeaderDefaults(h.key).suggestions.map(s => <option key={s} value={s} />)}
                                        </datalist>
                                    </div>
                                    <button onClick={() => removeHeader(i)} className="text-white/5 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                        {(!form.headers || form.headers.length === 0) && <div className="text-center py-4 text-white/10 text-[10px] italic tracking-widest uppercase border border-dashed border-white/5 rounded">No headers added</div>}
                    </div>
                </div>

                {/* Body */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col h-40">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Request Body (JSON)</label>
                        <textarea
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            className="flex-1 w-full bg-[#000000] border border-white/10 rounded-sm p-3 text-[10px] text-white/80 outline-none focus:border-white/20 custom-scrollbar resize-none"
                            placeholder="{}"
                        />
                    </div>
                    <div className="space-y-1.5 flex flex-col h-40">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Expected Response (JSON Pattern)</label>
                        <textarea
                            value={form.expectedBody}
                            onChange={(e) => setForm({ ...form, expectedBody: e.target.value })}
                            className="flex-1 w-full bg-[#000000] border border-white/10 rounded-sm p-3 text-[10px] text-emerald-400/80 outline-none focus:border-emerald-500/30 custom-scrollbar resize-none"
                            placeholder="{ ... }"
                        />
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default APIForm;
