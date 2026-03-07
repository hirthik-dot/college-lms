import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/common/Card';
import { useApiQuery } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/helpers';

export default function Announcements() {
    const { data: announcements, isLoading } = useApiQuery(
        'student-announcements',
        '/students/announcements'
    );

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Announcements</h1>
                    <p className="text-surface-500 mt-1">Stay up to date with department updates.</p>
                </div>

                {isLoading ? (
                    <p className="text-surface-500">Loading…</p>
                ) : announcements?.length > 0 ? (
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <Card key={ann.id} className="animate-slide-up border-l-4 border-l-primary-500">
                                <h3 className="text-base font-semibold text-surface-900">{ann.title}</h3>
                                <p className="text-sm text-surface-600 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                <div className="flex items-center gap-3 mt-3 text-2xs text-surface-500">
                                    <span>By {ann.author_name}</span>
                                    <span>·</span>
                                    <span>{formatDateTime(ann.created_at)}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">No announcements yet.</p>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
