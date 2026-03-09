import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { useApiQuery } from '../../hooks/useApi';
import api from '../../utils/api';
import {
    ArrowLeft, BookOpen, Clock, CheckCircle2, AlertCircle,
    Upload, X, Plus, Loader2, Image, FileText, Trash2
} from 'lucide-react';

export default function SubmitHourReport() {
    const { topicId } = useParams();
    const navigate = useNavigate();

    // Fetch topic details
    const { data: topicData, isLoading } = useApiQuery(
        ['topic-detail-submit', topicId],
        `/faculty/course-plan/topic/${topicId}`
    );

    const [whatWasCovered, setWhatWasCovered] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [newMaterials, setNewMaterials] = useState([]);
    const [showAddMaterial, setShowAddMaterial] = useState(false);
    const [matTitle, setMatTitle] = useState('');
    const [matType, setMatType] = useState('pdf');
    const [matFile, setMatFile] = useState(null);
    const [matUrl, setMatUrl] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState('');
    const proofRef = useRef(null);

    const topic = topicData?.topic;
    const preLinkedMaterials = topicData?.materials || [];
    const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);

    // Initialize selected materials when data loads
    if (preLinkedMaterials.length > 0 && selectedMaterialIds.length === 0 && !isLoading) {
        const ids = preLinkedMaterials.map(m => m.id);
        if (ids.length > 0) setSelectedMaterialIds(ids);
    }

    // If topic is already completed, redirect
    if (topic && topic.status === 'completed') {
        navigate('/staff/course-plan', { replace: true });
        return null;
    }

    // Handle proof image selection
    const handleProofSelect = (file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            alert('File must be under 10MB');
            return;
        }
        setProofImage(file);
        setProofPreview(URL.createObjectURL(file));
    };

    // Handle drag/drop
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleProofSelect(file);
        }
    };

    // Toggle material selection
    const toggleMaterial = (id) => {
        setSelectedMaterialIds(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    // Add new material inline
    const handleAddNewMaterial = () => {
        if (!matTitle.trim()) return;
        setNewMaterials(prev => [...prev, {
            id: Date.now(),
            title: matTitle,
            materialType: matType,
            file: matFile,
            url: matUrl,
        }]);
        setMatTitle(''); setMatType('pdf'); setMatFile(null); setMatUrl('');
        setShowAddMaterial(false);
    };

    const removeNewMaterial = (id) => {
        setNewMaterials(prev => prev.filter(m => m.id !== id));
    };

    // Count materials to be released (including any currently typed one)
    const hasUnsavedMaterial = showAddMaterial && matTitle.trim();
    const materialsToRelease = selectedMaterialIds.length + newMaterials.length + (hasUnsavedMaterial ? 1 : 0);

    // Validation
    const isValid = whatWasCovered.trim().length >= 20 && proofImage;

    // Submit
    const handleSubmit = async () => {
        setShowConfirm(false);
        setSubmitting(true);

        try {
            const finalMaterials = [...newMaterials];
            if (showAddMaterial && matTitle.trim()) {
                finalMaterials.push({
                    id: Date.now(),
                    title: matTitle,
                    materialType: matType,
                    file: matFile,
                    url: matUrl,
                });
            }

            // First, upload any new materials
            for (const mat of finalMaterials) {
                const matForm = new FormData();
                matForm.append('title', mat.title);
                matForm.append('materialType', mat.materialType);
                matForm.append('addedWhen', 'at_submission');
                if (mat.file) matForm.append('file', mat.file);
                if (mat.url) matForm.append('url', mat.url);

                await api.post(`/faculty/course-plan/topic/${topicId}/materials`, matForm, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            // Submit the report
            const formData = new FormData();
            formData.append('whatWasCovered', whatWasCovered);
            formData.append('proofImage', proofImage);

            const { data } = await api.post(`/faculty/course-plan/topic/${topicId}/report`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            navigate('/staff/course-plan', {
                replace: true,
                state: { toast: `✓ Hour submitted. ${data.data?.materialsReleased || 0} materials released to ${data.data?.studentsNotified || 0} students.` },
            });
        } catch (err) {
            console.error(err);
            setToast(err.response?.data?.message || 'Submission failed. Please try again.');
            setTimeout(() => setToast(''), 5000);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <PageWrapper>
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            {/* Full-page loading overlay */}
            {submitting && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-lg font-semibold text-gray-700">Submitting report and releasing materials...</p>
                </div>
            )}

            <div className="max-w-[680px] mx-auto space-y-6">
                {/* Error Toast */}
                {toast && (
                    <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> {toast}
                    </div>
                )}

                {/* Back Button */}
                <button
                    onClick={() => navigate('/staff/course-plan')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Course Plan
                </button>

                {/* Topic Details Card */}
                {topic && (
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Topic to Submit</p>
                        <p className="text-xs text-gray-500 mb-1">{topic.unit_name}</p>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">{topic.topic_name}</h2>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-semibold bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200">
                                <Clock className="w-3 h-3 inline mr-1" />{topic.periods_required} period{topic.periods_required > 1 ? 's' : ''}
                            </span>
                            {topic.co_bloom && (
                                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg">
                                    {topic.co_bloom}
                                </span>
                            )}
                            {topic.reference_book && (
                                <span className="text-xs font-semibold bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200">
                                    <BookOpen className="w-3 h-3 inline mr-1" />{topic.reference_book}
                                </span>
                            )}
                        </div>
                        {topic.teaching_method && (
                            <p className="text-xs text-gray-500 mt-2">{topic.teaching_method}</p>
                        )}
                    </div>
                )}

                {/* Form Section */}
                <div className="space-y-6">
                    {/* Field 1: What did you cover? */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            What did you cover in this session? <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Describe what you taught, any extra topics covered, student activities, or notes about this session.
                        </p>
                        <textarea
                            value={whatWasCovered}
                            onChange={(e) => setWhatWasCovered(e.target.value)}
                            placeholder="Describe what you covered..."
                            className="w-full px-4 py-3 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            style={{ minHeight: '120px', maxHeight: '400px' }}
                            rows={5}
                        />
                        <p className={`text-xs mt-1 ${whatWasCovered.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                            {whatWasCovered.length} / minimum 20 characters
                        </p>
                    </div>

                    {/* Field 2: Upload Proof */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Upload Proof of Teaching <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Photo of board/screen, screenshot of presentation, or student activity photo
                        </p>

                        {proofPreview ? (
                            <div className="relative">
                                <img
                                    src={proofPreview}
                                    alt="Proof preview"
                                    className="w-full max-h-[200px] object-cover rounded-xl border border-gray-200"
                                />
                                <button
                                    onClick={() => { setProofImage(null); setProofPreview(null); }}
                                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                                >
                                    <X className="w-4 h-4 text-red-500" />
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    {proofImage.name} · {(proofImage.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => proofRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                            >
                                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                <p className="text-sm text-gray-600 font-medium">Drag photo here or click to browse</p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC — Max 10MB</p>
                            </div>
                        )}
                        <input
                            ref={proofRef}
                            type="file"
                            accept="image/*,.heic"
                            className="hidden"
                            onChange={(e) => handleProofSelect(e.target.files?.[0])}
                        />
                    </div>

                    {/* Field 3: Study Materials */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Study Materials to Release to Students
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            These will become visible to all enrolled students when you submit.
                        </p>

                        {/* Pre-linked materials */}
                        {preLinkedMaterials.length > 0 ? (
                            <div className="space-y-2 mb-3">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Pre-linked Materials</p>
                                {preLinkedMaterials.map(m => (
                                    <label key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedMaterialIds.includes(m.id)}
                                            onChange={() => toggleMaterial(m.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 flex-1">{m.title}</span>
                                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{m.material_type}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 mb-3 italic">No materials pre-linked</p>
                        )}

                        {/* New materials */}
                        {newMaterials.length > 0 && (
                            <div className="space-y-2 mb-3">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Newly Added</p>
                                {newMaterials.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-2.5">
                                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 flex-1">{m.title}</span>
                                        <span className="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-medium">NEW</span>
                                        <button onClick={() => removeNewMaterial(m.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add material form */}
                        {showAddMaterial ? (
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                                <input
                                    value={matTitle}
                                    onChange={(e) => setMatTitle(e.target.value)}
                                    placeholder="Material title *"
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={matType}
                                        onChange={(e) => setMatType(e.target.value)}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="ppt">PPT</option>
                                        <option value="doc">DOC</option>
                                        <option value="video">Video</option>
                                        <option value="link">Link</option>
                                    </select>
                                    <input
                                        type="file"
                                        onChange={(e) => setMatFile(e.target.files?.[0])}
                                        className="flex-1 text-sm text-gray-600"
                                    />
                                </div>
                                <input
                                    value={matUrl}
                                    onChange={(e) => setMatUrl(e.target.value)}
                                    placeholder="Or paste URL"
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddNewMaterial}
                                        disabled={!matTitle.trim()}
                                        className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowAddMaterial(false)}
                                        className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddMaterial(true)}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Material
                            </button>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!isValid || submitting}
                    className={`w-full py-3.5 rounded-xl font-semibold text-base transition-colors ${isValid
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Submit Hour Report
                </button>

                {/* Confirmation Modal */}
                {showConfirm && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Submission</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                This will release {materialsToRelease} study materials to enrolled students. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Confirm & Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
