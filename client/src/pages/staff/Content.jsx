import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { HiOutlineUpload } from 'react-icons/hi';
import Badge from '../../components/common/Badge';

export default function Content() {
    const [modalOpen, setModalOpen] = useState(false);
    const [subjectId, setSubjectId] = useState('');
    const [formData, setFormData] = useState({ title: '', description: '', url: '', type: 'PDF' });

    const { data: dashboardData } = useApiQuery('staff-dashboard', '/staff/dashboard');
    const subjects = dashboardData?.mySubjects || [];

    const uploadMutation = useApiMutation('/staff/content', 'post', {
        invalidateKeys: [['student-content', subjectId]], // invalidate related query if needed, or maintain staff own list
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!subjectId) return alert('Select subject');

        uploadMutation.mutate(
            {
                title: formData.title,
                description: formData.description,
                subjectId,
                fileUrl: formData.url,
                contentType: formData.type,
            },
            {
                onSuccess: () => {
                    setModalOpen(false);
                    setFormData({ title: '', description: '', url: '', type: 'PDF' });
                    alert('Content uploaded successfully');
                },
                onError: (err) => alert(err.response?.data?.message || 'Failed'),
            }
        );
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Course Content</h1>
                        <p className="text-surface-500 mt-1">Upload and manage study materials.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} className="sm:w-auto w-full">
                        <HiOutlineUpload className="w-5 h-5 -ml-1" />
                        Upload New Content
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
                            <option value="">Select a subject to view/manage content</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {!subjectId ? (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">
                            Select a subject to view its uploaded content.
                        </p>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Manager</CardTitle>
                        </CardHeader>
                        <p className="text-surface-500 text-sm py-4">
                            Viewing content feature is typically available via a specific endpoint (e.g. GET /api/staff/content/:subjectId). Add endpoint if you wish to see history here.
                        </p>
                    </Card>
                )}

                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Content">
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Subject *</label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
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
                            placeholder="e.g. Chapter 1 Notes"
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-surface-700">Description</label>
                            <textarea
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm min-h-[80px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <Input
                            label="File/Resource URL"
                            required
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://drive.google.com/..."
                        />
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Content Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="PDF">PDF</option>
                                <option value="Video">Video Link</option>
                                <option value="Doc">Document</option>
                                <option value="Other">Other Resource</option>
                            </select>
                        </div>
                        <div className="pt-4 flex justify-end gap-3 border-t border-surface-200 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={uploadMutation.isPending}>
                                Upload Content
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageWrapper>
    );
}
