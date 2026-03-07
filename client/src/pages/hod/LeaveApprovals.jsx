import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { formatDate, leaveStatusVariant } from '../../utils/helpers';
import { HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

export default function LeaveApprovals() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [statusAction, setStatusAction] = useState('approved');

    const { data: leaves, isLoading, refetch } = useApiQuery('hod-leaves', '/hod/leaves');

    const updateMutation = useApiMutation(
        `/hod/leaves/${selectedLeave?.id}/status`,
        'put',
        { invalidateKeys: [['hod-leaves']] }
    );

    const handleActionClick = (leave, action) => {
        setSelectedLeave(leave);
        setStatusAction(action);
        setRemarks('');
        setModalOpen(true);
    };

    const handleConfirm = (e) => {
        e.preventDefault();
        if (!selectedLeave) return;

        updateMutation.mutate(
            { status: statusAction, remarks },
            {
                onSuccess: () => {
                    setModalOpen(false);
                    alert(`Leave request ${statusAction}!`);
                    refetch();
                },
                onError: (err) => alert(err.response?.data?.message || 'Failed to update leave status'),
            }
        );
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Leave Approvals</h1>
                    <p className="text-surface-500 mt-1">Review and manage leave requests from department staff.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Staff Leave Requests</CardTitle>
                    </CardHeader>

                    {isLoading ? (
                        <p className="text-surface-500 text-sm py-4">Loading requests...</p>
                    ) : leaves?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Staff Member</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Type & Reason</th>
                                        <th className="text-left py-3 px-4 font-medium text-surface-600">Dates</th>
                                        <th className="text-center py-3 px-4 font-medium text-surface-600">Status</th>
                                        <th className="text-right py-3 px-4 font-medium text-surface-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave) => (
                                        <tr key={leave.id} className="border-b border-surface-100 hover:bg-surface-50">
                                            <td className="py-3 px-4 font-medium text-surface-900">
                                                {leave.staff_name}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="primary" size="sm" className="mb-1 capitalize">
                                                    {leave.leave_type}
                                                </Badge>
                                                <p className="text-2xs text-surface-600 max-w-xs line-clamp-2" title={leave.reason}>
                                                    {leave.reason}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 text-surface-700 whitespace-nowrap">
                                                {formatDate(leave.start_date)} <br /> to {formatDate(leave.end_date)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant={leaveStatusVariant(leave.status)} dot className="capitalize">
                                                    {leave.status}
                                                </Badge>
                                                {leave.remarks && (
                                                    <p className="text-2xs text-surface-500 mt-1 truncate max-w-[100px]" title={leave.remarks}>
                                                        {leave.remarks}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                {leave.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleActionClick(leave, 'approved')}
                                                            className="p-1.5 rounded bg-surface-100 text-surface-600 hover:text-success-600 hover:bg-success-50 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <HiOutlineCheck className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleActionClick(leave, 'rejected')}
                                                            className="p-1.5 rounded bg-surface-100 text-surface-600 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <HiOutlineX className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="py-8 text-center text-surface-500">No leave requests pending.</p>
                    )}
                </Card>

                {/* Action Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={`Confirm ${statusAction === 'approved' ? 'Approval' : 'Rejection'}`}
                >
                    <form onSubmit={handleConfirm} className="space-y-4 pt-2">
                        <p className="text-sm text-surface-700">
                            You are about to <strong className={statusAction === 'approved' ? 'text-success-600' : 'text-danger-600'}>{statusAction}</strong> the leave request from <strong>{selectedLeave?.staff_name}</strong>.
                        </p>

                        <div className="space-y-1.5 mt-4">
                            <label className="block text-sm font-medium text-surface-700">Remarks (Optional)</label>
                            <textarea
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm min-h-[80px]"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder={`Provide a reason for ${statusAction}...`}
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-surface-200 mt-6 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                variant={statusAction === 'approved' ? 'primary' : 'danger'}
                                loading={updateMutation.isPending}
                            >
                                Confirm {statusAction === 'approved' ? 'Approval' : 'Rejection'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageWrapper>
    );
}
