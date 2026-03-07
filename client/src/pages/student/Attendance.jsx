import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useApiQuery } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, attendanceColor } from '../../utils/helpers';

export default function Attendance() {
    const { user } = useAuth();
    const [subjectId, setSubjectId] = useState('');

    const { data: subjects } = useApiQuery('student-subjects', '/subjects');
    const { data: attendance, isLoading } = useApiQuery(
        ['student-attendance', subjectId],
        `/students/attendance${subjectId ? `?subjectId=${subjectId}` : ''}`,
        { enabled: true }
    );

    const statusBadge = {
        present: 'success',
        absent: 'danger',
        late: 'warning',
        excused: 'info',
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">My Attendance</h1>
                    <p className="text-surface-500 mt-1">Track your attendance across all subjects.</p>
                </div>

                {/* Filter */}
                <Card padding="p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-surface-700">Subject:</label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value="">All Subjects</option>
                            {subjects?.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* Summary */}
                {attendance?.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <Card className="text-center">
                            <p className="text-2xs text-surface-500 uppercase tracking-wide">Total</p>
                            <p className="text-2xl font-bold text-surface-900">{attendance.summary.total_classes}</p>
                        </Card>
                        <Card className="text-center">
                            <p className="text-2xs text-surface-500 uppercase tracking-wide">Present</p>
                            <p className="text-2xl font-bold text-accent-600">{attendance.summary.present}</p>
                        </Card>
                        <Card className="text-center">
                            <p className="text-2xs text-surface-500 uppercase tracking-wide">Absent</p>
                            <p className="text-2xl font-bold text-danger-500">{attendance.summary.absent}</p>
                        </Card>
                        <Card className="text-center">
                            <p className="text-2xs text-surface-500 uppercase tracking-wide">Late</p>
                            <p className="text-2xl font-bold text-warning-500">{attendance.summary.late}</p>
                        </Card>
                        <Card className="text-center">
                            <p className="text-2xs text-surface-500 uppercase tracking-wide">Percentage</p>
                            <p className={`text-2xl font-bold ${attendanceColor(attendance.summary.percentage)}`}>
                                {attendance.summary.percentage}%
                            </p>
                        </Card>
                    </div>
                )}

                {/* Records Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Records</CardTitle>
                    </CardHeader>
                    {isLoading ? (
                        <p className="text-surface-500 text-sm">Loading…</p>
                    ) : attendance?.records?.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Subject</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.records.map((record, idx) => (
                                        <tr
                                            key={idx}
                                            className="border-b border-surface-100 hover:bg-surface-50 transition-colors"
                                        >
                                            <td className="py-3 px-4 text-surface-900">{formatDate(record.date)}</td>
                                            <td className="py-3 px-4 text-surface-700">
                                                {record.subject_name} ({record.subject_code})
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={statusBadge[record.status]} dot>
                                                    {record.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-surface-500 text-sm">No attendance records found.</p>
                    )}
                </Card>
            </div>
        </PageWrapper>
    );
}
