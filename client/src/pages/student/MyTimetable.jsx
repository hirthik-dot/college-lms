import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar, Clock, Loader2, BookOpen } from 'lucide-react';

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
};

export default function StudentMyTimetable() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const res = await api.get('/student/timetable/my');
                setData(res.data.data);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchTimetable();
    }, []);

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

    const slots = data?.slots || [];
    const className = data?.className || '';

    // Build grid
    const grid = {};
    for (const s of slots) {
        grid[`${s.day}-${s.hour}`] = s;
    }

    // Today's slots
    const todaySlots = slots.filter(s => s.day === currentDay);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
                {className && <p className="text-sm text-gray-500 mt-1">Class: {className}</p>}
            </div>

            {/* Today's Schedule */}
            {currentDay !== 'Sunday' && todaySlots.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-indigo-900">Today — {currentDay}</h3>
                        <span className="ml-auto text-sm text-indigo-600 font-medium">{todaySlots.length} classes</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {todaySlots.map((slot, i) => {
                            const isCurrent = currentTime >= (slot.start_time || '').substring(0, 5) &&
                                currentTime < (slot.end_time || '').substring(0, 5);
                            const colorClass = slot.is_non_teaching ? slotColors.others :
                                slotColors[slot.slot_type] || slotColors.theory;
                            return (
                                <div key={i} className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all
                                    ${isCurrent ? 'border-indigo-500 bg-white shadow-md ring-2 ring-indigo-200' : `${colorClass} border`}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-500">Hr {slot.hour} • {slot.start_time?.substring(0, 5)}</span>
                                        {isCurrent && <span className="px-1.5 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 rounded-full font-bold animate-pulse">NOW</span>}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">{slot.subject_name || slot.subject_code || '—'}</p>
                                    <p className="text-xs text-gray-500">{slot.staff_name || ''}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Weekly Grid */}
            {slots.length > 0 ? (
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
                                        <tr key={day} className={isToday ? 'bg-indigo-50/30' : ''}>
                                            <td className={`border border-gray-200 px-3 py-2.5 font-semibold ${isToday ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700 bg-gray-50'}`}>
                                                {day}
                                                {isToday && <span className="ml-1 text-[10px] text-indigo-500 font-normal">TODAY</span>}
                                            </td>
                                            {HOURS.map(hour => {
                                                const slot = grid[`${day}-${hour}`];
                                                if (!slot) return (
                                                    <td key={hour} className="border border-gray-200 px-2 py-2 text-center text-gray-300 text-xs">—</td>
                                                );

                                                const colorClass = slot.is_non_teaching ? slotColors.others :
                                                    slotColors[slot.slot_type] || slotColors.theory;

                                                const isCurrent = isToday &&
                                                    currentTime >= (slot.start_time || '').substring(0, 5) &&
                                                    currentTime < (slot.end_time || '').substring(0, 5);

                                                return (
                                                    <td key={hour} className="border border-gray-200 px-1 py-1">
                                                        <div className={`${colorClass} border rounded-lg px-2 py-1.5 text-center
                                                            ${isCurrent ? 'ring-2 ring-indigo-400 shadow-md' : ''}`}>
                                                            <div className="font-semibold text-xs">{slot.subject_code || slot.subject_name || '—'}</div>
                                                            <div className="text-[10px] text-gray-500 mt-0.5">{slot.staff_name || ''}</div>
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
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-400">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No timetable found</p>
                    <p className="text-sm mt-1">Your class timetable will appear here once it's uploaded by the HOD</p>
                </div>
            )}
        </div>
    );
}
