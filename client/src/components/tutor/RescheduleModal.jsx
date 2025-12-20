import React, { useState } from "react";
import BookingModal from "../BookingModal";

const DAYS = [2,3,4,5,6,7,8];
const PERIODS = Array.from({ length: 17 }, (_, i) => i + 1);

const RescheduleModal = ({
    isOpen,
    onClose,
    booking,
    week,
    bookings,
    sessions,
    onConfirm
}) => {
    const [day, setDay] = useState(booking?.DayOfWeek || 2);
    const [period, setPeriod] = useState(booking?.StartPeriod || 1);
    const [error, setError] = useState("");

    if (!isOpen || !booking) return null;

    // ===== CHECK TRÙNG =====
    const isConflict = () => {
        // 1️⃣ Trùng booking khác
        const conflictBooking = bookings.find(b =>
            b.BookingID !== booking.BookingID &&
            b.WeekNumber === week &&
            b.DayOfWeek === day &&
            period >= b.StartPeriod &&
            period <= b.EndPeriod
        );

        if (conflictBooking) {
            return "⛔ Trùng lịch với booking khác";
        }

        // 2️⃣ Trùng AcademicSession
        const conflictSession = sessions.find(s =>
            s.WeekNumber === week &&
            s.DayOfWeek === day &&
            period >= s.StartPeriod &&
            period <= s.EndPeriod
        );

        if (conflictSession) {
            return "⛔ Trùng lịch với buổi Tư vấn Nhóm";
        }

        return "";
    };

    const handleConfirm = () => {
        const conflict = isConflict();
        if (conflict) {
            setError(conflict);
            return;
        }
        onConfirm({ week, day, period });
        onClose();
    };

    return (
        <BookingModal
            isOpen={isOpen}
            onClose={onClose}
            title="🔄 Đổi lịch hẹn"
            actions={
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="btn-secondary">
                        Hủy
                    </button>
                    <button onClick={handleConfirm} className="btn-primary">
                        Xác nhận
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <div>
                    <label className="font-semibold">Thứ</label>
                    <select
                        value={day}
                        onChange={e => setDay(Number(e.target.value))}
                        className="w-full border px-3 py-2 rounded"
                    >
                        {DAYS.map(d => (
                            <option key={d} value={d}>Thứ {d}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="font-semibold">Tiết</label>
                    <select
                        value={period}
                        onChange={e => setPeriod(Number(e.target.value))}
                        className="w-full border px-3 py-2 rounded"
                    >
                        {PERIODS.map(p => (
                            <option key={p} value={p}>Tiết {p}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="text-red-600 font-semibold text-sm">
                        {error}
                    </div>
                )}
            </div>
        </BookingModal>
    );
};

export default RescheduleModal;
