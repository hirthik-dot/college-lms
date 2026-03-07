import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { formatDate, leaveStatusVariant } from '../../utils/helpers';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';

export default function StaffLeaveRequest() {
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ leaveType: 'sick', startDate: '', endDate: '', reason: '' });

    const { data: leaves, isLoading, refetch } = useApiQuery('staff-leaves', '/staff/leaves');

    const leaveMutation = useApiMutation('/staff/leaves', 'post', {
        invalidateKeys: [['staff-leaves']],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            return alert('Start date must be before or equal to End date');
        }

        leaveMutation.mutate(
            formData,
            {
                onSuccess: () => {
                    setModalOpen(false);
                    setFormData({ leaveType: 'sick', startDate: '', endDate: '', reason: '' });
                    alert('Leave request submitted!');
                    refetch();
                },
                onError: (err) => alert(err.response?.data?.message || 'Failed to submit leave'),
            }
        );
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900">Leave Requests</h1>
                        <p className="text-surface-500 mt-1">Submit new leave requests and view their status.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} className="sm:w-auto w-full">
                        <HiOutlineDocumentPlus className="w-5 h-5 -ml-1" />
                        Apply for Leave
                    </Button>
                </div>

                {isLoading ? (
                    <p className="text-surface-500">Loading...</p>
                ) : leaves?.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>My Request History</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Type</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Dates</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Reason</th>
                                        <th className="text-center py-3 px-4 font-medium text-surface-600">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave) => (
                                        <tr key={leave.id} className="border-b border-surface-100 hover:bg-surface-50">
                                            <td className="py-3 px-4 capitalize font-medium text-surface-900">{leave.leave_type}</td>
                                            <td className="py-3 px-4 text-surface-700 whitespace-nowrap">
                                                {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                                            </td>
                                            <td className="py-3 px-4 text-surface-600 max-w-sm truncate" title={leave.reason}>
                                                {leave.reason || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant={leaveStatusVariant(leave.status)} dot className="capitalize">
                                                    {leave.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-surface-500 text-2xs truncate max-w-[150px]" title={leave.remarks}>
                                                {leave.remarks || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <Card><p className="py-8 text-center text-surface-500">No leave requests found.</p></Card>
                )}

                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Leave Type *</label>
                            <select
                                required
                                value={formData.leaveType}
                                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="sick">Sick Leave</option>
                                <option value="casual">Casual Leave</option>
                                <option value="earned">Earned Leave</option>
                                <option value="maternity">Maternity Leave</option>
                                <option value="paternity">Paternity Leave</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Start Date"
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-surface-700">Reason</label>
                            <textarea
                                required
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="State the reason briefly..."
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-3 border-t border-surface-200 mt-6 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={leaveMutation.isPending}>Submit Request</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageWrapper>
    );
}
