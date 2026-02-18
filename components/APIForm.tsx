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
    expectedBody: ''
};

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const APIForm: React.FC<APIFormProps> = ({
    isOpen, onClose, activeProjectId, modules, editingCase, onSave
}) => {
    const [form, setForm] = useState<Partial<APITestCase>>(DEFAULT_FORM);

    useEffect(() => {
        if (editingCase) {
            setForm({ ...editingCase, headers: editingCase.headers || [] });
        } else {
            setForm({ ...DEFAULT_FORM, module: modules[0]?.name || '' });
        }
    }, [isOpen, editingCase, modules]);

    const handleSave = async () => {
        if (!form.url || !activeProjectId) return;
        const data = {
            ...form,
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

    const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
        const nh = [...(form.headers || [])];
        nh[idx] = { ...nh[idx], [field]: val };
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
                    <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Description</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 outline-none focus:border-white/20 transition-all text-xs text-white" placeholder="What does this endpoint do?" />
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Module</label>
                        <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                            <option value="">Unassigned</option>
                            {modules.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Round</label>
                        <input type="number" min="1" value={form.round || 1} onChange={(e) => setForm({ ...form, round: parseInt(e.target.value) })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none text-xs text-white focus:border-white/20" />
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

                {/* Headers */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Request Headers</label>
                        <button onClick={addHeader} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">+ Add Header</button>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar bg-white/[0.01] p-2 rounded border border-white/5">
                        {form.headers?.map((h, i) => (
                            <div key={i} className="flex gap-2 group">
                                <input type="text" value={h.key} onChange={(e) => updateHeader(i, 'key', e.target.value)} className="flex-1 bg-transparent border-b border-white/5 px-2 py-1 outline-none text-xs text-white/60 focus:text-white focus:border-blue-500/50" placeholder="Key" />
                                <span className="text-white/10">:</span>
                                <input type="text" value={h.value} onChange={(e) => updateHeader(i, 'value', e.target.value)} className="flex-1 bg-transparent border-b border-white/5 px-2 py-1 outline-none text-xs text-emerald-400/60 focus:text-emerald-400 focus:border-emerald-500/50" placeholder="Value" />
                                <button onClick={() => removeHeader(i)} className="text-white/5 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"><XCircle size={14} /></button>
                            </div>
                        ))}
                        {(!form.headers || form.headers.length === 0) && <div className="text-center py-2 text-white/10 text-[10px] italic">No headers</div>}
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
