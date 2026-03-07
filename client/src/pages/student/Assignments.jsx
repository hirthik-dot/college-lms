import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { formatDate } from '../../utils/helpers';

export default function Assignments() {
    const [subjectId, setSubjectId] = useState('');
    const { data: subjects } = useApiQuery('student-subjects', '/subjects');
    const { data: assignments, isLoading } = useApiQuery(
        ['student-assignments', subjectId],
        `/students/assignments?subjectId=${subjectId}`,
        { enabled: !!subjectId }
    );

    const submitMutation = useApiMutation('', 'post', {
        invalidateKeys: [['student-assignments', subjectId]],
    });

    const handleSubmit = async (assignmentId) => {
        const content = prompt('Enter your submission text:');
        if (!content) return;

        submitMutation.mutate(
            { content },
            {
                onSuccess: () => alert('Assignment submitted successfully!'),
                onError: (err) => alert(err.response?.data?.message || 'Submission failed'),
            }
        );
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Assignments</h1>
                    <p className="text-surface-500 mt-1">View and submit your assignments.</p>
                </div>

                <Card padding="p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-surface-700">Subject:</label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value="">Select a subject</option>
                            {subjects?.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {!subjectId && (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">
                            Please select a subject to view assignments.
                        </p>
                    </Card>
                )}

                {isLoading && <p className="text-surface-500">Loading…</p>}

                {assignments?.length > 0 && (
                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <Card key={assignment.id} className="animate-slide-up">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-surface-900">{assignment.title}</h3>
                                        {assignment.description && (
                                            <p className="text-sm text-surface-600 mt-1">{assignment.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-2xs text-surface-500">
                                            <span>Due: {formatDate(assignment.due_date)}</span>
                                            {assignment.max_marks && <span>Max Marks: {assignment.max_marks}</span>}
                                            <span>By: {assignment.created_by_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Badge variant="primary">Active</Badge>
                                        <Button size="sm" onClick={() => handleSubmit(assignment.id)}>
                                            Submit
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {subjectId && !isLoading && assignments?.length === 0 && (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">
                            No assignments found for this subject.
                        </p>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
