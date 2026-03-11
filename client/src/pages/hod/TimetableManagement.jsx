import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
    Upload, Grid3X3, Users, Building2, Clock, CheckCircle2,
    AlertCircle, ChevronDown, FileText, RefreshCw, Loader2,
    Calendar, BookOpen, Beaker, Coffee
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = [1, 2, 3, 4, 5, 6, 7];
const HOUR_LABELS = {
    1: '09:15-10:05', 2: '10:05-10:55', 3: '11:15-12:05',
    4: '12:05-12:55', 5: '14:00-14:50', 6: '14:50-15:40', 7: '15:40-16:30',
};

const slotColors = {
    theory: 'bg-blue-50 border-blue-200 text-blue-800',
    practical: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    others: 'bg-gray-100 border-gray-300 text-gray-600',
    cross_dept: 'bg-purple-50 border-purple-200 text-purple-700',
};

export default function TimetableManagement() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('upload');
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // Staff-wise view
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [staffTimetable, setStaffTimetable] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Class-wise view
    const [classList, setClassList] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [classTimetable, setClassTimetable] = useState([]);
    const [loadingClass, setLoadingClass] = useState(false);

    // Upload history
    const [uploadHistory, setUploadHistory] = useState([]);

    // Fetch staff list & class list on mount
    useEffect(() => {
        fetchStaffList();
        fetchClassList();
        fetchUploadHistory();
    }, []);

    const fetchStaffList = async () => {
        try {
            const res = await api.get('/hod/timetable/staff-list');
            setStaffList(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchClassList = async () => {
        try {
            const res = await api.get('/hod/timetable/classes');
            setClassList(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchUploadHistory = async () => {
        try {
            const res = await api.get('/hod/timetable/upload-history');
            setUploadHistory(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    // File upload handler
    const handleUpload = async (file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setUploadError('Only PDF files are allowed.');
            return;
        }

        setUploading(true);
        setUploadError('');
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/hod/timetable/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000, // 2 min timeout for large PDFs
            });

            setUploadResult(res.data.data);
            fetchStaffList();
            fetchClassList();
            fetchUploadHistory();
        } catch (err) {
            setUploadError(
                err.response?.data?.message || 'Failed to upload timetable PDF.'
            );
        } finally {
            setUploading(false);
        }
    };

    // Drag & drop
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
    };

    // Fetch staff timetable when selected
    const fetchStaffTimetable = useCallback(async (staffId) => {
        if (!staffId) { setStaffTimetable([]); return; }
        setLoadingStaff(true);
        try {
            const res = await api.get(`/hod/timetable/staff-wise?staff_id=${staffId}`);
            setStaffTimetable(res.data.data || []);
        } catch (e) { console.error(e); }
        setLoadingStaff(false);
    }, []);

    const fetchClassTimetable = useCallback(async (classId) => {
        if (!classId) { setClassTimetable([]); return; }
        setLoadingClass(true);
        try {
            const res = await api.get(`/hod/timetable/class-wise?class_id=${classId}`);
            setClassTimetable(res.data.data || []);
        } catch (e) { console.error(e); }
        setLoadingClass(false);
    }, []);

    useEffect(() => { fetchStaffTimetable(selectedStaff); }, [selectedStaff, fetchStaffTimetable]);
    useEffect(() => { fetchClassTimetable(selectedClass); }, [selectedClass, fetchClassTimetable]);

    const tabs = [
        { key: 'upload', label: 'Upload', icon: Upload },
        { key: 'staff', label: 'Staff-wise', icon: Users },
        { key: 'class', label: 'Class-wise', icon: Building2 },
        { key: 'history', label: 'History', icon: FileText },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Upload faculty timetable PDF to auto-seed all data</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && (
                <UploadPanel
                    uploading={uploading}
                    uploadResult={uploadResult}
                    uploadError={uploadError}
                    dragActive={dragActive}
                    handleDrag={handleDrag}
                    handleDrop={handleDrop}
                    handleUpload={handleUpload}
                />
            )}

            {activeTab === 'staff' && (
                <StaffWiseView
                    staffList={staffList}
                    selectedStaff={selectedStaff}
                    setSelectedStaff={setSelectedStaff}
                    timetable={staffTimetable}
                    loading={loadingStaff}
                />
            )}

            {activeTab === 'class' && (
                <ClassWiseView
                    classList={classList}
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                    timetable={classTimetable}
                    loading={loadingClass}
                />
            )}

            {activeTab === 'history' && (
                <UploadHistoryView
                    history={uploadHistory}
                    onRefresh={fetchUploadHistory}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Upload Panel
// ═══════════════════════════════════════════════════════════════
function UploadPanel({ uploading, uploadResult, uploadError, dragActive, handleDrag, handleDrop, handleUpload }) {
    return (
        <div className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
                    ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'}`}
                onClick={() => document.getElementById('pdf-upload').click()}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <div>
                            <p className="text-lg font-semibold text-gray-800">Parsing timetable PDF...</p>
                            <p className="text-sm text-gray-500 mt-1">This may take 10-15 seconds for large files</p>
                        </div>
                        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-800">
                                Drop your Faculty Timetable PDF here
                            </p>
                            <p className="text-sm text-gray-500 mt-1">or click to browse • PDF only • Up to 50MB</p>
                        </div>
                    </div>
                )}
                <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
            </div>

            {/* Error */}
            {uploadError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-800">Upload Failed</p>
                        <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                    </div>
                </div>
            )}

            {/* Success Result */}
            {uploadResult && (
                <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 bg-green-50 border-b border-green-200 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-green-800">Timetable Uploaded Successfully!</h3>
                    </div>
                    <div className="p-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'Staff Parsed', value: uploadResult.staffParsed, icon: Users, color: 'blue' },
                                { label: 'Slots Created', value: uploadResult.slotsCreated, icon: Grid3X3, color: 'emerald' },
                                { label: 'Subjects Found', value: uploadResult.subjectsCreated, icon: BookOpen, color: 'purple' },
                                { label: 'Classes Created', value: uploadResult.classesCreated, icon: Building2, color: 'amber' },
                            ].map(stat => (
                                <div key={stat.label} className={`bg-${stat.color}-50 rounded-xl p-4 border border-${stat.color}-200`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}-600 mb-2`} />
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Staff Gmail Table */}
                        {uploadResult.staffGmails?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Staff Accounts Created</h4>
                                <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                    Default password for all staff: <code className="bg-amber-100 px-2 py-0.5 rounded font-bold">hitech@123</code>
                                </div>
                                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                                                <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                                                <th className="text-left px-3 py-2 font-medium text-gray-600">Gmail</th>
                                                <th className="text-left px-3 py-2 font-medium text-gray-600">Staff Code</th>
                                                <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {uploadResult.staffGmails.map((s, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                    <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                                                    <td className="px-3 py-2 text-blue-600">{s.gmail}</td>
                                                    <td className="px-3 py-2 text-gray-600">{s.staffCode}</td>
                                                    <td className="px-3 py-2">
                                                        {s.isHod ? (
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">HOD</span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Staff</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {uploadResult.errors?.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <h4 className="font-semibold text-red-800 mb-2">Parsing Errors ({uploadResult.errors.length})</h4>
                                {uploadResult.errors.map((e, i) => (
                                    <p key={i} className="text-sm text-red-600">• {e.staff || `Page ${e.page}`}: {e.error}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Timetable Grid Component (shared between staff-wise and class-wise)
// ═══════════════════════════════════════════════════════════════
function TimetableGrid({ slots, cellContent }) {
    // Build grid map: day+hour → slot
    const grid = {};
    for (const s of slots) {
        grid[`${s.day}-${s.hour}`] = s;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2.5 text-left font-semibold text-gray-700 w-28">Day / Hour</th>
                        {HOURS.map(h => (
                            <th key={h} className="border border-gray-200 px-2 py-2.5 text-center font-medium text-gray-600 min-w-[100px]">
                                <div className="text-xs">Hr {h}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{HOUR_LABELS[h]}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {DAYS.map(day => (
                        <tr key={day} className="hover:bg-gray-50/50">
                            <td className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-700 bg-gray-50">{day}</td>
                            {HOURS.map(hour => {
                                const prevSlot = grid[`${day}-${hour - 1}`];
                                if (prevSlot?.is_practical_span && prevSlot?.practical_pair_hour === hour) {
                                    return null;
                                }

                                const slot = grid[`${day}-${hour}`];
                                if (!slot) return (
                                    <td key={hour} className="border border-gray-200 px-2 py-2 text-center text-gray-300">
                                        <span>—</span>
                                    </td>
                                );

                                const colorClass = slot.is_cross_dept ? slotColors.cross_dept :
                                    slot.is_non_teaching ? slotColors.others :
                                        slotColors[slot.slot_type] || slotColors.theory;

                                const colSpan = (slot.is_practical_span && slot.practical_pair_hour === hour + 1) ? 2 : 1;

                                return (
                                    <td key={hour} colSpan={colSpan} className={`border border-gray-200 px-1.5 py-1.5 ${colSpan === 2 ? 'w-2/7' : 'w-1/7'}`}>
                                        <div className={`${colorClass} rounded-lg px-2 py-1.5 text-center border transition-all hover:shadow-sm`}
                                            title={`${slot.subject_name || slot.subject_code} | ${slot.class_name || slot.staff_name || ''}`}>
                                            <div className="font-semibold text-xs leading-tight">
                                                {slot.subject_code || slot.subject_name || '—'}
                                            </div>
                                            {cellContent(slot)}
                                            {slot.is_cross_dept && (
                                                <span className="inline-block mt-0.5 text-[9px] bg-purple-200 text-purple-700 px-1 rounded">ECE</span>
                                            )}
                                            {slot.is_practical_span && (
                                                <span className="inline-block mt-0.5 text-[9px] bg-emerald-200 text-emerald-700 px-1 rounded">LAB</span>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Staff-wise View
// ═══════════════════════════════════════════════════════════════
function StaffWiseView({ staffList, selectedStaff, setSelectedStaff, timetable, loading }) {
    const staffData = timetable.length > 0 ? timetable[0] : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[300px]"
                >
                    <option value="">Select a staff member...</option>
                    {staffList.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.full_name} {s.staff_code ? `(${s.staff_code})` : ''}
                        </option>
                    ))}
                </select>
                {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            </div>

            {staffData && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">{staffData.name}</h3>
                        <p className="text-sm text-gray-500">{staffData.designation} • {staffData.staff_code}</p>
                    </div>
                    <div className="p-4">
                        <TimetableGrid
                            slots={staffData.slots}
                            cellContent={(slot) => (
                                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                    {slot.class_name || ''}
                                </div>
                            )}
                        />
                    </div>
                </div>
            )}

            {!selectedStaff && (
                <div className="text-center py-16 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a staff member to view their timetable</p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Class-wise View
// ═══════════════════════════════════════════════════════════════
function ClassWiseView({ classList, selectedClass, setSelectedClass, timetable, loading }) {
    const classData = timetable.length > 0 ? timetable[0] : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[300px]"
                >
                    <option value="">Select a class...</option>
                    {classList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            </div>

            {classData && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">{classData.name}</h3>
                        <p className="text-sm text-gray-500">Year {classData.year} • {classData.department} • Section {classData.section || '—'}</p>
                    </div>
                    <div className="p-4">
                        <TimetableGrid
                            slots={classData.slots}
                            cellContent={(slot) => (
                                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                    {slot.staff_name || ''}
                                </div>
                            )}
                        />
                    </div>
                </div>
            )}

            {!selectedClass && (
                <div className="text-center py-16 text-gray-400">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a class to view their timetable</p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Upload History View
// ═══════════════════════════════════════════════════════════════
function UploadHistoryView({ history, onRefresh }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upload History</h3>
                <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No timetable uploads yet</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">File</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Staff</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Slots</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map(h => (
                                <tr key={h.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{h.filename || '—'}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {h.uploaded_at ? new Date(h.uploaded_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {h.status === 'success' ? (
                                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                                <CheckCircle2 className="w-3 h-3" /> Success
                                            </span>
                                        ) : h.status === 'failed' ? (
                                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                                <AlertCircle className="w-3 h-3" /> Failed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Processing
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-700">{h.staff_parsed || 0}</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-700">{h.slots_created || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
