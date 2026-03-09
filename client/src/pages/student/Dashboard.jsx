import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useApiQuery } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import {
    HiOutlineClipboardCheck,
    HiOutlineDocumentText,
    HiOutlineAcademicCap,
    HiOutlineBookOpen,
} from 'react-icons/hi';
import { FileText, ArrowRight } from 'lucide-react';

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data, isLoading } = useApiQuery('student-dashboard', '/students/dashboard');

    // Fetch recent material notifications
    const { data: notifData } = useApiQuery(
        'student-material-notifications-dashboard',
        '/student/notifications/materials',
        { retry: false }
    );

    const recentMaterials = notifData?.notifications?.slice(0, 3) || [];

    const stats = [
        {
            title: 'Subjects',
            value: data?.subjects?.length || 0,
            icon: HiOutlineBookOpen,
            color: 'text-primary-600 bg-primary-100',
        },
        {
            title: 'Assignments',
            value: '—',
            icon: HiOutlineDocumentText,
            color: 'text-accent-600 bg-accent-100',
        },
        {
            title: 'Attendance',
            value: '—',
            icon: HiOutlineClipboardCheck,
            color: 'text-amber-600 bg-amber-100',
        },
        {
            title: 'Marks',
            value: '—',
            icon: HiOutlineAcademicCap,
            color: 'text-rose-600 bg-rose-100',
        },
    ];

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <PageWrapper>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Student Dashboard</h1>
                    <p className="text-surface-500 mt-1">
                        Welcome back, {user?.name || user?.full_name}. Here&apos;s your overview.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => {
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

                {/* Subjects, Announcements & Recent Materials */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subjects */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Subjects</CardTitle>
                        </CardHeader>
                        {isLoading ? (
                            <p className="text-surface-500 text-sm">Loading…</p>
                        ) : data?.subjects?.length ? (
                            <div className="space-y-3">
                                {data.subjects.map((subject) => (
                                    <div
                                        key={subject.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-surface-900">{subject.name}</p>
                                            <p className="text-2xs text-surface-500">{subject.code}</p>
                                        </div>
                                        {subject.staff_name && (
                                            <Badge variant="primary" size="sm">
                                                {subject.staff_name}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-surface-500 text-sm">No subjects found.</p>
                        )}
                    </Card>

                    {/* Right column: Announcements + Recent Materials */}
                    <div className="space-y-6">
                        {/* Announcements */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Announcements</CardTitle>
                            </CardHeader>
                            {isLoading ? (
                                <p className="text-surface-500 text-sm">Loading…</p>
                            ) : data?.announcements?.length ? (
                                <div className="space-y-3">
                                    {data.announcements.slice(0, 5).map((ann) => (
                                        <div
                                            key={ann.id}
                                            className="p-3 rounded-lg bg-surface-50 border-l-4 border-primary-500"
                                        >
                                            <p className="text-sm font-medium text-surface-900">{ann.title}</p>
                                            <p className="text-2xs text-surface-500 mt-1 line-clamp-2">{ann.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-surface-500 text-sm">No announcements yet.</p>
                            )}
                        </Card>

                        {/* Recent Materials Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Materials</CardTitle>
                            </CardHeader>
                            {recentMaterials.length > 0 ? (
                                <div className="space-y-3">
                                    {recentMaterials.map((mat) => (
                                        <div key={mat.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors">
                                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-surface-900 truncate">{mat.topic_name}</p>
                                                <p className="text-2xs text-surface-500">{mat.subject_name} · {timeAgo(mat.notified_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => navigate('/student/content')}
                                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 mt-1"
                                    >
                                        View All <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-surface-500 text-sm">No new materials yet.</p>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
