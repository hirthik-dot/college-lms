import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { HiOutlinePlus } from 'react-icons/hi';
import { percentage } from '../../utils/helpers';

export default function GradeBook() {
    const [subjectId, setSubjectId] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ studentId: '', examType: 'midterm', marks: '', maxMarks: 100 });

    const { data: dashboardData } = useApiQuery('staff-dashboard', '/staff/dashboard');
    const subjects = dashboardData?.mySubjects || [];

    const { data: marks, isLoading, refetch } = useApiQuery(
        ['staff-marks', subjectId],
        `/staff/marks/${subjectId}`,
        { enabled: !!subjectId }
    );

    const { data: students } = useApiQuery(
        ['staff-students-gradebook', dashboardData?.user?.department_id],
        '/hod/students',
        { enabled: !!dashboardData?.user?.department_id }
    );

    const saveMutation = useApiMutation('/staff/marks', 'post', {
        invalidateKeys: [['staff-marks', subjectId]],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!subjectId) return alert('Select subject');

        saveMutation.mutate(
            {
                studentId: parseInt(formData.studentId, 10),
                subjectId,
                examType: formData.examType,
                marks: parseFloat(formData.marks),
                maxMarks: parseInt(formData.maxMarks, 10),
            },
            {
                onSuccess: () => {
                    setModalOpen(false);
                    setFormData({ studentId: '', examType: 'midterm', marks: '', maxMarks: 100 });
                    alert('Marks recorded successfully');
                    refetch();
                },
                onError: (err) => alert(err.response?.data?.message || 'Failed to save marks'),
            }
        );
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Grade Book</h1>
                        <p className="text-surface-500 mt-1">Manage exam marks for your subjects.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)}>
                        <HiOutlinePlus className="w-5 h-5 -ml-1" />
                        Enter Marks
                    </Button>
                </div>

                <Card padding="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium text-surface-700 block mb-1">Subject:</label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Select subject</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {!subjectId ? (
                    <Card><p className="py-8 text-center text-surface-500">Select a subject to view grades.</p></Card>
                ) : isLoading ? (
                    <p>Loading...</p>
                ) : marks?.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Entered Marks</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Student</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Exam Type</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Marks</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Max</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marks.map((m) => {
                                        const pct = percentage(m.marks, m.max_marks);
                                        return (
                                            <tr key={m.id} className="border-b border-surface-100 hover:bg-surface-50">
                                                <td className="py-3 px-4 font-medium text-surface-900">{m.student_name}</td>
                                                <td className="py-3 px-4 capitalize text-surface-700">{m.exam_type}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-surface-900">{m.marks}</td>
                                                <td className="py-3 px-4 text-right text-surface-600">{m.max_marks}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <Badge variant={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>{pct}%</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <Card><p className="py-8 text-center text-surface-500">No marks entered for this subject yet.</p></Card>
                )}

                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Enter student marks">
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Subject</label>
                            <select
                                required
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select subject</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Student</label>
                            <select
                                required
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select student</option>
                                {students?.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Exam Type</label>
                            <select
                                required
                                value={formData.examType}
                                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="midterm">Midterm</option>
                                <option value="final">Final Exam</option>
                                <option value="assignment">Assignment</option>
                                <option value="quiz">Quiz</option>
                                <option value="practical">Practical</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Marks Obtained"
                                type="number"
                                step="0.01"
                                min={0}
                                required
                                value={formData.marks}
                                onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                            />
                            <Input
                                label="Maximum Marks"
                                type="number"
                                min={1}
                                required
                                value={formData.maxMarks}
                                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 border-t border-surface-200 mt-6 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={saveMutation.isPending}>Save Marks</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageWrapper>
    );
}
