import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { useApiMutation, useApiQuery } from '../../hooks/useApi';
import api from '../../utils/api';
import { HiOutlineBookOpen, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineUsers } from 'react-icons/hi2';

export default function ManageSubjects() {
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', code: '', staffId: '', semester: '1' });

    // Enroll state
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [enrollSubject, setEnrollSubject] = useState(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    const { data: subjects, isLoading, refetch } = useApiQuery('hod-subjects', '/hod/subjects');
    const { data: staffList } = useApiQuery('hod-staff-list', '/hod/staff');
    const { data: studentList } = useApiQuery('hod-student-list', '/hod/students');

    const createMutation = useApiMutation('/hod/subjects', 'post', { invalidateKeys: [['hod-subjects']] });
    const updateMutation = useApiMutation(`/hod/subjects/${formData.id}`, 'put', { invalidateKeys: [['hod-subjects']] });
    const enrollMutation = useApiMutation(`/hod/subjects/${enrollSubject?.id}/enroll`, 'post', { invalidateKeys: [['hod-subjects']] });

    const handleOpenCreate = () => {
        setIsEditMode(false);
        setFormData({ id: '', name: '', code: '', staffId: '', semester: '1' });
        setModalOpen(true);
    };

    const handleOpenEdit = (subject) => {
        setIsEditMode(true);
        setFormData({
            id: subject.id,
            name: subject.name,
            code: subject.code,
            staffId: subject.staff_id || '',
            semester: subject.semester || '1'
        });
        setModalOpen(true);
    };

    const handleOpenEnroll = (subject) => {
        setEnrollSubject(subject);
        setSelectedStudentIds([]); // Start empty, could pre-fetch enrolled if endpoint exists
        setEnrollModalOpen(true);
    };

    const toggleStudent = (id) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleEnrollSubmit = (e) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0) return alert('Select at least one student.');

        enrollMutation.mutate(
            { studentIds: selectedStudentIds },
            {
                onSuccess: (res) => {
                    setEnrollModalOpen(false);
                    alert(`Successfully enrolled students.`);
                    refetch();
                },
                onError: (err) => alert(err.response?.data?.message || 'Enrollment failed')
            }
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            updateMutation.mutate(
                { name: formData.name, code: formData.code, staffId: formData.staffId || null, semester: parseInt(formData.semester, 10) },
                {
                    onSuccess: () => {
                        setModalOpen(false);
                        alert('Subject updated successfully');
                        refetch();
                    },
                    onError: (err) => alert(err.response?.data?.message || 'Update failed'),
                }
            );
        } else {
            createMutation.mutate(
                { name: formData.name, code: formData.code, staffId: formData.staffId || null, semester: parseInt(formData.semester, 10) },
                {
                    onSuccess: () => {
                        setModalOpen(false);
                        alert('Subject created successfully');
                        refetch();
                    },
                    onError: (err) => alert(err.response?.data?.message || 'Creation failed'),
                }
            );
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this subject? This action cannot be easily undone.')) return;
        try {
            await api.delete(`/hod/subjects/${id}`);
            refetch();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Manage Subjects</h1>
                        <p className="text-surface-500 mt-1">Create curriculum subjects and assign teaching staff.</p>
                    </div>
                    <Button onClick={handleOpenCreate} className="sm:w-auto w-full">
                        <HiOutlineBookOpen className="w-5 h-5 -ml-1" />
                        New Subject
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Subject Catalog</CardTitle>
                        <Badge variant="primary">{subjects?.length || 0} Total</Badge>
                    </CardHeader>
                    {isLoading ? (
                        <p className="text-surface-500 text-sm">Loading catalog...</p>
                    ) : subjects?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Subject</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Semester</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Assigned Staff</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((s) => (
                                        <tr key={s.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-surface-900">{s.name}</p>
                                                <p className="text-2xs font-mono text-surface-500">{s.code}</p>
                                            </td>
                                            <td className="py-3 px-4 text-surface-700">Sem {s.semester || 'N/A'}</td>
                                            <td className="py-3 px-4">
                                                {s.staff_id ? (
                                                    <Badge variant="success" dot>{s.staff_name}</Badge>
                                                ) : (
                                                    <Badge variant="warning">Unassigned</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEnroll(s)}
                                                    className="p-1.5 rounded bg-surface-100 text-surface-600 hover:text-green-600 hover:bg-green-50 transition-colors"
                                                    title="Enroll Students"
                                                >
                                                    <HiOutlineUsers className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(s)}
                                                    className="p-1.5 rounded bg-surface-100 text-surface-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <HiOutlinePencilSquare className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-1.5 rounded bg-surface-100 text-surface-600 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                                                    title="Remove"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="py-8 text-center text-surface-500">No subjects found.</p>
                    )}
                </Card>

                {/* Create/Edit Modal */}
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditMode ? 'Edit Subject Details' : 'Create New Subject'}>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Input
                                    label="Subject Name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Data Structures"
                                />
                            </div>
                            <Input
                                label="Code"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="CS101"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Assign Staff</label>
                                <select
                                    value={formData.staffId}
                                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Unassigned --</option>
                                    {staffList?.map((st) => (
                                        <option key={st.id} value={st.id}>{st.name || st.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Semester"
                                type="number"
                                min={1}
                                max={10}
                                required
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 border-t border-surface-200 mt-6 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={isEditMode ? updateMutation.isPending : createMutation.isPending}>
                                {isEditMode ? 'Save Changes' : 'Create Subject'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Enroll Modal */}
                <Modal isOpen={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} title={`Enroll Students: ${enrollSubject?.name}`}>
                    <form onSubmit={handleEnrollSubmit} className="space-y-4 pt-2">
                        <p className="text-sm text-surface-500 -mt-2 mb-2">
                            Select students to bulk enroll them. Students already enrolled will be skipped.
                        </p>

                        <div className="max-h-60 overflow-y-auto border border-surface-200 rounded-lg p-3 space-y-2">
                            {studentList?.map(student => (
                                <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-surface-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-surface-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudentIds.includes(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="w-4 h-4 text-primary-600 border-surface-300 rounded focus:ring-primary-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-surface-900">{student.full_name || student.name}</p>
                                        <p className="text-2xs text-surface-500">{student.email}</p>
                                    </div>
                                </label>
                            ))}
                            {(!studentList || studentList.length === 0) && (
                                <p className="text-sm text-surface-500 text-center py-4">No students available.</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-surface-200 mt-6 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setEnrollModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={enrollMutation.isPending} disabled={selectedStudentIds.length === 0}>
                                Enroll {selectedStudentIds.length} Student(s)
                            </Button>
                        </div>
                    </form>
                </Modal>

            </div>
        </PageWrapper>
    );
}
