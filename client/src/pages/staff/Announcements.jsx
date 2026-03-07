import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/helpers';
import { HiOutlineSpeakerphone } from 'react-icons/hi';
import { HiOutlineTrash } from 'react-icons/hi2';
import api from '../../utils/api';

export default function StaffAnnouncements() {
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', targetRole: '' });

    const { data: announcements, isLoading, refetch } = useApiQuery('staff-announcements', '/announcements');

    const createMutation = useApiMutation('/staff/announcements', 'post', {
        invalidateKeys: [['staff-announcements']],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(
            {
                title: formData.title,
                content: formData.content,
                targetRole: formData.targetRole || null,
            },
            {
                onSuccess: () => {
                    setModalOpen(false);
                    setFormData({ title: '', content: '', targetRole: '' });
                    alert('Announcement posted!');
                    refetch();
                },
                onError: (err) => alert(err.response?.data?.message || 'Failed to post'),
            }
        );
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            refetch();
        } catch (err) {
            alert('Failed to delete.');
        }
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Announcements</h1>
                        <p className="text-surface-500 mt-1">Broadcast information to students or staff.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} className="sm:w-auto w-full">
                        <HiOutlineSpeakerphone className="w-5 h-5 -ml-1" />
                        Post Announcement
                    </Button>
                </div>

                {isLoading ? (
                    <p className="text-surface-500">Loading...</p>
                ) : announcements?.length > 0 ? (
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <Card key={ann.id} className="animate-slide-up border-l-4 border-l-accent-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-base font-semibold text-surface-900">{ann.title}</h3>
                                        <p className="text-sm text-surface-600 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                        <div className="flex items-center gap-3 mt-3 text-2xs text-surface-500">
                                            <span>By {ann.author_name}</span>
                                            <span>·</span>
                                            <span>{formatDateTime(ann.created_at)}</span>
                                            {ann.target_role && (
                                                <>
                                                    <span>·</span>
                                                    <Badge size="sm" variant="info" className="capitalize">Target: {ann.target_role}</Badge>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        className="p-2 ml-4 rounded-lg text-danger-400 hover:text-danger-600 hover:bg-danger-50 flex-shrink-0 transition-colors"
                                    >
                                        <HiOutlineTrash className="w-5 h-5" />
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card><p className="text-surface-500 text-sm text-center py-8">No announcements posted yet.</p></Card>
                )}

                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Announcement">
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <Input
                            label="Title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Midterm Exam Schedule"
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-surface-700">Content *</label>
                            <textarea
                                required
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm min-h-[120px]"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Message body..."
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Target Audience (Optional)</label>
                            <select
                                value={formData.targetRole}
                                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All (Staff & Students)</option>
                                <option value="student">Students Only</option>
                                <option value="staff">Staff Only</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-surface-200 mt-6 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={createMutation.isPending}>Publish Post</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageWrapper>
    );
}
