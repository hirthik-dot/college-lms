import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import { useApiQuery } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import {
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineBookOpen,
    HiOutlineCheckCircle,
    HiOutlineSpeakerphone,
} from 'react-icons/hi';
import Badge from '../../components/common/Badge';

export default function HodDashboard() {
    const { user } = useAuth();
    const { data, isLoading } = useApiQuery('hod-dashboard', '/hod/dashboard');

    const statsList = [
        {
            title: 'Total Students',
            value: data?.stats?.total_students || 0,
            icon: HiOutlineUserGroup,
            color: 'text-primary-600 bg-primary-100',
        },
        {
            title: 'Total Staff',
            value: data?.stats?.total_staff || 0,
            icon: HiOutlineUsers,
            color: 'text-accent-600 bg-accent-100',
        },
        {
            title: 'Active Subjects',
            value: data?.stats?.total_subjects || 0,
            icon: HiOutlineBookOpen,
            color: 'text-amber-600 bg-amber-100',
        },
        {
            title: 'Pending Leaves',
            value: data?.stats?.pending_leaves || 0,
            icon: HiOutlineCheckCircle,
            color: 'text-rose-600 bg-rose-100',
        },
    ];

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">HOD Dashboard</h1>
                    <p className="text-surface-500 mt-1">Welcome back, {user?.name}. Here&apos;s your department overview.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsList.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.title} hover className="animate-slide-up">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${stat.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-surface-500">{stat.title}</p>
                                        <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Needs Attention</CardTitle>
                        </CardHeader>
                        {isLoading ? (
                            <p className="text-surface-500 text-sm">Loading...</p>
                        ) : data?.stats?.pending_leaves > 0 ? (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-200/50">
                                        <HiOutlineCheckCircle className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-rose-900">Pending Leave Approvals</p>
                                        <p className="text-2xs text-rose-700 mt-0.5">
                                            You have {data.stats.pending_leaves} request(s) waiting for review.
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="danger" size="sm">Action Required</Badge>
                            </div>
                        ) : (
                            <p className="text-surface-500 text-sm">No pending tasks. You&apos;re all caught up!</p>
                        )}
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between items-center mb-4">
                            <CardTitle>System Announcements</CardTitle>
                            <Badge variant="primary" dot>Live</Badge>
                        </CardHeader>
                        {isLoading ? (
                            <p className="text-surface-500 text-sm">Loading...</p>
                        ) : data?.announcements?.length ? (
                            <div className="space-y-3">
                                {data.announcements.slice(0, 4).map((ann) => (
                                    <div key={ann.id} className="p-3 rounded-lg bg-surface-50 border-l-4 border-amber-500">
                                        <p className="text-sm font-medium text-surface-900">{ann.title}</p>
                                        <p className="text-2xs text-surface-500 mt-1 line-clamp-2">{ann.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-surface-500 text-sm">No recent announcements.</p>
                        )}
                    </Card>
                </div>
            </div>
        </PageWrapper>
    );
}
