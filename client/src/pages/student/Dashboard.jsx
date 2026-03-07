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

export default function StudentDashboard() {
    const { user } = useAuth();
    const { data, isLoading } = useApiQuery('student-dashboard', '/students/dashboard');

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

    return (
        <PageWrapper>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Student Dashboard</h1>
                    <p className="text-surface-500 mt-1">
                        Welcome back, {user?.name}. Here&apos;s your overview.
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

                {/* Subjects & Announcements */}
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
                </div>
            </div>
        </PageWrapper>
    );
}
