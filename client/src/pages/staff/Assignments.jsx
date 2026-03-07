import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { formatDate } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlineEye } from 'react-icons/hi';

export default function StaffAssignments() {
    const [modalOpen, setModalOpen] = useState(false);
    const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [subjectId, setSubjectId] = useState('');

    const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', maxMarks: 100 });

    const { data: dashboardData } = useApiQuery('staff-dashboard', '/staff/dashboard');
    const subjects = dashboardData?.mySubjects || [];

    const { data: assignments, isLoading, refetch } = useApiQuery(
        ['staff-assignments', subjectId],
        `/assignments/subject/${subjectId}`,
        { enabled: !!subjectId }
    );

    const { data: submissions, isLoading: loadingSubs, refetch: refetchSubs } = useApiQuery(
        ['staff-submissions', selectedAssignment?.id],
        `/assignments/${selectedAssignment?.id}/submissions`,
        { enabled: !!selectedAssignment }
    );

    const createMutation = useApiMutation('/staff/assignments', 'post', {
        invalidateKeys: [['staff-assignments', subjectId]],
    });

    const gradeMutation = useApiMutation(
        `/staff/assignments/submissions/${selectedAssignment?.id}/grade`, // we will replace this ID dynamically
        'put'
    );

    const handleCreate = (e) => {
        e.preventDefault();
        if (!subjectId) return alert('Select subject');

        createMutation.mutate(
            { ...formData, subjectId },
            {
                onSuccess: () => {
                    setModalOpen(false);
                    setFormData({ title: '', description: '', dueDate: '', maxMarks: 100 });
                    alert('Assignment created successfully');
                    refetch();
                },
                onError: (err) => alert(err.response?.data?.message || 'Failed'),
            }
        );
    };

    const handleGrade = async (submissionId) => {
        const marks = prompt(`Enter marks (out of ${selectedAssignment?.max_marks}):`);
        if (marks === null || marks === '') return;

        const feedback = prompt('Enter optional feedback:') || '';

        try {
            // Dynamic endpoint since the hook requires static initialization typically, but we use mutationFn which can accept url overrides in some wrappers, or we create a new instance.
            // Easiest is to use the raw api here or dynamically pass it to useApiMutation by re-rendering.
            // Since `useApiMutation` takes the url at creation, let's just make a raw API call or reconstruct it.
            // For simplicity, I'll use raw fetch via the hook but since the URL changes, it's better to fetch directly.
            const api = (await import('../../utils/api')).default;
            await api.put(`/staff/assignments/submissions/${submissionId}/grade`, { marks: Number(marks), feedback });
            alert('Graded successfully');
            refetchSubs();
        } catch (err) {
            alert('Failed to grade.');
        }
    };

    const viewSubmissions = (assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionsModalOpen(true);
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Manage Assignments</h1>
                        <p className="text-surface-500 mt-1">Create assignments and grade student submissions.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} className="sm:w-auto w-full">
                        <HiOutlinePlus className="w-5 h-5 -ml-1" />
                        New Assignment
                    </Button>
                </div>

                <Card padding="p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-surface-700">Subject:</label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="">Select a subject</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {!subjectId ? (
                    <Card><p className="py-8 text-center text-surface-500">Please select a subject.</p></Card>
                ) : isLoading ? (
                    <p>Loading...</p>
                ) : assignments?.length > 0 ? (
                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <Card key={assignment.id} className="animate-slide-up">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-surface-900">{assignment.title}</h3>
                                        {assignment.description && <p className="text-sm text-surface-600 mt-1">{assignment.description}</p>}
                                        <div className="flex items-center gap-4 mt-3 text-2xs text-surface-500">
                                            <span>Due: {formatDate(assignment.due_date)}</span>
                                            <span>Max Marks: {assignment.max_marks}</span>
                                            <span className="bg-surface-100 text-surface-700 px-2 py-0.5 rounded-full">
                                                {assignment.status || 'open'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <Button variant="secondary" size="sm" onClick={() => viewSubmissions(assignment)}>
                                            <HiOutlineEye className="w-4 h-4 mr-2" />
                                            Submissions
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card><p className="py-8 text-center text-surface-500">No assignments created yet.</p></Card>
                )}

                {/* Create Modal */}
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Assignment">
                    <form onSubmit={handleCreate} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Subject *</label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select subject…</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Lab Assignment 1"
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-surface-700">Description</label>
                            <textarea
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Instructions..."
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Due Date"
                                type="date"
                                required
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                            <Input
                                label="Max Marks"
                                type="number"
                                required
                                min={0}
                                value={formData.maxMarks}
                                onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value, 10) })}
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3 border-t border-surface-200 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={createMutation.isPending}>Create Assignment</Button>
                        </div>
                    </form>
                </Modal>

                {/* Submissions Modal */}
                <Modal size="xl" isOpen={submissionsModalOpen} onClose={() => setSubmissionsModalOpen(false)} title={`Submissions: ${selectedAssignment?.title}`}>
                    {loadingSubs ? (
                        <p>Loading submissions...</p>
                    ) : submissions?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Student</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Submitted At</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Marks</th>
                                        <th className="text-center py-3 px-4 font-medium text-surface-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((sub) => (
                                        <tr key={sub.id} className="border-b border-surface-100">
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-surface-900">{sub.student_name}</p>
                                                <p className="text-2xs text-surface-500">{sub.student_email}</p>
                                            </td>
                                            <td className="py-3 px-4 text-surface-700">{formatDate(sub.submitted_at)}</td>
                                            <td className="py-3 px-4">
                                                {sub.marks !== null ? (
                                                    <Badge variant="success">{sub.marks} / {selectedAssignment?.max_marks}</Badge>
                                                ) : (
                                                    <Badge variant="warning">Ungraded</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Button size="sm" variant="secondary" onClick={() => handleGrade(sub.id)}>
                                                    {sub.marks !== null ? 'Update Grade' : 'Grade'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="py-8 text-center text-surface-500">No submissions yet.</p>
                    )}
                </Modal>
            </div>
        </PageWrapper>
    );
}
