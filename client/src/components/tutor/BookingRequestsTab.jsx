// src/components/tutor/BookingRequestsTab.jsx
import React, { useState } from "react";

// =================== STATUS BADGE ===================
const statusBadge = (status) => {
    const map = {
        pending: { text: "⏳ Chờ duyệt", color: "#6f42c1" },
        confirmed: { text: "✅ Đã duyệt", color: "#28a745" },
        rescheduled: { text: "📅 Đã đổi lịch", color: "#fd7e14" },
        rejected: { text: "❌ Từ chối", color: "#dc3545" }
    };

    const item = map[status] || { text: status, color: "#6c757d" };

    return (
        <span
            style={{
                background: item.color,
                color: "white",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap"
            }}
        >
            {item.text}
        </span>
    );
};

// =================== BUTTON COMPONENT ===================
const ActionButton = ({ color, children, onClick }) => {
    const [hover, setHover] = useState(false);

    const baseStyle = {
        background: color,
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13,
        whiteSpace: "nowrap",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    };

    const hoverStyle = {
        filter: "brightness(1.1)",
        transform: "translateY(-1px)",
    };

    return (
        <button
            style={{ ...baseStyle, ...(hover ? hoverStyle : {}) }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

// =================== MAIN COMPONENT ===================
const BookingRequestsTab = ({ bookings, onHandleAction }) => {

    // Modal state
    const [selectedBooking, setSelectedBooking] = useState(null);
    const openModal = (booking) => setSelectedBooking(booking);
    const closeModal = () => setSelectedBooking(null);

    return (
        <div
            style={{
                background: "#f8faff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                marginTop: 15,
            }}
        >
            <h3
                style={{
                    margin: "0 0 20px 0",
                    color: "#004aad",
                    fontSize: 20,
                    fontWeight: 700,
                }}
            >
                📨 Yêu Cầu Đặt Lịch{" "}
                <span style={{ color: "#6f42c1" }}>
                    ({bookings.filter(b => b.Status === "pending").length})
                </span>
            </h3>

            {bookings.length === 0 ? (
                <p
                    style={{
                        textAlign: "center",
                        padding: 40,
                        color: "#888",
                        fontStyle: "italic",
                    }}
                >
                    Không có yêu cầu nào trong tuần này.
                </p>
            ) : (
                <table
                    style={{
                        marginTop: 10,
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        borderRadius: 10,
                        overflow: "hidden",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    }}
                >
                    <thead>
                        <tr style={{ background: "#004aad", color: "white" }}>
                            <th style={{ padding: 12, textAlign: "left" }}>Sinh viên</th>
                            <th style={{ padding: 12, textAlign: "left" }}>Lịch hẹn</th>
                            <th style={{ padding: 12, textAlign: "left", width: 260 }}>Nội dung</th>
                            <th style={{ padding: 12, textAlign: "center" }}>Trạng thái</th>
                            <th style={{ padding: 12, textAlign: "center" }}>Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {bookings.map((b, i) => (
                            <tr
                                key={b.BookingID}
                                style={{
                                    background: i % 2 === 0 ? "white" : "#f4f7ff",
                                    borderBottom: "1px solid #e0e6f1",
                                }}
                            >
                                <td style={{ padding: 12, color: "#004aad", fontWeight: 600, fontSize: 15 }}>
                                    {b.StudentName}
                                </td>

                                <td style={{ padding: 12, fontSize: 14 }}>
                                    Tuần {b.WeekNumber} • Thứ {b.DayOfWeek} • Tiết {b.StartPeriod}
                                    {b.EndPeriod !== b.StartPeriod ? `-${b.EndPeriod}` : ""}
                                </td>

                                <td
                                    style={{
                                        padding: 12,
                                        maxWidth: 250,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {b.Topic}
                                    <br />
                                    <button
                                        style={{
                                            marginTop: 5,
                                            background: "transparent",
                                            border: "none",
                                            color: "#004aad",
                                            cursor: "pointer",
                                            fontSize: 13,
                                            textDecoration: "underline",
                                            fontWeight: 600,
                                        }}
                                        onClick={() => openModal(b)}
                                    >
                                        Xem chi tiết
                                    </button>
                                </td>

                                <td style={{ padding: 12, textAlign: "center" }}>
                                    {statusBadge(b.Status)}
                                </td>

                                <td style={{ padding: 12, textAlign: "center" }}>
                                    {b.Status === "pending" && (
                                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                            <ActionButton color="#28a745" onClick={() => onHandleAction(b.BookingID, "confirmed")}>
                                                ✅ Duyệt
                                            </ActionButton>
                                            <ActionButton color="#fd7e14" onClick={() => onHandleAction(b.BookingID, "rescheduled")}>
                                                📅 Đổi lịch
                                            </ActionButton>
                                            <ActionButton color="#dc3545" onClick={() => onHandleAction(b.BookingID, "rejected")}>
                                                ❌ Từ chối
                                            </ActionButton>
                                        </div>
                                    )}

                                    {b.Status === "confirmed" && (
                                        <ActionButton color="#dc3545" onClick={() => onHandleAction(b.BookingID, "rejected")}>
                                            Hủy
                                        </ActionButton>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ========================= MODAL ============================ */}
            {selectedBooking && (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(3px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: 10,
                    overflowY: "auto"
                }}
            >
                <div
                    style={{
                        background: "white",
                        width: "100%",
                        maxWidth: 520,
                        borderRadius: 12,
                        boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        padding: 20,
                        boxSizing: "border-box"
                    }}
                >
                    {/* Header */}
                    <div style={{ borderBottom: "1px solid #e0e0e0", paddingBottom: 10, marginBottom: 15 }}>
                        <h2 style={{ margin: 0, color: "#004aad", fontSize: 22 }}>
                            Chi tiết yêu cầu
                        </h2>
                    </div>

                    {/* Nội dung chi tiết */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                        <div><strong>Sinh viên:</strong> {selectedBooking.StudentName}</div>
                        <div>
                            <strong>Thời gian:</strong> Tuần {selectedBooking.WeekNumber} • Thứ {selectedBooking.DayOfWeek} •
                            Tiết {selectedBooking.StartPeriod}{selectedBooking.EndPeriod !== selectedBooking.StartPeriod ? `-${selectedBooking.EndPeriod}` : ""}
                        </div>
                        <div><strong>Trạng thái:</strong> {statusBadge(selectedBooking.Status)}</div>
                        <div
                            style={{
                                background: "#f8f9ff",
                                padding: 12,
                                borderRadius: 8,
                                maxHeight: 220,
                                overflowY: "auto",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word"
                            }}
                        >
                            <strong>Nội dung đầy đủ:</strong>
                            <div style={{ marginTop: 4 }}>{selectedBooking.Topic}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                        marginTop: 20,
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        flexWrap: "wrap"
                    }}>
                        <ActionButton color="#6c757d" onClick={closeModal}>Đóng</ActionButton>

                        {selectedBooking.Status === "pending" && (
                            <>
                                <ActionButton color="#28a745" onClick={() => { onHandleAction(selectedBooking.BookingID, "confirmed"); closeModal(); }}>
                                    ✅ Duyệt
                                </ActionButton>
                                <ActionButton color="#fd7e14" onClick={() => { onHandleAction(selectedBooking.BookingID, "rescheduled"); closeModal(); }}>
                                    📅 Đổi lịch
                                </ActionButton>
                                <ActionButton color="#dc3545" onClick={() => { onHandleAction(selectedBooking.BookingID, "rejected"); closeModal(); }}>
                                    ❌ Từ chối
                                </ActionButton>
                            </>
                        )}

                        {selectedBooking.Status === "confirmed" && (
                            <ActionButton color="#dc3545" onClick={() => { onHandleAction(selectedBooking.BookingID, "rejected"); closeModal(); }}>
                                Hủy
                            </ActionButton>
                        )}
                    </div>
                </div>
            </div>
        )}

        </div>
    );
};

export default BookingRequestsTab;
