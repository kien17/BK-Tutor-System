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

    const getCellStyle = (day, period) => {
        const booking = bookings.find(
            b => b.DayOfWeek === day && period >= b.StartPeriod && period <= b.EndPeriod
        );

        if (booking) {
            return {
                background: "#ffe08a",
                border: "1px solid #ffcf52",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "0.15s",
            };
        }

        const isFree = availability.find(
            a => a.DayOfWeek === day && period >= a.StartPeriod && period <= a.EndPeriod
        );

        if (isFree) {
            return {
                background: "#c4f4d4",
                border: "1px solid #7ddf95",
                cursor: "pointer",
                transition: "0.15s",
            };
        }

        return {
            background: "#ffffff",
            border: "1px solid #e8e8e8",
            cursor: "pointer",
            transition: "0.15s",
        };
    };

    return (
        <>
            {/* Week Selector */}
            <div style={{ marginBottom: 15 }}>
                <label style={{ fontWeight: 600, marginRight: 10 }}>Chọn tuần:</label>
                <select
                    onChange={e => setWeek(Number(e.target.value))}
                    value={week}
                    style={{
                        padding: 7,
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        fontSize: 14,
                        background: "#f8faff"
                    }}
                >
                    {[...Array(20)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            Tuần {i + 1}
                        </option>
                    ))}
                </select>

                <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                    • Trắng = <b>Chưa đăng ký</b> &nbsp;&nbsp;
                    • Xanh = <b>Rảnh</b> &nbsp;&nbsp;
                    • Vàng = <b>Có lịch</b>
                </div>
            </div>

            {/* Schedule Grid */}
            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        width: "100%",
                        textAlign: "center",
                        tableLayout: 'fixed',
                        borderRadius: 10,
                        overflow: "hidden",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    background: "#004aad",
                                    color: "white",
                                    padding: 10,
                                    width: 80,
                                    fontSize: 14,
                                }}
                            >
                                Tiết
                            </th>
                            {DAYS.map((d) => (
                                <th
                                    key={d}
                                    style={{
                                        background: "#0066d1",
                                        color: "white",
                                        padding: 10,
                                        fontSize: 14,
                                    }}
                                >
                                    Thứ {d}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {PERIODS.map((p) => (
                            <tr key={p}>
                                <td
                                    style={{
                                        background: "#f2f2f2",
                                        padding: 8,
                                        fontWeight: 600,
                                        borderRight: "1px solid #dcdcdc",
                                    }}
                                >
                                    Tiết {p}
                                </td>

                                {DAYS.map((d) => {
                                    const booking = bookings.find(
                                        b => b.DayOfWeek === d && p >= b.StartPeriod && p <= b.EndPeriod
                                    );

                                    return (
                                        <td
                                            key={`${d}-${p}`}
                                            onClick={() => handleGridClick(d, p)}
                                            style={{
                                                height: 48,
                                                fontSize: 12,
                                                width: 80,
                                                ...getCellStyle(d, p),
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.93)"}
                                            onMouseLeave={e => e.currentTarget.style.filter = "none"}
                                        >
                                            {booking && (
                                                <div style={{ lineHeight: 1.2 }}>
                                                    <div>
                                                        {booking.Status === "pending" ? "⏳ Chờ" : "✔ Đã nhận"}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 10,
                                                            maxWidth: 90,
                                                            overflow: "hidden",
                                                            whiteSpace: "nowrap",
                                                            textOverflow: "ellipsis",
                                                            opacity: 0.8
                                                        }}
                                                    >
                                                        {booking.StudentName}
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
