import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { useApiQuery } from '../../hooks/useApi';
import api from '../../utils/api';
import {
    ArrowLeft, BookOpen, Clock, CheckCircle2, AlertCircle,
    Upload, X, Plus, Loader2, Image, FileText, Trash2,
    ShieldCheck, ShieldAlert, ShieldX, Eye, Brain, FileSearch, Wrench,
    ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';

// Lazy-import verification utilities
let verifyTextOnlyFn = null;
let verifyHourReportFn = null;
let cleanupFn = null;

async function loadVerificationUtils() {
    if (!verifyTextOnlyFn) {
        const mod = await import('../../utils/verifyHourReport');
        verifyTextOnlyFn = mod.verifyTextOnly;
        verifyHourReportFn = mod.verifyHourReport;
        cleanupFn = mod.cleanupImageVerification;
    }
}

export default function SubmitHourReport() {
    const { topicId } = useParams();
    const navigate = useNavigate();

    // Fetch topic details
    const { data: topicData, isLoading } = useApiQuery(
        ['topic-detail-submit', topicId],
        `/faculty/course-plan/topic/${topicId}`
    );

    const [whatWasCovered, setWhatWasCovered] = useState('');
    const [teachingAids, setTeachingAids] = useState('');
    const [teachingMethods, setTeachingMethods] = useState('');
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

    // AI Verification state
    const [aiResult, setAiResult] = useState(null);
    const [aiRunning, setAiRunning] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [imageVerifying, setImageVerifying] = useState(false);
    const [staffConfirmedFlag, setStaffConfirmedFlag] = useState(false);
    const [verificationExpanded, setVerificationExpanded] = useState(true);

    const textDebounceRef = useRef(null);
    const aidsDebounceRef = useRef(null);

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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupFn) cleanupFn();
            if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
            if (aidsDebounceRef.current) clearTimeout(aidsDebounceRef.current);
        };
    }, []);

    // ═══════════════════════════════════════════════════════════
    // AI VERIFICATION TRIGGERS
    // ═══════════════════════════════════════════════════════════

    const runTextVerification = useCallback(async (desc, aids, methods) => {
        if (!topic?.topic_name || !desc || desc.trim().length < 10) return;

        await loadVerificationUtils();
        const result = verifyTextOnlyFn({
            topicName: topic.topic_name,
            description: desc,
            teachingAids: aids || teachingAids,
            teachingMethods: methods || teachingMethods,
        });

        setAiResult(prev => {
            if (!prev) return result;
            // Merge text-only results but keep existing image results
            return {
                ...result,
                layerScores: {
                    ...result.layerScores,
                    ocrMatch: prev.layerScores?.ocrMatch || null,
                    sceneMatch: prev.layerScores?.sceneMatch || null,
                },
                // If we have image scores, recalculate total
                ...(prev.layerScores?.ocrMatch || prev.layerScores?.sceneMatch
                    ? recalcTotal(result.layerScores, prev.layerScores)
                    : {}),
            };
        });
    }, [topic?.topic_name, teachingAids, teachingMethods]);

    const runFullVerification = useCallback(async (imageFile, desc, aids, methods) => {
        if (!topic?.topic_name || !imageFile) return;

        setImageVerifying(true);
        setAiRunning(true);
        setOcrProgress(0);

        try {
            await loadVerificationUtils();
            const result = await verifyHourReportFn({
                topicName: topic.topic_name,
                description: desc || whatWasCovered,
                teachingAids: aids || teachingAids,
                teachingMethods: methods || teachingMethods,
                imageFile,
                onOCRProgress: setOcrProgress,
            });

            setAiResult(result);
        } catch (err) {
            console.error('Full verification error:', err);
        } finally {
            setAiRunning(false);
            setImageVerifying(false);
        }
    }, [topic?.topic_name, whatWasCovered, teachingAids, teachingMethods]);

    // Recalculate total when merging partial results
    function recalcTotal(newLayers, oldLayers) {
        const merged = {
            textMatch: newLayers.textMatch,
            ocrMatch: oldLayers.ocrMatch,
            sceneMatch: oldLayers.sceneMatch,
            aidsMatch: newLayers.aidsMatch,
        };

        let total = 0;
        let weightSum = 0;
        const weights = { textMatch: 0.35, ocrMatch: 0.20, sceneMatch: 0.20, aidsMatch: 0.25 };

        for (const [key, w] of Object.entries(weights)) {
            if (merged[key]?.score !== undefined) {
                total += merged[key].score * w;
                weightSum += w;
            }
        }

        if (weightSum > 0) total = Math.round(total / weightSum * 1);
        const score = Math.round(total);

        return {
            score,
            verified: score >= 70,
            flagged: score < 40,
            lowConfidence: score >= 40 && score < 70,
            status: score >= 70 ? 'verified' : score >= 40 ? 'low_confidence' : 'flagged',
        };
    }

    // Debounced text change handler
    const handleDescriptionChange = (val) => {
        setWhatWasCovered(val);
        if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
        textDebounceRef.current = setTimeout(() => {
            runTextVerification(val, teachingAids, teachingMethods);
        }, 800);
    };

    // Debounced aids/methods change handler
    const handleAidsChange = (aids) => {
        setTeachingAids(aids);
        if (aidsDebounceRef.current) clearTimeout(aidsDebounceRef.current);
        aidsDebounceRef.current = setTimeout(() => {
            runTextVerification(whatWasCovered, aids, teachingMethods);
            if (proofImage) runFullVerification(proofImage, whatWasCovered, aids, teachingMethods);
        }, 800);
    };

    const handleMethodsChange = (methods) => {
        setTeachingMethods(methods);
        if (aidsDebounceRef.current) clearTimeout(aidsDebounceRef.current);
        aidsDebounceRef.current = setTimeout(() => {
            runTextVerification(whatWasCovered, teachingAids, methods);
        }, 800);
    };

    // Handle proof image selection
    const handleProofSelect = (file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            alert('File must be under 10MB');
            return;
        }
        setProofImage(file);
        setProofPreview(URL.createObjectURL(file));

        // Trigger image verification
        runFullVerification(file, whatWasCovered, teachingAids, teachingMethods);
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

    // Count materials to be released
    const hasUnsavedMaterial = showAddMaterial && matTitle.trim();
    const materialsToRelease = selectedMaterialIds.length + newMaterials.length + (hasUnsavedMaterial ? 1 : 0);

    // Validation
    const isValid = whatWasCovered.trim().length >= 20 && proofImage;
    const needsConfirmation = aiResult && aiResult.flagged;

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

            // Submit the report with AI data
            const formData = new FormData();
            formData.append('whatWasCovered', whatWasCovered);
            formData.append('proofImage', proofImage);
            formData.append('teachingAids', teachingAids);
            formData.append('teachingMethods', teachingMethods);

            // Attach AI verification data
            if (aiResult) {
                formData.append('ai_verified', aiResult.verified);
                formData.append('ai_score', aiResult.score);
                formData.append('ai_flagged', aiResult.flagged);
                formData.append('ai_low_confidence', aiResult.lowConfidence);
                formData.append('ai_reason', aiResult.reason);
                formData.append('ai_layer_scores', JSON.stringify(aiResult.layerScores));
                formData.append('staff_confirmed_flag', staffConfirmedFlag);
            }

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

    // ═══════════════════════════════════════════════════════════
    // SCORE STYLING HELPERS
    // ═══════════════════════════════════════════════════════════
    const getScoreColor = (score) => {
        if (score >= 70) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' };
        if (score >= 40) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
        return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' };
    };

    const getStatusIcon = (status) => {
        if (status === 'verified') return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
        if (status === 'low_confidence') return <ShieldAlert className="w-5 h-5 text-amber-500" />;
        return <ShieldX className="w-5 h-5 text-red-500" />;
    };

    const getStatusLabel = (result) => {
        if (!result) return '';
        if (result.verified) return 'AI Verified';
        if (result.lowConfidence) return 'Low Confidence';
        return 'Flagged';
    };

    return (
        <PageWrapper>
            {/* Full-page loading overlay */}
            {submitting && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-lg font-semibold text-gray-700">Submitting report and releasing materials...</p>
                </div>
            )}

            <div className="max-w-[720px] mx-auto space-y-6">
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
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            placeholder="Describe what you covered..."
                            className="w-full px-4 py-3 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            style={{ minHeight: '120px', maxHeight: '400px' }}
                            rows={5}
                        />
                        <p className={`text-xs mt-1 ${whatWasCovered.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                            {whatWasCovered.length} / minimum 20 characters
                        </p>
                    </div>

                    {/* Field 2: Teaching Aids */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Teaching Aids Used
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            e.g. PPT, Whiteboard, Video, Lab Equipment, Projector
                        </p>
                        <input
                            value={teachingAids}
                            onChange={(e) => handleAidsChange(e.target.value)}
                            placeholder="PPT, Whiteboard, Video..."
                            className="w-full px-4 py-2.5 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Field 3: Teaching Methods */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Teaching Methods
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            e.g. Lecture, Discussion, Demo, Hands-on, Lab Exercise
                        </p>
                        <input
                            value={teachingMethods}
                            onChange={(e) => handleMethodsChange(e.target.value)}
                            placeholder="Lecture, Discussion, Demo..."
                            className="w-full px-4 py-2.5 text-sm bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Field 4: Upload Proof */}
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

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* AI VERIFICATION PANEL */}
                    {/* ═══════════════════════════════════════════════════ */}
                    {aiResult && (
                        <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${aiResult.verified ? 'border-emerald-200 bg-emerald-50/30' :
                                aiResult.lowConfidence ? 'border-amber-200 bg-amber-50/30' :
                                    'border-red-200 bg-red-50/30'
                            }`}>
                            {/* Header */}
                            <button
                                onClick={() => setVerificationExpanded(!verificationExpanded)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(aiResult.status)}
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">
                                            AI Verification — {getStatusLabel(aiResult)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Overall score: {aiResult.score}%
                                            {imageVerifying && ' · Image analysis in progress...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Overall score badge */}
                                    <div className={`text-lg font-black ${getScoreColor(aiResult.score).text}`}>
                                        {aiResult.score}%
                                    </div>
                                    {verificationExpanded
                                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                                    }
                                </div>
                            </button>

                            {/* Overall Score Meter */}
                            <div className="px-5 pb-2">
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getScoreColor(aiResult.score).bg}`}
                                        style={{ width: `${aiResult.score}%` }}
                                    />
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {verificationExpanded && (
                                <div className="px-5 pb-5 space-y-3">
                                    {/* Layer 1: Text Match */}
                                    <LayerScoreRow
                                        icon={<FileSearch className="w-4 h-4" />}
                                        label="Text Match"
                                        sublabel="Description vs Topic"
                                        score={aiResult.layerScores?.textMatch?.score}
                                        weight={aiResult.layerScores?.textMatch?.weight}
                                        reason={aiResult.layerScores?.textMatch?.reason}
                                        loading={false}
                                    />

                                    {/* Layer 2A: OCR */}
                                    <LayerScoreRow
                                        icon={<Eye className="w-4 h-4" />}
                                        label="Image Text (OCR)"
                                        sublabel="Text detected in image"
                                        score={aiResult.layerScores?.ocrMatch?.score}
                                        weight={aiResult.layerScores?.ocrMatch?.weight}
                                        reason={aiResult.layerScores?.ocrMatch?.reason}
                                        loading={imageVerifying}
                                        progress={ocrProgress}
                                    />

                                    {/* Layer 2B: Scene */}
                                    <LayerScoreRow
                                        icon={<Brain className="w-4 h-4" />}
                                        label="Scene Analysis"
                                        sublabel="Image context recognition"
                                        score={aiResult.layerScores?.sceneMatch?.score}
                                        weight={aiResult.layerScores?.sceneMatch?.weight}
                                        reason={aiResult.layerScores?.sceneMatch?.reason}
                                        loading={imageVerifying}
                                    />

                                    {/* Layer 3: Aids/Methods */}
                                    <LayerScoreRow
                                        icon={<Wrench className="w-4 h-4" />}
                                        label="Aids & Methods"
                                        sublabel="Consistency check"
                                        score={aiResult.layerScores?.aidsMatch?.score}
                                        weight={aiResult.layerScores?.aidsMatch?.weight}
                                        reason={aiResult.layerScores?.aidsMatch?.reason}
                                        loading={false}
                                    />

                                    {/* Warning Banner for low scores */}
                                    {aiResult.flagged && (
                                        <div className="mt-3 bg-red-100 border border-red-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-red-800">
                                                        This report has been flagged by AI verification
                                                    </p>
                                                    <p className="text-xs text-red-600 mt-1">
                                                        The verification score is below 40%. This report will be flagged for HOD review.
                                                        You can still submit, but please confirm the report is accurate.
                                                    </p>
                                                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={staffConfirmedFlag}
                                                            onChange={(e) => setStaffConfirmedFlag(e.target.checked)}
                                                            className="rounded border-red-300 text-red-600 focus:ring-red-500"
                                                        />
                                                        <span className="text-xs font-medium text-red-700">
                                                            I confirm this report is accurate despite the AI warning
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {aiResult.lowConfidence && (
                                        <div className="mt-3 bg-amber-100 border border-amber-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-800">
                                                        Low confidence verification
                                                    </p>
                                                    <p className="text-xs text-amber-600 mt-1">
                                                        The AI score is between 40-69%. Consider checking that your description and proof image match the topic.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Loading state for initial verification */}
                    {aiRunning && !aiResult && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            <span className="text-sm text-blue-700 font-medium">Running AI verification...</span>
                        </div>
                    )}

                    {/* Field 5: Study Materials */}
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
                    disabled={!isValid || submitting || (needsConfirmation && !staffConfirmedFlag)}
                    className={`w-full py-3.5 rounded-xl font-semibold text-base transition-colors ${isValid && !(needsConfirmation && !staffConfirmedFlag)
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {needsConfirmation && !staffConfirmedFlag
                        ? 'Confirm AI Warning to Submit'
                        : 'Submit Hour Report'
                    }
                </button>

                {/* Confirmation Modal */}
                {showConfirm && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Submission</h3>

                            {/* AI status in confirmation */}
                            {aiResult && (
                                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${aiResult.verified ? 'bg-emerald-50' :
                                        aiResult.lowConfidence ? 'bg-amber-50' : 'bg-red-50'
                                    }`}>
                                    {getStatusIcon(aiResult.status)}
                                    <span className={`text-sm font-semibold ${aiResult.verified ? 'text-emerald-700' :
                                            aiResult.lowConfidence ? 'text-amber-700' : 'text-red-700'
                                        }`}>
                                        AI Score: {aiResult.score}% — {getStatusLabel(aiResult)}
                                    </span>
                                </div>
                            )}

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

// ═══════════════════════════════════════════════════════════════
// LAYER SCORE ROW COMPONENT
// ═══════════════════════════════════════════════════════════════

function LayerScoreRow({ icon, label, sublabel, score, weight, reason, loading, progress }) {
    const [showReason, setShowReason] = useState(false);

    const getColor = (s) => {
        if (s === null || s === undefined) return 'bg-gray-200';
        if (s >= 70) return 'bg-emerald-500';
        if (s >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getTextColor = (s) => {
        if (s === null || s === undefined) return 'text-gray-400';
        if (s >= 70) return 'text-emerald-600';
        if (s >= 40) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white/60 rounded-xl px-4 py-3 border border-gray-100">
            <div className="flex items-center gap-3">
                <div className="text-gray-500 flex-shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <span className="text-xs font-bold text-gray-800">{label}</span>
                            {weight && <span className="text-xs text-gray-400 ml-1">({weight}%)</span>}
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                <span className="text-xs text-blue-500 font-medium">
                                    {progress !== undefined && progress > 0 ? `${progress}%` : 'Analyzing...'}
                                </span>
                            </div>
                        ) : score !== null && score !== undefined ? (
                            <span className={`text-sm font-black ${getTextColor(score)}`}>{score}%</span>
                        ) : (
                            <span className="text-xs text-gray-400 italic">Pending image</span>
                        )}
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        {loading && progress !== undefined ? (
                            <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        ) : (
                            <div className={`h-full rounded-full transition-all duration-500 ${getColor(score)}`}
                                style={{ width: `${score ?? 0}%` }}
                            />
                        )}
                    </div>
                    {reason && (
                        <button
                            onClick={() => setShowReason(!showReason)}
                            className="text-xs text-gray-400 hover:text-gray-600 mt-1.5 flex items-center gap-1 transition-colors"
                        >
                            {sublabel}
                            {showReason ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    )}
                    {showReason && reason && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-gray-50 px-2.5 py-2 rounded-lg">
                            {reason}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
