import React, { useState } from 'react';
import BookingModal from '../BookingModal';

const BookingHistory = ({
    activeBookings,
    historyBookings,
    reviewedBookings,
    openReviewModal,
    renderStatusBadge
}) => {

    const [viewReviewBooking, setViewReviewBooking] = useState(null);
    const [viewReviewData, setViewReviewData] = useState(null);

    const fetchReview = async (bookingId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/reviews/${bookingId}`, {
                headers: { Authorization: token }
            });
            if (!res.ok) throw new Error("Không lấy được đánh giá");
            const data = await res.json();
            setViewReviewData(data);
            setViewReviewBooking(bookingId);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tải đánh giá!");
        }
    };

    const card = {
        background: "white",
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 14,
        border: "1px solid #ececec",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
    };

    const button = {
        base: {
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            transition: "0.15s"
        },
        primary: {
            background: "#007bff",
            color: "white"
        },
        warning: {
            background: "#ffd66b",
            color: "#5c4400"
        },
        muted: {
            background: "#6c757d",
            color: "white"
        }
    };

    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 40,
            marginTop: 10
        }}>

            {/* --- ACTIVE BOOKINGS --- */}
            <div style={{ flex: 1, minWidth: 360 }}>
                <h3 style={{
                    borderBottom: "2px solid #28a745",
                    paddingBottom: 6,
                    marginBottom: 16,
                    color: "#28a745",
                    fontSize: 20
                }}>
                    Buổi tư vấn đã tham gia
                </h3>

                {activeBookings.length === 0 ? (
                    <p style={{ color: "#666" }}>Chưa có vé nào.</p>
                ) : (
                    activeBookings.map(b => (
                        <div
                            key={b.BookingID}
                            style={{
                                ...card,
                                borderLeft: `6px solid ${
                                    b.Status === "confirmed"
                                        ? "#007bff"
                                        : b.Status === "rescheduled"
                                        ? "#fd7e14"
                                        : "#6f42c1"
                                }`
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <strong style={{ fontSize: 17 }}>
                                    Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}, Tiết {b.StartPeriod}
                                </strong>

                                <div style={{ textAlign: "right", minWidth: 140 }}>
                                    {renderStatusBadge(b.Status)}

                                    <div style={{ marginTop: 10 }}>
                                        {(b.Status === 'confirmed' || b.Status === 'rescheduled')  && !reviewedBookings.includes(b.BookingID) && (
                                            <button
                                                onClick={() => openReviewModal(b)}
                                                style={{ 
                                                    ...button.base,
                                                    ...button.warning
                                                }}
                                            >
                                                ⭐ Đánh giá
                                            </button>
                                        )}

                                        {reviewedBookings.includes(b.BookingID) && (
                                            <button
                                                onClick={() => fetchReview(b.BookingID)}
                                                style={{
                                                    ...button.base,
                                                    ...button.muted
                                                }}
                                            >
                                                🔍 Xem đánh giá
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 10, color: "#555", fontSize: 14 }}>
                                <div><strong>Giảng viên:</strong> {b.TutorName}</div>
                                <div><strong>Địa điểm:</strong> {b.Location || "Chưa cập nhật"} ({b.MeetingMode})</div>
                                <div><strong>Nội dung:</strong> {b.Topic}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- CANCELLED HISTORY --- */}
            <div style={{ flex: 1, minWidth: 360 }}>
                <h3 style={{
                    borderBottom: "2px solid #dc3545",
                    paddingBottom: 6,
                    marginBottom: 16,
                    color: "#dc3545",
                    fontSize: 20
                }}>
                    🗑 Lịch sử Hủy / Từ chối
                </h3>

                {historyBookings.length === 0 ? (
                    <p style={{ color: "#666" }}>Trống.</p>
                ) : (
                    historyBookings.map(b => (
                        <div
                            key={b.BookingID}
                            style={{
                                ...card,
                                background: "#fff0f0",
                                borderLeft: "6px solid #dc3545"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <strong style={{ textDecoration: "line-through" }}>
                                    Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}
                                </strong>

                                <span style={{ color: "#dc3545", fontWeight: 700 }}>
                                    {b.Status === "cancelled" ? "Bạn hủy" : "Giảng viên từ chối"}
                                </span>
                            </div>

                            <div style={{ marginTop: 6, fontSize: 14 }}>
                                <strong>GV:</strong> {b.TutorName}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- MODAL REVIEW --- */}
            <BookingModal
                isOpen={!!viewReviewBooking}
                onClose={() => {
                    setViewReviewBooking(null);
                    setViewReviewData(null);
                }}
                title="⭐ Đánh giá chi tiết"
                actions={
                    <button 
                        className="btn-primary"
                        style={{ ...button.base, ...button.primary }}
                        onClick={() => setViewReviewBooking(null)}
                    >
                        Đóng
                    </button>
                }
            >
                {viewReviewData ? (
                    <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                        <p><strong>Giảng viên:</strong> {viewReviewData.TutorName}</p>

                        <p>
                            <strong>Số sao:</strong>
                            <span style={{ color: "#ffc107", marginLeft: 6 }}>
                                {"★".repeat(viewReviewData.Rating)}
                                {"☆".repeat(5 - viewReviewData.Rating)}
                            </span>
                        </p>

                        <p><strong>Nội dung:</strong> {viewReviewData.Comment}</p>
                        <p><strong>Ngày gửi:</strong> {new Date(viewReviewData.CreatedAt).toLocaleString()}</p>
                    </div>
                ) : (
                    <p>Đang tải...</p>
                )}
            </BookingModal>
        </div>
    );
};

export default BookingHistory;
