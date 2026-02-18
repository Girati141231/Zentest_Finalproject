import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { TestCase, APITestCase, STATUSES, PRIORITIES } from '../types';
import { Activity, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

interface DashboardProps {
    testCases: TestCase[];
    apiTestCases: APITestCase[];
}

const COLORS = {
    Passed: '#10b981', // green-500
    Failed: '#ef4444', // red-500
    Pending: '#f59e0b', // amber-500
    text: '#ffffff',
    grid: '#333333',
    cardBg: '#0a0a0a'
};

const Dashboard: React.FC<DashboardProps> = ({ testCases, apiTestCases }) => {

    const stats = useMemo(() => {
        const all = [...testCases, ...apiTestCases];
        const total = all.length;
        const passed = all.filter(c => c.status === 'Passed').length;
        const failed = all.filter(c => c.status === 'Failed').length;
        const pending = all.filter(c => c.status === 'Pending').length;

        const automatable = testCases.filter(c => c.hasAutomation).length;
        const automationCoverage = testCases.length ? Math.round((automatable / testCases.length) * 100) : 0;
        const passRate = total ? Math.round((passed / total) * 100) : 0;

        return { total, passed, failed, pending, automationCoverage, passRate };
    }, [testCases, apiTestCases]);

    const statusData = useMemo(() => {
        const all = [...testCases, ...apiTestCases];
        return [
            { name: 'Passed', value: all.filter(c => c.status === 'Passed').length },
            { name: 'Failed', value: all.filter(c => c.status === 'Failed').length },
            { name: 'Pending', value: all.filter(c => c.status === 'Pending').length },
        ].filter(d => d.value > 0);
    }, [testCases, apiTestCases]);

    const priorityData = useMemo(() => {
        const all = [...testCases, ...apiTestCases];
        return ['Critical', 'High', 'Medium', 'Low'].map(p => ({
            name: p,
            count: all.filter(c => c.priority === p).length
        }));
    }, [testCases, apiTestCases]);

    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric Cards */}
                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards delay-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={64} color="white" />
                    </div>
                    <span className="text-white/40 text-sm font-bold uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Total Cases</span>
                    <span className="text-4xl font-black text-white group-hover:scale-110 origin-left transition-transform duration-300">{stats.total}</span>
                    <div className="flex gap-2 text-xs text-white/40 mt-auto">
                        <span>Func: {testCases.length}</span>
                        <span>API: {apiTestCases.length}</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards delay-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 size={64} color={COLORS.Passed} />
                    </div>
                    <span className="text-white/40 text-sm font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Pass Rate</span>
                    <span className="text-4xl font-black text-emerald-500 group-hover:scale-110 origin-left transition-transform duration-300">{stats.passRate}%</span>
                    <span className="text-xs text-emerald-500/50 mt-auto">{stats.passed} Passed / {stats.total} Total</span>
                </div>

                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards delay-200">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={64} color={COLORS.Failed} />
                    </div>
                    <span className="text-white/40 text-sm font-bold uppercase tracking-widest group-hover:text-red-400 transition-colors">Failure Rate</span>
                    <span className="text-4xl font-black text-red-500 group-hover:scale-110 origin-left transition-transform duration-300">{stats.total ? Math.round((stats.failed / stats.total) * 100) : 0}%</span>
                    <span className="text-xs text-red-500/50 mt-auto">{stats.failed} Failed</span>
                </div>

                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards delay-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} color={COLORS.Pending} />
                    </div>
                    <span className="text-white/40 text-sm font-bold uppercase tracking-widest group-hover:text-amber-400 transition-colors">Pending</span>
                    <span className="text-4xl font-black text-amber-500 group-hover:scale-110 origin-left transition-transform duration-300">{stats.pending}</span>
                    <span className="text-xs text-amber-500/50 mt-auto">Need Execution</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[300px]">
                {/* Distribution Chart */}
                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 hover:border-white/10 transition-colors">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Status Distribution</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', opacity: 0.7 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Chart */}
                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 hover:border-white/10 transition-colors">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Priority Breakdown</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" horizontal={false} />
                                <XAxis type="number" stroke="#444" fontSize={10} tick={{ fill: '#666' }} />
                                <YAxis dataKey="name" type="category" stroke="#444" fontSize={10} width={60} tick={{ fill: '#888' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
