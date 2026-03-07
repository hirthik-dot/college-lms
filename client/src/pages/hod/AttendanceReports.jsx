import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useApiQuery } from '../../hooks/useApi';
import { attendanceColor } from '../../utils/helpers';
import { HiOutlineChartBar, HiOutlineDownload } from 'react-icons/hi';
import Button from '../../components/common/Button';

export default function AttendanceReports() {
    const [subjectId, setSubjectId] = useState('');

    const { data: subjects } = useApiQuery('hod-subjects-reports', '/hod/subjects');
    // Dynamic fetch using standard hook configuration assuming endpoint handles subjectId
    // Wait, does the backend have /hod/attendance-reports? 
    // Let's assume it does, or we simulate it. I'll use the report endpoint I created in the backend if there is one, otherwise mock it visually since it's a scaffold.
    // Looking at my backend generated routes, I had:
    // router.get('/reports/attendance', authorize('hod', 'admin'), getDeptAttendanceReport);

    const { data: reports, isLoading } = useApiQuery(
        ['hod-attendance-reports', subjectId],
        `/hod/reports/attendance${subjectId ? `?subjectId=${subjectId}` : ''}`
    );

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Attendance Reports</h1>
                        <p className="text-surface-500 mt-1">Review department-wide attendance patterns and student shortage lists.</p>
                    </div>
                    <Button variant="secondary" className="sm:w-auto w-full">
                        <HiOutlineDownload className="w-5 h-5 -ml-1 mr-2" />
                        Export CSV
                    </Button>
                </div>

                <Card padding="p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-surface-700">Filter by Subject:</label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">All Subjects Overview</option>
                            {subjects?.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>
                </Card>

                {isLoading ? (
                    <p className="text-surface-500">Loading reports...</p>
                ) : reports?.length > 0 ? (
                    <Card>
                        <CardHeader className="flex justify-between items-center bg-surface-50 -mt-2 -mx-2 px-6 py-4 rounded-t-2xl border-b border-surface-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                                    <HiOutlineChartBar className="w-5 h-5" />
                                </div>
                                <CardTitle>Attendance Shortage List (Below 75%)</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Student Name</th>
                                        {/* If subject specific isn't passed, we might show overall or subject specific list */}
                                        {!subjectId && <th className="text-left py-3 px-4 font-medium text-surface-600">Subject</th>}
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Total Classes</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Attended</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r, idx) => {
                                        const pct = r.percentage !== undefined ? parseFloat(r.percentage) :
                                            (r.present && r.total_classes) ? Math.round((r.present / r.total_classes) * 100) : 0;

                                        if (pct >= 75 && subjectId) return null; // Simple client-side filter for demo if not handled by backend

                                        return (
                                            <tr key={idx} className="border-b border-surface-100 hover:bg-surface-50">
                                                <td className="py-3 px-4 font-medium text-surface-900">{r.student_name}</td>
                                                {!subjectId && <td className="py-3 px-4 text-surface-700">{r.subject_code || 'All Overview'}</td>}
                                                <td className="py-3 px-4 text-right text-surface-600">{r.total_classes || r.total}</td>
                                                <td className="py-3 px-4 text-right font-medium text-surface-900">{r.present}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <Badge variant="danger" dot>{pct}%</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <Card><p className="py-8 text-center text-surface-500">No report data found. (Data required to establish base)</p></Card>
                )}
            </div>
        </PageWrapper>
    );
}
