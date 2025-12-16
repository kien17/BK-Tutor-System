// src/components/tutor/ScheduleGridTab.jsx
import React from "react";

const PERIODS = Array.from({ length: 17 }, (_, i) => i + 1);
const DAYS = [2, 3, 4, 5, 6, 7, 8];

const ScheduleGridTab = ({
    week,
    setWeek,
    availability,
    bookings,
    onToggleAvailability,
    onOpenBookingModal
}) => {

    const handleGridClick = (day, period) => {
        const booking = bookings.find(
            b => b.DayOfWeek === day && period >= b.StartPeriod && period <= b.EndPeriod
        );
        booking ? onOpenBookingModal(booking) : onToggleAvailability(day, period);
    };

    const getCellClass = (day, period) => {
        const booking = bookings.find(
            b => b.DayOfWeek === day && period >= b.StartPeriod && period <= b.EndPeriod
        );

        if (booking) 
            return "border border-[#ffcf52] bg-[#ffe08a] font-bold cursor-pointer transition duration-150";
        
        const isFree = availability.find(
            a => a.DayOfWeek === day && period >= a.StartPeriod && period <= a.EndPeriod
        );

        if (isFree) 
            return "border border-[#7ddf95] bg-[#c4f4d4] cursor-pointer transition duration-150";
        
        return "border border-[#e8e8e8] bg-white cursor-pointer transition duration-150";
    };

    return (
        <>
            {/* Week Selector */}
            <div className="mb-4 flex justify-between items-center">
                {/* Left: Chọn tuần */}
                <div className="flex items-center gap-2">
                    <label className="font-semibold">Chọn tuần:</label>
                    <select
                    value={week}
                    onChange={e => setWeek(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    {[...Array(20)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Tuần {i + 1}</option>
                    ))}
                    </select>
                </div>

                {/* Right: Legend */}
                <div className="flex gap-4 text-xs items-center">
                    <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-white border border-gray-300"></span> Chưa đăng ký
                    </div>
                    <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-[#c4f4d4] border border-[#7ddf95]"></span> Rảnh
                    </div>
                    <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-[#ffe08a] border border-[#ffcf52]"></span> Có lịch
                    </div>
                </div>
                </div>

            {/* Schedule Grid */}
            <div className="overflow-x-auto">
                <table className="w-full table-fixed border-separate border-spacing-0 rounded-xl shadow-sm overflow-hidden">
                    <thead>
                        <tr>
                            <th className="bg-[#004aad] text-white p-3 w-16 text-sm text-center border border-gray-300">Tiết</th>
                            {DAYS.map(d => (
                                <th key={d} className="bg-[#0066d1] text-white p-3 text-sm text-center border border-gray-300">Thứ {d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {PERIODS.map(p => (
                            <tr key={p} className="hover:bg-gray-50">
                                <td className="bg-gray-100 font-semibold border border-gray-300 p-2 text-center text-sm">
                                    Tiết {p}
                                </td>
                                {DAYS.map(d => {
                                    const booking = bookings.find(
                                        b => b.DayOfWeek === d && p >= b.StartPeriod && p <= b.EndPeriod
                                    );
                                    return (
                                        <td
                                            key={`${d}-${p}`}
                                            onClick={() => handleGridClick(d, p)}
                                            className={`${getCellClass(d, p)} h-12 text-xs p-1 text-center`}
                                            onMouseEnter={e => e.currentTarget.classList.add('brightness-95')}
                                            onMouseLeave={e => e.currentTarget.classList.remove('brightness-95')}
                                        >
                                            {booking && (
                                                <div className="leading-tight">
                                                    <div>{booking.Status === "pending" ? "Đang Chờ Duyệt" : "Đã nhận"}</div>
                                                    <div className="text-[10px] max-w-[80px] truncate opacity-80">
                                                        {/* {booking.StudentName} */}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default ScheduleGridTab;
