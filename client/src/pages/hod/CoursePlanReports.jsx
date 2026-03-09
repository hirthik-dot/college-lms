import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { useApiQuery } from '../../hooks/useApi';
import api from '../../utils/api';
import {
    Calendar, CheckCircle2, Clock, BarChart3, Filter,
    ChevronDown, ChevronUp, Download, X, Image, FileText, Loader2
} from 'lucide-react';

export default function CoursePlanReports() {
    const [filters, setFilters] = useState({
        facultyId: '', subjectId: '', unitName: '', startDate: '', endDate: '', status: '', page: 1,
    });
    const [appliedFilters, setAppliedFilters] = useState({ page: 1 });
    const [expandedRow, setExpandedRow] = useState(null);
    const [showSubjectProgress, setShowSubjectProgress] = useState(false);
    const [proofModal, setProofModal] = useState(null);
    const [materialsModal, setMaterialsModal] = useState(null);

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
    const { data: reportsData, isLoading: reportsLoading } = useApiQuery(
        ['hod-course-plan-reports', appliedFilters],
        `/hod/course-plan/reports?${buildQueryString()}`
    );

    const reports = reportsData?.reports || [];
    const pagination = reportsData?.pagination || {};

    const applyFilters = () => {
        setAppliedFilters({ ...filters, page: 1 });
    };

    const clearFilters = () => {
        const empty = { facultyId: '', subjectId: '', unitName: '', startDate: '', endDate: '', status: '', page: 1 };
        setFilters(empty);
        setAppliedFilters({ page: 1 });
    };

    const changePage = (newPage) => {
        setAppliedFilters(prev => ({ ...prev, page: newPage }));
    };

    // Export to Excel
    const handleExport = async () => {
        try {
            const XLSX = await import('xlsx');
            const rows = reports.map(r => ({
                Faculty: r.faculty_name,
                Subject: `${r.subject_code} - ${r.subject_name}`,
                Unit: r.unit_name,
                Topic: r.topic_name,
                Periods: r.periods_required,
                'Submitted At': new Date(r.submitted_at).toLocaleString(),
                'What Was Covered': r.what_was_covered,
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

    return (
        <PageWrapper>
            <div className="space-y-6">
                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Plan Reports</h1>
                    <p className="text-gray-500 mt-1">Track faculty teaching progress</p>
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
                            Showing {reports.length} of {pagination.total || 0} results
                        </p>
                    </div>

                    {reportsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : reports.length === 0 ? (
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
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Covered</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Proof</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Materials</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r) => (
                                        <>
                                            <tr
                                                key={r.id}
                                                onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                                                className="border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
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
                                                <td className="px-4 py-3 text-gray-600 max-w-[150px]">
                                                    <span className="truncate block">{r.what_was_covered?.slice(0, 60)}{r.what_was_covered?.length > 60 ? '...' : ''}</span>
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
