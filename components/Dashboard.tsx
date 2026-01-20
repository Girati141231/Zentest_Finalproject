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
                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={64} color="white" />
                    </div>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Total Cases</span>
                    <span className="text-4xl font-black text-white">{stats.total}</span>
                    <div className="flex gap-2 text-[10px] text-white/40 mt-auto">
                        <span>Func: {testCases.length}</span>
                        <span>API: {apiTestCases.length}</span>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 size={64} color={COLORS.Passed} />
                    </div>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Pass Rate</span>
                    <span className="text-4xl font-black text-emerald-500">{stats.passRate}%</span>
                    <span className="text-[10px] text-emerald-500/50 mt-auto">{stats.passed} Passed / {stats.total} Total</span>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={64} color={COLORS.Failed} />
                    </div>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Failure Rate</span>
                    <span className="text-4xl font-black text-red-500">{stats.total ? Math.round((stats.failed / stats.total) * 100) : 0}%</span>
                    <span className="text-[10px] text-red-500/50 mt-auto">{stats.failed} Failed</span>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} color={COLORS.Pending} />
                    </div>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Pending</span>
                    <span className="text-4xl font-black text-amber-500">{stats.pending}</span>
                    <span className="text-[10px] text-amber-500/50 mt-auto">Need Execution</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[300px]">
                {/* Distribution Chart */}
                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col">
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
                <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm shadow-lg flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Priority Breakdown</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
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
