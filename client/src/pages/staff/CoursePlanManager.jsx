import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
    FileText, Upload, ChevronDown, ChevronUp, Paperclip, BookOpen,
    CheckCircle2, Clock, X, Plus, Trash2, Eye, Image, Link as LinkIcon,
    Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

export default function CoursePlanManager() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [subjectId, setSubjectId] = useState('');
    const [expandedUnits, setExpandedUnits] = useState({});
    const [materialPanel, setMaterialPanel] = useState(null); // topicId
    const [viewReportPanel, setViewReportPanel] = useState(null); // topicId
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [toast, setToast] = useState('');
    const fileInputRef = useRef(null);

    // Fetch subjects assigned to this faculty
    const { data: subjects } = useApiQuery('faculty-subjects', '/staff/subjects');

    // Fetch course plan for selected subject
    const { data: planData, isLoading: planLoading, refetch: refetchPlan } = useApiQuery(
        ['faculty-course-plan', subjectId],
        `/faculty/course-plan/${subjectId}`,
        { enabled: !!subjectId, retry: false }
    );

    const plan = planData;

    // Show toast helper
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 4000);
    };

    // Toggle unit expand/collapse
    const toggleUnit = (unitName) => {
        setExpandedUnits(prev => ({ ...prev, [unitName]: !prev[unitName] }));
    };

    // Handle file upload
    const handleUpload = async (file) => {
        if (!file || !subjectId) return;
        setUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectId', subjectId);

        try {
            const { data } = await api.post('/faculty/course-plan/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast(`Course Plan uploaded — ${data.data.totalTopics} topics found`);
            refetchPlan();
        } catch (err) {
            const msg = err.response?.data?.message || 'Upload failed';
            setUploadError(msg);
        } finally {
            setUploading(false);
        }
    };

    // Compute progress bar color
    const getProgressColor = (pct) => {
        if (pct > 75) return 'bg-green-500';
        if (pct >= 50) return 'bg-orange-500';
        return 'bg-blue-500';
    };

    // Unit default expanded
    const isExpanded = (unitName) => expandedUnits[unitName] !== false; // default true

    const stats = plan?.stats;
    const upload = plan?.upload;

    return (
        <PageWrapper>
            <div className="space-y-6">
                {/* Toast */}
                {toast && (
                    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-slide-up">
                        <CheckCircle2 className="w-5 h-5" /> {toast}
                    </div>
                )}

                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Plan Manager</h1>
                    <p className="text-gray-500 mt-1">Upload and manage your course plans by subject.</p>
                </div>

                {/* Subject Selector */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Select Subject</label>
                    <select
                        value={subjectId}
                        onChange={(e) => { setSubjectId(e.target.value); setUploadError(''); }}
                        className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
                    >
                        <option value="">— Choose a subject —</option>
                        {subjects?.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Loading State */}
                {planLoading && subjectId && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                {/* Empty State — No Plan Uploaded */}
                {subjectId && !planLoading && !plan && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Course Plan uploaded for this subject yet</h3>
                        <p className="text-gray-500 text-sm mb-6">Upload a .docx Course Information Sheet to get started.</p>
                        {uploadError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 max-w-md mx-auto">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {uploading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Scanning document...</>
                            ) : (
                                <><Upload className="w-5 h-5" /> Upload Course Plan</>
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".docx"
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files?.[0])}
                        />
                    </div>
                )}

                {/* Plan Exists — Full Page */}
                {plan && (
                    <>
                        {/* Progress Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {upload?.subject_name || 'Course Plan'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        {upload?.subject_code && (
                                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">
                                                {upload.subject_code}
                                            </span>
                                        )}
                                        {upload?.academic_year && (
                                            <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg">
                                                {upload.academic_year}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" /> Replace Document
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx"
                                    className="hidden"
                                    onChange={(e) => handleUpload(e.target.files?.[0])}
                                />
                            </div>

                            {/* Stat pills */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                    <CheckCircle2 className="w-4 h-4" /> {stats?.completed} Completed
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                                    <Clock className="w-4 h-4" /> {stats?.pending} Pending
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                    {stats?.total} Total
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(stats?.percentage || 0)}`}
                                    style={{ width: `${stats?.percentage || 0}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">{stats?.percentage}% complete</p>

                            {uploadError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
                                </div>
                            )}
                        </div>

                        {/* Unit Sections */}
                        {plan?.units?.map((unit) => (
                            <div key={unit.unitName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Unit Header */}
                                <button
                                    onClick={() => toggleUnit(unit.unitName)}
                                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div>
                                        <h3 className="font-bold text-gray-900">{unit.unitName}</h3>
                                        <p className="text-sm text-gray-500">
                                            {unit.completed}/{unit.total} hours completed
                                            {unit.targetHours > 0 && ` · Target: ${unit.targetHours} hrs`}
                                        </p>
                                    </div>
                                    {isExpanded(unit.unitName) ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {/* Topic Cards */}
                                {isExpanded(unit.unitName) && (
                                    <div className="px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {unit.topics.map((topic) => (
                                            <TopicCard
                                                key={topic.id}
                                                topic={topic}
                                                onSubmitReport={() => navigate(`/staff/course-plan/submit/${topic.id}`)}
                                                onToggleMaterials={() => setMaterialPanel(materialPanel === topic.id ? null : topic.id)}
                                                onToggleReport={() => setViewReportPanel(viewReportPanel === topic.id ? null : topic.id)}
                                                showMaterialPanel={materialPanel === topic.id}
                                                showReportPanel={viewReportPanel === topic.id}
                                                onMaterialAdded={refetchPlan}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </PageWrapper>
    );
}

// ─── Topic Card Component ────────────────────────────────────

function TopicCard({ topic, onSubmitReport, onToggleMaterials, onToggleReport, showMaterialPanel, showReportPanel, onMaterialAdded }) {
    const coColors = {
        'CO1': 'bg-blue-100 text-blue-700',
        'CO2': 'bg-purple-100 text-purple-700',
        'CO3': 'bg-pink-100 text-pink-700',
        'CO4': 'bg-amber-100 text-amber-700',
        'CO5': 'bg-teal-100 text-teal-700',
        'CO6': 'bg-red-100 text-red-700',
    };

    const coKey = (topic.co_bloom || '').split('/')[0]?.trim()?.toUpperCase();
    const coColor = coColors[coKey] || 'bg-gray-100 text-gray-600';
    const isCompleted = topic.status === 'completed';

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
            {/* Top row: badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                    #{topic.sno}
                </span>
                {topic.co_bloom && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${coColor}`}>
                        {topic.co_bloom}
                    </span>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                    {isCompleted ? '✓ Completed' : 'Pending'}
                </span>
            </div>

            {/* Topic name */}
            <h4 className="font-semibold text-gray-900 text-[15px] leading-snug mb-1">{topic.topic_name}</h4>

            {/* Meta */}
            {topic.teaching_method && (
                <p className="text-xs text-gray-500">{topic.teaching_method}</p>
            )}
            {topic.reference_book && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <BookOpen className="w-3 h-3" /> {topic.reference_book}
                </p>
            )}

            {/* Bottom row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" />
                    {topic.materials_count || 0} materials
                </span>
                <div className="flex items-center gap-2">
                    {isCompleted ? (
                        <button
                            onClick={onToggleReport}
                            className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" /> View Report
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onToggleMaterials}
                                className="text-xs font-medium text-gray-600 hover:text-gray-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Materials
                            </button>
                            <button
                                onClick={onSubmitReport}
                                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Submit Report
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Material Panel */}
            {showMaterialPanel && <MaterialPanel topicId={topic.id} onAdded={onMaterialAdded} />}

            {/* Report Panel */}
            {showReportPanel && isCompleted && <ReportPanel topicId={topic.id} />}
        </div>
    );
}

// ─── Material Panel ──────────────────────────────────────────

function MaterialPanel({ topicId, onAdded }) {
    const [title, setTitle] = useState('');
    const [materialType, setMaterialType] = useState('pdf');
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const { data: topicData, refetch } = useApiQuery(
        ['topic-detail', topicId],
        `/faculty/course-plan/topic/${topicId}`
    );

    const materials = topicData?.materials || [];

    const handleAdd = async () => {
        if (!title.trim()) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('materialType', materialType);
            if (file) formData.append('file', file);
            if (url) formData.append('url', url);

            await api.post(`/faculty/course-plan/topic/${topicId}/materials`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setTitle(''); setFile(null); setUrl('');
            refetch();
            onAdded?.();
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (materialId) => {
        try {
            await api.delete(`/faculty/course-plan/material/${materialId}`);
            refetch();
            onAdded?.();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Linked Materials</h5>

            {materials.length > 0 && (
                <div className="space-y-2">
                    {materials.map(m => (
                        <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{m.title}</span>
                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{m.material_type}</span>
                            </div>
                            {!m.is_released && (
                                <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add form */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Material title *"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex gap-2">
                    <select
                        value={materialType}
                        onChange={(e) => setMaterialType(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                    >
                        <option value="pdf">PDF</option>
                        <option value="ppt">PPT</option>
                        <option value="doc">DOC</option>
                        <option value="video">Video</option>
                        <option value="link">Link</option>
                        <option value="image">Image</option>
                        <option value="other">Other</option>
                    </select>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0])}
                        className="flex-1 text-sm text-gray-600"
                    />
                </div>
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Or paste a URL (for video/link)"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    onClick={handleAdd}
                    disabled={!title.trim() || uploading}
                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Material
                </button>
            </div>
        </div>
    );
}

// ─── Report Panel (for completed topics) ─────────────────────

function ReportPanel({ topicId }) {
    const { data: topicData } = useApiQuery(
        ['topic-detail', topicId],
        `/faculty/course-plan/topic/${topicId}`
    );

    const report = topicData?.report;
    const materials = topicData?.materials?.filter(m => m.is_released) || [];
    const [lightboxSrc, setLightboxSrc] = useState(null);

    if (!report) return <p className="text-sm text-gray-500 mt-2">Loading report...</p>;

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    return (
        <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500">
                Submitted on {new Date(report.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' at '}
                {new Date(report.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div>
                <p className="text-xs font-bold text-gray-700 mb-1">What was covered:</p>
                <p className="text-sm text-gray-800">{report.what_was_covered}</p>
            </div>
            {report.proof_image_url && (
                <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">Proof:</p>
                    <img
                        src={`${apiBase}${report.proof_image_url}`}
                        alt="Proof"
                        className="max-h-48 rounded-xl object-cover cursor-pointer border border-gray-200"
                        onClick={() => setLightboxSrc(`${apiBase}${report.proof_image_url}`)}
                    />
                </div>
            )}
            {materials.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">Materials released:</p>
                    {materials.map(m => (
                        <p key={m.id} className="text-sm text-gray-600 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-blue-500" /> {m.title}
                        </p>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxSrc && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setLightboxSrc(null)}
                >
                    <img src={lightboxSrc} alt="Proof Full" className="max-w-full max-h-[90vh] rounded-2xl" />
                </div>
            )}
        </div>
    );
}
