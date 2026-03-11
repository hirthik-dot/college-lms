import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
    Calendar, Clock, BookOpen, Beaker, Coffee, ChevronRight,
    Loader2, MapPin
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = [1, 2, 3, 4, 5, 6, 7];
const HOUR_LABELS = {
    1: '09:15-10:05', 2: '10:05-10:55', 3: '11:15-12:05',
    4: '12:05-12:55', 5: '14:00-14:50', 6: '14:50-15:40', 7: '15:40-16:30',
};

const slotColors = {
    theory: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
    practical: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
    others: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', badge: 'bg-gray-200 text-gray-600' },
    cross_dept: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
};

export default function MyTimetable() {
    const [slots, setSlots] = useState([]);
    const [todaySlots, setTodaySlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [today, setToday] = useState('');

    useEffect(() => {
        fetchTimetable();
        fetchToday();
    }, []);

    const fetchTimetable = async () => {
        try {
            const res = await api.get('/staff/timetable/my');
            setSlots(res.data.data?.slots || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchToday = async () => {
        try {
            const res = await api.get('/staff/timetable/today');
            setTodaySlots(res.data.data?.slots || []);
            setToday(res.data.data?.today || '');
        } catch (e) { console.error(e); }
    };

    // Build grid
    const grid = {};
    for (const s of slots) {
        grid[`${s.day}-${s.hour}`] = s;
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[new Date().getDay()];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
                <p className="text-sm text-gray-500 mt-1">Your weekly class schedule</p>
            </div>

            {/* Today's Schedule Summary */}
            {today && today !== 'Sunday' && todaySlots.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Today's Schedule — {today}</h3>
                        <span className="ml-auto text-sm text-blue-600 font-medium">{todaySlots.length} classes</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {todaySlots.map((slot, i) => {
                            const isCurrent = slot.is_current;
                            const colors = slot.is_cross_dept ? slotColors.cross_dept :
                                slot.is_non_teaching ? slotColors.others :
                                    slotColors[slot.slot_type] || slotColors.theory;
                            return (
                                <div
                                    key={i}
                                    className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer
                                        ${isCurrent ? 'border-blue-500 bg-white shadow-md ring-2 ring-blue-200 scale-[1.02]' : `${colors.bg} ${colors.border}`}`}
                                    onClick={() => setSelectedSlot(slot)}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                            Hr {slot.hour_number} • {slot.start_time?.substring(0, 5)}
                                        </span>
                                        {isCurrent && (
                                            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full font-bold animate-pulse">NOW</span>
                                        )}
                                    </div>
                                    <p className={`text-sm font-semibold ${colors.text}`}>
                                        {slot.subject_code || slot.subject_name || '—'}
                                    </p>
                                    <p className="text-xs text-gray-500">{slot.class_name || ''}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Weekly Grid */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Weekly Timetable</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-gray-200 px-3 py-2.5 text-left font-semibold text-gray-700 w-28">Day</th>
                                {HOURS.map(h => (
                                    <th key={h} className="border border-gray-200 px-2 py-2.5 text-center font-medium text-gray-600 min-w-[100px]">
                                        <div className="text-xs">Hr {h}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{HOUR_LABELS[h]}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map(day => {
                                const isToday = day === currentDay;
                                return (
                                    <tr key={day} className={isToday ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}>
                                        <td className={`border border-gray-200 px-3 py-2.5 font-semibold ${isToday ? 'text-blue-700 bg-blue-50' : 'text-gray-700 bg-gray-50'}`}>
                                            {day}
                                            {isToday && <span className="ml-1 text-[10px] text-blue-500 font-normal">TODAY</span>}
                                        </td>
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

                                            const colors = slot.is_cross_dept ? slotColors.cross_dept :
                                                slot.is_non_teaching ? slotColors.others :
                                                    slotColors[slot.slot_type] || slotColors.theory;

                                            const isCurrent = isToday &&
                                                currentTime >= (slot.start_time || '').substring(0, 5) &&
                                                currentTime < (slot.end_time || '').substring(0, 5);

                                            const colSpan = (slot.is_practical_span && slot.practical_pair_hour === hour + 1) ? 2 : 1;

                                            return (
                                                <td key={hour} colSpan={colSpan} className={`border border-gray-200 px-1 py-1 ${colSpan === 2 ? 'w-2/7' : 'w-1/7'}`}>
                                                    <div
                                                        className={`${colors.bg} ${colors.border} border rounded-lg px-2 py-1.5 text-center cursor-pointer
                                                            transition-all hover:shadow-sm ${isCurrent ? 'ring-2 ring-blue-400 shadow-md animate-pulse' : ''}`}
                                                        onClick={() => setSelectedSlot(slot)}
                                                    >
                                                        <div className={`font-semibold text-xs ${colors.text}`}>
                                                            {slot.subject_code || slot.subject_name || '—'}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">{slot.class_name || ''}</div>
                                                        {slot.is_cross_dept && (
                                                            <span className="inline-block mt-0.5 text-[9px] bg-purple-200 text-purple-700 px-1 rounded">ECE</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Theory</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Practical</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" /> Non-teaching</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-200" /> Cross-dept</span>
                </div>
            </div>

            {/* Slot Detail Side Panel (Modal) */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedSlot(null)}>
                    <div className="w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Slot Details</h3>
                            <button onClick={() => setSelectedSlot(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider">Subject</label>
                                <p className="text-lg font-semibold text-gray-900 mt-1">
                                    {selectedSlot.subject_name || selectedSlot.subject_code || '—'}
                                </p>
                                {selectedSlot.subject_code && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-mono">
                                        {selectedSlot.subject_code}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider">Class</label>
                                <p className="text-base font-medium text-gray-800 mt-1">{selectedSlot.class_name || '—'}</p>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Day</label>
                                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedSlot.day}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Hour</label>
                                    <p className="text-sm font-medium text-gray-800 mt-1">Hr {selectedSlot.hour}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Time</label>
                                    <p className="text-sm font-medium text-gray-800 mt-1">
                                        {selectedSlot.start_time?.substring(0, 5)} - {selectedSlot.end_time?.substring(0, 5)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider">Type</label>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedSlot.is_non_teaching ? 'bg-gray-200 text-gray-600' :
                                        selectedSlot.slot_type === 'practical' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedSlot.is_non_teaching ? 'Non-Teaching' :
                                            selectedSlot.slot_type === 'practical' ? 'Practical' : 'Theory'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No data */}
            {slots.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No timetable found</p>
                    <p className="text-sm mt-1">Your timetable will appear here once the HOD uploads it</p>
                </div>
            )}
        </div>
    );
}
