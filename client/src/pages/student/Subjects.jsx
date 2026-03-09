import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useApiQuery } from '../../hooks/useApi';
import { BookOpen, User } from 'lucide-react';

export default function StudentSubjects() {
    const { data: subjects, isLoading } = useApiQuery('student-subjects', '/students/subjects');

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">My Subjects</h1>
                    <p className="text-surface-500 mt-1">All your enrolled subjects for this semester.</p>
                </div>

                {isLoading ? (
                    <p className="text-surface-500">Loading subjects…</p>
                ) : subjects?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map((sub) => (
                            <Card key={sub.id} hover className="animate-slide-up">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600 flex-shrink-0">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-surface-900 truncate">{sub.name}</h3>
                                        <p className="text-xs text-surface-500 mt-0.5">{sub.code}</p>
                                        {sub.semester && (
                                            <Badge size="sm" variant="primary" className="mt-2">
                                                Semester {sub.semester}
                                            </Badge>
                                        )}
                                        {sub.staff_name && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs text-surface-600">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{sub.staff_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">
                            You are not enrolled in any subjects yet.
                        </p>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
