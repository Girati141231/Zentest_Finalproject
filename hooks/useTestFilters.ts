import { useState, useMemo } from 'react';
import { TestCase, APITestCase } from '../types';

export const useTestFilters = (
    testCases: TestCase[],
    apiTestCases: APITestCase[]
) => {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterModule, setFilterModule] = useState<string>('All');
    const [filterPriority, setFilterPriority] = useState<string>('All');
    const [filterAutomation, setFilterAutomation] = useState<boolean>(false);
    const [filterUser, setFilterUser] = useState<string>('All');

    const filterLogic = (c: TestCase | APITestCase) => {
        const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
            (c as any).url?.toLowerCase().includes(search.toLowerCase()) ||
            c.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
        const matchesModule = filterModule === 'All' || c.module === filterModule;
        const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
        const matchesAutomation = !filterAutomation || (c as any).hasAutomation;
        const matchesUser = filterUser === 'All' || c.lastUpdatedByName === filterUser;

        return matchesSearch && matchesStatus && matchesModule && matchesPriority && matchesAutomation && matchesUser;
    };

    const filteredCases = useMemo(() => {
        return testCases.filter(filterLogic);
    }, [testCases, search, filterStatus, filterModule, filterPriority, filterAutomation, filterUser]);

    const filteredApiCases = useMemo(() => {
        return apiTestCases.filter(filterLogic);
    }, [apiTestCases, search, filterStatus, filterModule, filterPriority, filterAutomation, filterUser]);

    const clearFilters = () => {
        setFilterModule('All');
        setFilterPriority('All');
        setFilterStatus('All');
        setFilterUser('All');
        setFilterAutomation(false);
        setSearch('');
    };

    const uniqueUsers = useMemo(() => {
        const all = [...testCases, ...apiTestCases];
        const users = new Set(all.map(c => c.lastUpdatedByName).filter(Boolean));
        return Array.from(users);
    }, [testCases, apiTestCases]);

    return {
        search, setSearch,
        filterStatus, setFilterStatus,
        filterModule, setFilterModule,
        filterPriority, setFilterPriority,
        filterAutomation, setFilterAutomation,
        filterUser, setFilterUser,
        filteredCases,
        filteredApiCases,
        clearFilters,
        uniqueUsers
    };
};
