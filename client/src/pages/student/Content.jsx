import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useApiQuery } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/helpers';
import { HiOutlineDocumentDownload } from 'react-icons/hi';
import { FileText, BookOpen, Sparkles } from 'lucide-react';

export default function Content() {
    const [searchParams] = useSearchParams();
    const initialSubject = searchParams.get('subjectId') || '';
    const [subjectId, setSubjectId] = useState(initialSubject);

    const { data: subjects } = useApiQuery('student-subjects', '/subjects');
    const { data: content, isLoading } = useApiQuery(
        ['student-content', subjectId],
        `/students/content/${subjectId}`,
        { enabled: !!subjectId }
    );

    // Fetch faculty-released materials for the selected subject
    const { data: facultyMaterials } = useApiQuery(
        ['student-faculty-materials', subjectId],
        `/student/materials/${subjectId}`,
        { enabled: !!subjectId, retry: false }
    );

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Course Content</h1>
                    <p className="text-surface-500 mt-1">Access study materials and resources.</p>
                </div>

                <Card padding="p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-surface-700">Subject:</label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-surface-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                            <option value="">Select a subject</option>
                            {subjects?.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {!subjectId && (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">
                            Please select a subject to view content.
                        </p>
                    </Card>
                )}

                {isLoading && <p className="text-surface-500">Loading…</p>}

                {content?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.map((item) => (
                            <Card key={item.id} hover className="animate-slide-up">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
                                        <HiOutlineDocumentDownload className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-surface-900 truncate">
                                            {item.title}
                                        </h3>
                                        {item.description && (
                                            <p className="text-2xs text-surface-500 mt-1 line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2">
                                            {item.content_type && (
                                                <Badge size="sm" variant="primary">
                                                    {item.content_type}
                                                </Badge>
                                            )}
                                            <span className="text-2xs text-surface-400">
                                                by {item.uploaded_by_name} · {formatDateTime(item.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Faculty-Released Materials Section */}
                {subjectId && facultyMaterials && facultyMaterials.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">Released by Faculty</h2>
                        </div>

                        {facultyMaterials.map((group, gi) => (
                            <div key={gi} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <h3 className="text-sm font-semibold text-gray-900">{group.topicName}</h3>
                                        <span className="text-xs text-gray-500">· {group.unitName}</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {group.materials.map((mat) => (
                                        <a
                                            key={mat.id}
                                            href={`${apiBase}${mat.file_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 px-5 py-3 hover:bg-blue-50/30 transition-colors"
                                        >
                                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{mat.title}</p>
                                                    {mat.is_new && (
                                                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full uppercase">
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {mat.material_type?.toUpperCase()}
                                                    {mat.released_at && ` · Released ${new Date(mat.released_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {subjectId && !isLoading && content?.length === 0 && (!facultyMaterials || facultyMaterials.length === 0) && (
                    <Card>
                        <p className="text-surface-500 text-sm text-center py-8">
                            No content available for this subject.
                        </p>
                    </Card>
                )}
            </div>
        </PageWrapper>
    );
}
