import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { useApiMutation, useApiQuery } from '../../hooks/useApi';
import api from '../../utils/api';
import { HiOutlineUserPlus, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';

export default function ManageStaff() {
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', phone: '' });

    const { data: staff, isLoading, refetch } = useApiQuery('hod-staff', '/hod/staff');

    const createMutation = useApiMutation('/hod/staff', 'post', { invalidateKeys: [['hod-staff']] });
    const updateMutation = useApiMutation(`/hod/staff/${formData.id}`, 'put', { invalidateKeys: [['hod-staff']] });

    const handleOpenCreate = () => {
        setIsEditMode(false);
        setFormData({ id: '', name: '', email: '', password: '', phone: '' });
        setModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setIsEditMode(true);
        setFormData({ id: user.id, name: user.name, email: user.email, password: '', phone: user.phone || '' });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            updateMutation.mutate(
                { name: formData.name, phone: formData.phone },
                {
                    onSuccess: () => {
                        setModalOpen(false);
                        alert('Staff updated successfully');
                        refetch();
                    },
                    onError: (err) => alert(err.response?.data?.message || 'Update failed'),
                }
            );
        } else {
            createMutation.mutate(
                formData,
                {
                    onSuccess: () => {
                        setModalOpen(false);
                        alert('Staff added successfully');
                        refetch();
                    },
                    onError: (err) => alert(err.response?.data?.message || 'Creation failed'),
                }
            );
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this staff member completely?')) return;
        try {
            await api.delete(`/hod/staff/${id}`);
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
                        <h1 className="text-2xl font-bold text-surface-900">Manage Staff</h1>
                        <p className="text-surface-500 mt-1">Add, update, or remove department staff.</p>
                    </div>
                    <Button onClick={handleOpenCreate} className="sm:w-auto w-full">
                        <HiOutlineUserPlus className="w-5 h-5 -ml-1" />
                        Add Staff
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Staff Directory</CardTitle>
                        <Badge variant="primary">{staff?.length || 0} Total</Badge>
                    </CardHeader>
                    {isLoading ? (
                        <p className="text-surface-500">Loading...</p>
                    ) : staff?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Profile</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Contact</th>
                                        <th className="text-center py-3 px-4 font-medium text-surface-600">Role</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((s) => (
                                        <tr key={s.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={s.name} size="md" />
                                                    <div>
                                                        <p className="font-semibold text-surface-900">{s.name}</p>
                                                        <p className="text-2xs text-surface-500">ID: STF-{s.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-surface-700">{s.email}</p>
                                                <p className="text-2xs text-surface-500">{s.phone || 'No phone'}</p>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="accent">Staff</Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
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
                        <p className="py-8 text-center text-surface-500">No staff members found.</p>
                    )}
                </Card>

                {/* Create/Edit Modal */}
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditMode ? 'Edit Staff Details' : 'Add New Staff'}>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <Input
                            label="Full Name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Dr. Jane Smith"
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            required={!isEditMode}
                            disabled={isEditMode} // Cannot easily change email in this simplified flow
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jane.smith@college.edu"
                        />
                        {!isEditMode && (
                            <Input
                                label="Temporary Password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Include upper, lower, numbers, symbols (min 8 chars)"
                                helperText="Must be strong. Staff will use this to sign in."
                            />
                        )}
                        <Input
                            label="Phone Number"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 234 567 8900"
                        />
                        <div className="flex justify-end gap-3 border-t border-surface-200 mt-6 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={isEditMode ? updateMutation.isPending : createMutation.isPending}>
                                {isEditMode ? 'Save Changes' : 'Create Staff'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageWrapper>
    );
}
