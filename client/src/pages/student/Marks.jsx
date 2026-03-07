import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useApiQuery } from '../../hooks/useApi';

export default function Marks() {
    const { data: marks, isLoading } = useApiQuery('student-marks', '/students/marks');

    // Group marks by subject
    const groupedMarks = marks?.reduce((acc, mark) => {
        const key = mark.subject_name;
        if (!acc[key]) acc[key] = { subjectCode: mark.subject_code, marks: [] };
        acc[key].marks.push(mark);
        return acc;
    }, {});

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">My Marks</h1>
                    <p className="text-surface-500 mt-1">View your exam and assessment marks.</p>
                </div>

                {isLoading ? (
                    <p className="text-surface-500">Loading…</p>
                ) : groupedMarks && Object.keys(groupedMarks).length > 0 ? (
                    Object.entries(groupedMarks).map(([subjectName, { subjectCode, marks: subjectMarks }]) => (
                        <Card key={subjectName}>
                            <CardHeader>
                                <CardTitle>
                                    {subjectName}{' '}
                                    <span className="text-sm font-normal text-surface-500">({subjectCode})</span>
                                </CardTitle>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-surface-200">
                                            <th className="text-left py-3 px-4 font-medium text-surface-600">Exam Type</th>
                                            <th className="text-left py-3 px-4 font-medium text-surface-600">Marks</th>
                                            <th className="text-left py-3 px-4 font-medium text-surface-600">Max</th>
                                            <th className="text-left py-3 px-4 font-medium text-surface-600">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectMarks.map((mark, idx) => {
                                            const pct = mark.max_marks
                                                ? Math.round((mark.marks / mark.max_marks) * 100)
                                                : 0;
                                            return (
                                                <tr
                                                    key={idx}
                                                    className="border-b border-surface-100 hover:bg-surface-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-surface-900 capitalize">
                                                        {mark.exam_type}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-surface-900">{mark.marks}</td>
                                                    <td className="py-3 px-4 text-surface-600">{mark.max_marks}</td>
                                                    <td className="py-3 px-4">
                                                        <Badge
                                                            variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}
                                                        >
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
                    ))
                ) : (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">No marks available yet.</p>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
