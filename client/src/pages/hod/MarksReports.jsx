import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useApiQuery } from '../../hooks/useApi';
import { percentage } from '../../utils/helpers';
import { HiOutlineDocumentDownload, HiOutlineChartBar } from 'react-icons/hi';

export default function MarksReports() {
    const [subjectId, setSubjectId] = useState('');

    const { data: subjects } = useApiQuery('hod-subjects-reports', '/hod/subjects');
    // I created a `/hod/reports/marks` route previously
    const { data: reports, isLoading } = useApiQuery(
        ['hod-marks-reports', subjectId],
        `/hod/reports/marks${subjectId ? `?subjectId=${subjectId}` : ''}`,
        { enabled: true }
    );

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Department Marks Reports</h1>
                        <p className="text-surface-500 mt-1">Review student performance across subjects and assessments.</p>
                    </div>
                    <Button variant="secondary" className="sm:w-auto w-full">
                        <HiOutlineDocumentDownload className="w-5 h-5 -ml-1 mr-2" />
                        Download Report
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
                    <p className="text-surface-500">Loading details...</p>
                ) : reports?.length > 0 ? (
                    <Card>
                        <CardHeader className="flex justify-between items-center bg-surface-50 -mt-2 -mx-2 px-6 py-4 rounded-t-2xl border-b border-surface-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-100 text-accent-600 rounded-lg">
                                    <HiOutlineChartBar className="w-5 h-5" />
                                </div>
                                <CardTitle>Performance List</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Student Name</th>
                                        {!subjectId && <th className="text-left py-3 px-4 font-medium text-surface-600">Subject</th>}
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Exam Type</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Marks Secured</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Max Marks</th>
                                        <th className="text-center py-3 px-4 font-medium text-surface-600">Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r, idx) => {
                                        const pct = percentage(r.marks, r.max_marks);
                                        return (
                                            <tr key={idx} className="border-b border-surface-100 hover:bg-surface-50">
                                                <td className="py-3 px-4 font-medium text-surface-900">{r.student_name}</td>
                                                {!subjectId && <td className="py-3 px-4 text-surface-700">{r.subject_code}</td>}
                                                <td className="py-3 px-4 capitalize text-surface-600">{r.exam_type}</td>
                                                <td className="py-3 px-4 text-right font-medium text-surface-900">{r.marks}</td>
                                                <td className="py-3 px-4 text-right text-surface-600">{r.max_marks}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge variant={pct >= 80 ? 'success' : pct >= 50 ? 'primary' : 'danger'}>
                                                        {pct}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <Card><p className="py-8 text-center text-surface-500">No marks entries found matching criteria.</p></Card>
                )}
            </div>
        </PageWrapper>
    );
}
