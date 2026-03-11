import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { useApiQuery } from '../../hooks/useApi';
import api from '../../utils/api';
import {
    Calendar, CheckCircle2, Clock, BarChart3, Filter,
    ChevronDown, ChevronUp, Download, X, Image, FileText, Loader2,
    ShieldCheck, ShieldAlert, ShieldX, Eye, Brain, FileSearch, Wrench,
    CheckSquare
} from 'lucide-react';

export default function CoursePlanReports() {
    const [filters, setFilters] = useState({
        facultyId: '', subjectId: '', unitName: '', startDate: '', endDate: '', status: '', aiFilter: '', page: 1,
    });
    const [appliedFilters, setAppliedFilters] = useState({ page: 1 });
    const [expandedRow, setExpandedRow] = useState(null);
    const [showSubjectProgress, setShowSubjectProgress] = useState(false);
    const [proofModal, setProofModal] = useState(null);
    const [materialsModal, setMaterialsModal] = useState(null);
    const [aiDetailModal, setAiDetailModal] = useState(null);

    // Fetch summary data
    const { data: summary, isLoading: summaryLoading } = useApiQuery(
        'hod-course-plan-summary',
        '/hod/course-plan/summary'
    );

    // Build query string from applied filters
    const buildQueryString = () => {
        const params = new URLSearchParams();
        Object.entries(appliedFilters).forEach(([k, v]) => { if (v) params.append(k, v); });
        return params.toString();
    };

    // Fetch reports
    const { data: reportsData, isLoading: reportsLoading, refetch } = useApiQuery(
        ['hod-course-plan-reports', appliedFilters],
        `/hod/course-plan/reports?${buildQueryString()}`
    );

    const reports = reportsData?.reports || [];
    const pagination = reportsData?.pagination || {};

    // AI filter counts
    const aiCounts = {
        all: reports.length,
        verified: reports.filter(r => r.ai_verified === true).length,
        lowConfidence: reports.filter(r => r.ai_low_confidence === true).length,
        flagged: reports.filter(r => r.ai_flagged === true).length,
        unverified: reports.filter(r => r.ai_score === null || r.ai_score === undefined).length,
    };

    // Apply client-side AI filter
    const filteredReports = (() => {
        const af = appliedFilters.aiFilter;
        if (!af || af === 'all') return reports;
        if (af === 'verified') return reports.filter(r => r.ai_verified === true);
        if (af === 'low_confidence') return reports.filter(r => r.ai_low_confidence === true);
        if (af === 'flagged') return reports.filter(r => r.ai_flagged === true);
        return reports;
    })();

    // Sort: flagged rows first
    const sortedReports = [...filteredReports].sort((a, b) => {
        if (a.ai_flagged && !b.ai_flagged) return -1;
        if (!a.ai_flagged && b.ai_flagged) return 1;
        if (a.ai_low_confidence && !b.ai_low_confidence) return -1;
        if (!a.ai_low_confidence && b.ai_low_confidence) return 1;
        return 0;
    });

    const applyFilters = () => {
        setAppliedFilters({ ...filters, page: 1 });
    };

    const clearFilters = () => {
        const empty = { facultyId: '', subjectId: '', unitName: '', startDate: '', endDate: '', status: '', aiFilter: '', page: 1 };
        setFilters(empty);
        setAppliedFilters({ page: 1 });
    };

    const changePage = (newPage) => {
        setAppliedFilters(prev => ({ ...prev, page: newPage }));
    };

    const setAiFilter = (val) => {
        setFilters(p => ({ ...p, aiFilter: val }));
        setAppliedFilters(prev => ({ ...prev, aiFilter: val }));
    };

    // Mark as reviewed
    const handleMarkReviewed = async (reportId) => {
        try {
            await api.put(`/hod/course-plan/reports/${reportId}/review`);
            refetch();
            setAiDetailModal(null);
        } catch (err) {
            console.error('Mark reviewed error:', err);
        }
    };

    // Export to Excel
    const handleExport = async () => {
        try {
            const XLSX = await import('xlsx');
            const rows = sortedReports.map(r => ({
                Faculty: r.faculty_name,
                Subject: `${r.subject_code} - ${r.subject_name}`,
                Unit: r.unit_name,
                Topic: r.topic_name,
                Periods: r.periods_required,
                'Submitted At': new Date(r.submitted_at).toLocaleString(),
                'What Was Covered': r.what_was_covered,
                'AI Score': r.ai_score ?? 'N/A',
                'AI Status': r.ai_verified ? 'Verified' : r.ai_low_confidence ? 'Low Confidence' : r.ai_flagged ? 'Flagged' : 'No AI',
                'Materials Released': r.materials?.length || 0,
                'Proof URL': r.proof_image_url,
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Reports');
            XLSX.writeFile(wb, `course_plan_reports_${Date.now()}.xlsx`);
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    // Format date
    const formatDate = (d) => {
        const date = new Date(d);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return `Today ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' ' +
            date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const unitColors = {
        'I': 'bg-blue-100 text-blue-700',
        'II': 'bg-purple-100 text-purple-700',
        'III': 'bg-green-100 text-green-700',
        'IV': 'bg-amber-100 text-amber-700',
        'V': 'bg-pink-100 text-pink-700',
    };

    const getUnitColor = (unitName) => {
        for (const [key, cls] of Object.entries(unitColors)) {
            if (unitName?.toUpperCase().includes(key)) return cls;
        }
        return 'bg-gray-100 text-gray-700';
    };

    const getProgressColor = (pct) => {
        if (pct > 75) return 'bg-green-500';
        if (pct >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    // AI badge helpers
    const getAiBadge = (report) => {
        if (report.ai_manually_reviewed) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">
                    <CheckSquare className="w-3 h-3" /> Reviewed
                </span>
            );
        }
        if (report.ai_verified) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg">
                    <ShieldCheck className="w-3 h-3" /> Verified
                </span>
            );
        }
        if (report.ai_low_confidence) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">
                    <ShieldAlert className="w-3 h-3" /> {report.ai_score}%
                </span>
            );
        }
        if (report.ai_flagged) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-lg animate-pulse">
                    <ShieldX className="w-3 h-3" /> {report.ai_score}%
                </span>
            );
        }
        return (
            <span className="text-xs text-gray-400">—</span>
        );
    };

    const getRowBorderClass = (report) => {
        if (report.ai_manually_reviewed) return 'border-l-4 border-l-blue-400';
        if (report.ai_flagged) return 'border-l-4 border-l-red-500';
        if (report.ai_low_confidence) return 'border-l-4 border-l-amber-400';
        if (report.ai_verified) return 'border-l-4 border-l-emerald-400';
        return '';
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Plan Reports</h1>
                    <p className="text-gray-500 mt-1">Track faculty teaching progress with AI verification</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Hours Planned"
                        value={summary?.totalPlannedHours || 0}
                        icon={Calendar}
                        color="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        title="Hours Completed"
                        value={summary?.totalCompletedHours || 0}
                        icon={CheckCircle2}
                        color="bg-green-100 text-green-600"
                    />
                    <StatCard
                        title="Hours Pending"
                        value={summary?.totalPendingHours || 0}
                        icon={Clock}
                        color="bg-orange-100 text-orange-600"
                    />
                    <StatCard
                        title="Dept Completion"
                        value={`${summary?.completionPercentage || 0}%`}
                        icon={BarChart3}
                        color="bg-blue-100 text-blue-600"
                        large
                    />
                </div>

                {/* AI Verification Filter Chips */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AI Verification Filter</p>
                    <div className="flex flex-wrap gap-2">
                        <FilterChip
                            label="All Reports"
                            count={aiCounts.all}
                            active={!appliedFilters.aiFilter || appliedFilters.aiFilter === 'all'}
                            onClick={() => setAiFilter('all')}
                            color="gray"
                        />
                        <FilterChip
                            label="✅ Verified"
                            count={aiCounts.verified}
                            active={appliedFilters.aiFilter === 'verified'}
                            onClick={() => setAiFilter('verified')}
                            color="emerald"
                        />
                        <FilterChip
                            label="⚠️ Low Confidence"
                            count={aiCounts.lowConfidence}
                            active={appliedFilters.aiFilter === 'low_confidence'}
                            onClick={() => setAiFilter('low_confidence')}
                            color="amber"
                        />
                        <FilterChip
                            label="🚩 Flagged"
                            count={aiCounts.flagged}
                            active={appliedFilters.aiFilter === 'flagged'}
                            onClick={() => setAiFilter('flagged')}
                            color="red"
                        />
                    </div>
                </div>

                {/* Subject Progress Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => setShowSubjectProgress(!showSubjectProgress)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                        <h3 className="font-semibold text-gray-900">Subject-wise Progress</h3>
                        {showSubjectProgress ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    {showSubjectProgress && summary?.subjects && (
                        <div className="px-6 pb-4 space-y-3">
                            {summary.subjects.map((sub, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{sub.subjectName}</p>
                                        <p className="text-xs text-gray-500">{sub.facultyName}</p>
                                    </div>
                                    <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all ${getProgressColor(sub.percentage)}`}
                                            style={{ width: `${sub.percentage}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-semibold w-16 text-right ${sub.percentage > 75 ? 'text-green-600' : sub.percentage >= 40 ? 'text-orange-600' : 'text-red-600'
                                        }`}>
                                        {sub.completed}/{sub.planned} ({sub.percentage}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        <input
                            value={filters.facultyId}
                            onChange={(e) => setFilters(p => ({ ...p, facultyId: e.target.value }))}
                            placeholder="Faculty ID"
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                            value={filters.subjectId}
                            onChange={(e) => setFilters(p => ({ ...p, subjectId: e.target.value }))}
                            placeholder="Subject ID"
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <select
                            value={filters.unitName}
                            onChange={(e) => setFilters(p => ({ ...p, unitName: e.target.value }))}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Units</option>
                            <option value="UNIT I">UNIT I</option>
                            <option value="UNIT II">UNIT II</option>
                            <option value="UNIT III">UNIT III</option>
                            <option value="UNIT IV">UNIT IV</option>
                            <option value="UNIT V">UNIT V</option>
                        </select>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(p => ({ ...p, startDate: e.target.value }))}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(p => ({ ...p, endDate: e.target.value }))}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={applyFilters}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-xl hover:bg-green-200 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export to Excel
                        </button>
                    </div>
                </div>

                {/* Results Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-600 font-medium">
                            Showing {sortedReports.length} of {pagination.total || reports.length} results
                        </p>
                    </div>

                    {reportsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : sortedReports.length === 0 ? (
                        <div className="text-center py-16">
                            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-3">No reports found for the selected filters</p>
                            <button onClick={clearFilters} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Faculty</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Subject</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Unit</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Topic</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Periods</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Submitted</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">AI Score</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Proof</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Materials</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedReports.map((r) => (
                                        <>
                                            <tr
                                                key={r.id}
                                                onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                                                className={`border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors ${getRowBorderClass(r)}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center uppercase">
                                                            {r.faculty_name?.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-gray-900 truncate max-w-[100px]">{r.faculty_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mr-1">{r.subject_code}</span>
                                                    <span className="text-gray-700 truncate">{r.subject_name}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${getUnitColor(r.unit_name)}`}>
                                                        {r.unit_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 max-w-[200px]">
                                                    <span className="text-gray-700 truncate block" title={r.topic_name}>
                                                        {r.topic_name?.length > 40 ? r.topic_name.slice(0, 40) + '...' : r.topic_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                        {r.periods_required}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(r.submitted_at)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (r.ai_score !== null && r.ai_score !== undefined) {
                                                                setAiDetailModal(r);
                                                            }
                                                        }}
                                                        className="inline-block"
                                                    >
                                                        {getAiBadge(r)}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setProofModal(`${apiBase}${r.proof_image_url}`); }}
                                                        className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all inline-block"
                                                    >
                                                        <img src={`${apiBase}${r.proof_image_url}`} alt="Proof" className="w-full h-full object-cover" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (r.materials?.length) setMaterialsModal(r.materials); }}
                                                        className={`text-xs font-semibold px-2 py-1 rounded-lg ${r.materials?.length ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' : 'bg-gray-100 text-gray-500'}`}
                                                    >
                                                        {r.materials?.length || 0} files
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Expanded detail */}
                                            {expandedRow === r.id && (
                                                <tr key={`detail-${r.id}`}>
                                                    <td colSpan={9} className="bg-gray-50 px-6 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">What was covered</p>
                                                                    <p className="text-sm text-gray-800">{r.what_was_covered}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Topic Details</p>
                                                                    <p className="text-sm text-gray-700">Unit: {r.unit_name}</p>
                                                                    {r.co_bloom && <p className="text-sm text-gray-700">CO/Bloom: {r.co_bloom}</p>}
                                                                    {r.teaching_method && <p className="text-sm text-gray-700">Method: {r.teaching_method}</p>}
                                                                    {r.reference_book && <p className="text-sm text-gray-700">Ref: {r.reference_book}</p>}
                                                                </div>
                                                                {/* AI Summary in expanded row */}
                                                                {r.ai_score !== null && r.ai_score !== undefined && (
                                                                    <div className={`rounded-xl p-3 border ${r.ai_verified ? 'bg-emerald-50 border-emerald-200' :
                                                                            r.ai_low_confidence ? 'bg-amber-50 border-amber-200' :
                                                                                'bg-red-50 border-red-200'
                                                                        }`}>
                                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">AI Verification</p>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            {getAiBadge(r)}
                                                                            <span className="text-sm font-bold text-gray-900">{r.ai_score}%</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-600 leading-relaxed">{r.ai_reason?.slice(0, 200)}</p>
                                                                        {r.staff_confirmed_flag && (
                                                                            <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Staff confirmed accuracy despite AI warning</p>
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setAiDetailModal(r); }}
                                                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                                                                        >
                                                                            View full breakdown →
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Proof</p>
                                                                    <img
                                                                        src={`${apiBase}${r.proof_image_url}`}
                                                                        alt="Proof"
                                                                        className="max-w-[400px] rounded-xl border border-gray-200 cursor-pointer"
                                                                        onClick={() => setProofModal(`${apiBase}${r.proof_image_url}`)}
                                                                    />
                                                                </div>
                                                                {r.materials?.length > 0 && (
                                                                    <div>
                                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Materials Released</p>
                                                                        {r.materials.map(m => (
                                                                            <p key={m.id} className="text-sm text-gray-700 flex items-center gap-2 py-0.5">
                                                                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                                                                {m.title}
                                                                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 rounded">{m.material_type}</span>
                                                                                <span className="text-xs text-gray-400">{formatDate(m.released_at)}</span>
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => changePage(pagination.page - 1)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => changePage(pagination.page + 1)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Proof Modal */}
            {proofModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
                    <img src={proofModal} alt="Proof" className="max-w-full max-h-[90vh] rounded-2xl" />
                </div>
            )}

            {/* Materials Modal */}
            {materialsModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setMaterialsModal(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Released Materials</h3>
                            <button onClick={() => setMaterialsModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {materialsModal.map(m => (
                                <a
                                    key={m.id}
                                    href={`${apiBase}${m.file_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                                        <p className="text-xs text-gray-500">{m.material_type}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Detail Modal */}
            {aiDetailModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setAiDetailModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className={`px-6 py-4 rounded-t-2xl ${aiDetailModal.ai_verified ? 'bg-emerald-50' :
                                aiDetailModal.ai_low_confidence ? 'bg-amber-50' : 'bg-red-50'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {aiDetailModal.ai_verified
                                        ? <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                        : aiDetailModal.ai_low_confidence
                                            ? <ShieldAlert className="w-6 h-6 text-amber-500" />
                                            : <ShieldX className="w-6 h-6 text-red-500" />
                                    }
                                    <div>
                                        <h3 className="font-bold text-gray-900">AI Verification Detail</h3>
                                        <p className="text-xs text-gray-500">{aiDetailModal.topic_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setAiDetailModal(null)} className="p-1.5 hover:bg-white/50 rounded-lg">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Overall score */}
                            <div className="mt-3 flex items-center gap-4">
                                <div className={`text-3xl font-black ${aiDetailModal.ai_verified ? 'text-emerald-600' :
                                        aiDetailModal.ai_low_confidence ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                    {aiDetailModal.ai_score}%
                                </div>
                                <div className="flex-1">
                                    <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${aiDetailModal.ai_verified ? 'bg-emerald-500' :
                                                    aiDetailModal.ai_low_confidence ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${aiDetailModal.ai_score}%` }}
                                        />
                                    </div>
                                </div>
                                {getAiBadge(aiDetailModal)}
                            </div>
                        </div>

                        {/* Layer Breakdown */}
                        <div className="px-6 py-4 space-y-4">
                            {/* Parse layer scores */}
                            {(() => {
                                let layers = aiDetailModal.ai_layer_scores;
                                if (typeof layers === 'string') {
                                    try { layers = JSON.parse(layers); } catch { layers = null; }
                                }

                                if (!layers) return <p className="text-sm text-gray-500">No detailed layer scores available.</p>;

                                return (
                                    <>
                                        <AiLayerDetail
                                            icon={<FileSearch className="w-4 h-4" />}
                                            label="Text Match"
                                            subtitle="Description vs Topic Name"
                                            data={layers.textMatch}
                                        />
                                        <AiLayerDetail
                                            icon={<Eye className="w-4 h-4" />}
                                            label="Image OCR"
                                            subtitle="Text detected in proof image"
                                            data={layers.ocrMatch}
                                        />
                                        <AiLayerDetail
                                            icon={<Brain className="w-4 h-4" />}
                                            label="Scene Analysis"
                                            subtitle="Image context classification"
                                            data={layers.sceneMatch}
                                        />
                                        <AiLayerDetail
                                            icon={<Wrench className="w-4 h-4" />}
                                            label="Aids & Methods"
                                            subtitle="Teaching consistency"
                                            data={layers.aidsMatch}
                                        />
                                    </>
                                );
                            })()}

                            {/* Full reason */}
                            {aiDetailModal.ai_reason && (
                                <div className="bg-gray-50 rounded-xl p-3 mt-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Full AI Analysis</p>
                                    <p className="text-xs text-gray-600 leading-relaxed">{aiDetailModal.ai_reason}</p>
                                </div>
                            )}

                            {/* Staff confirmed */}
                            {aiDetailModal.staff_confirmed_flag && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    <p className="text-xs text-amber-700 font-medium">
                                        ⚠️ Staff confirmed this report is accurate despite the AI warning.
                                    </p>
                                </div>
                            )}

                            {/* Proof image thumbnail */}
                            {aiDetailModal.proof_image_url && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Proof Image</p>
                                    <img
                                        src={`${apiBase}${aiDetailModal.proof_image_url}`}
                                        alt="Proof"
                                        className="max-w-full max-h-[150px] object-cover rounded-xl border border-gray-200 cursor-pointer"
                                        onClick={() => { setAiDetailModal(null); setProofModal(`${apiBase}${aiDetailModal.proof_image_url}`); }}
                                    />
                                </div>
                            )}

                            {/* Mark as Reviewed button */}
                            {(aiDetailModal.ai_flagged || aiDetailModal.ai_low_confidence) && !aiDetailModal.ai_manually_reviewed && (
                                <button
                                    onClick={() => handleMarkReviewed(aiDetailModal.id)}
                                    className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckSquare className="w-4 h-4" /> Mark as Manually Reviewed
                                </button>
                            )}

                            {aiDetailModal.ai_manually_reviewed && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                    <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                                        <CheckSquare className="w-3.5 h-3.5" /> This report has been manually reviewed and cleared.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, color, large }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">{title}</p>
                    <p className={`font-bold text-gray-900 ${large ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Filter Chip ─────────────────────────────────────────────

function FilterChip({ label, count, active, onClick, color }) {
    const colorStyles = {
        gray: active ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        emerald: active ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        amber: active ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
        red: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
    };

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${colorStyles[color] || colorStyles.gray}`}
        >
            {label}
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-200/50 text-gray-500'
                }`}>
                {count}
            </span>
        </button>
    );
}

// ─── AI Layer Detail ─────────────────────────────────────────

function AiLayerDetail({ icon, label, subtitle, data }) {
    if (!data) {
        return (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-50">
                <div className="text-gray-400">{icon}</div>
                <div>
                    <p className="text-xs font-bold text-gray-500">{label}</p>
                    <p className="text-xs text-gray-400">Not analyzed</p>
                </div>
            </div>
        );
    }

    const getBarColor = (s) => {
        if (s >= 70) return 'bg-emerald-500';
        if (s >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 mb-1.5">
                <div className="text-gray-500">{icon}</div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">{label}</span>
                        <span className={`text-sm font-black ${data.score >= 70 ? 'text-emerald-600' :
                                data.score >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>{data.score}%</span>
                    </div>
                    <p className="text-xs text-gray-400">{subtitle} · Weight: {data.weight}%</p>
                </div>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${getBarColor(data.score)}`} style={{ width: `${data.score}%` }} />
            </div>
            {data.reason && (
                <p className="text-xs text-gray-600 leading-relaxed">{data.reason}</p>
            )}
        </div>
    );
}
