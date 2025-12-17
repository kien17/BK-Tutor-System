import React, { useState } from "react";
import BookingModal from "../BookingModal";

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
            if (!res.ok) throw new Error();
            const data = await res.json();
            setViewReviewData(data);
            setViewReviewBooking(bookingId);
        } catch {
            alert("Lỗi khi tải đánh giá!");
        }
    };
    const StatusBadge = ({ status }) => {
        const map = {
            confirmed: {
                text: "Đã duyệt",
                className: "bg-blue-100 text-blue-700 border-blue-300"
            },
            rescheduled: {
                text: "Đổi lịch",
                className: "bg-orange-100 text-orange-700 border-orange-300"
            },
            pending: {
                text: "Chờ duyệt",
                className: "bg-purple-100 text-purple-700 border-purple-300"
            },
            cancelled: {
                text: "Đã huỷ",
                className: "bg-red-100 text-red-700 border-red-300"
            },
            rejected: {
                text: "Từ chối",
                className: "bg-red-200 text-red-800 border-red-400"
            }
        };

        const badge = map[status] || map.pending;

        return (
            <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${badge.className}`}
            >
                {badge.text}
            </span>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            {/* ================= ACTIVE BOOKINGS ================= */}
            <section className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-green-600 border-b-2 border-green-500 pb-2 mb-5">
                    Buổi tư vấn đã tham gia
                </h3>

                {activeBookings.length === 0 ? (
                    <p className="text-gray-500 italic">Chưa có buổi tư vấn nào.</p>
                ) : (
                    <div className="space-y-4">
                        {activeBookings.map(b => (
                            <div
                                key={b.BookingID}
                                className={`rounded-xl border border-gray-200 shadow-sm p-4 transition hover:shadow-md
                                    ${b.Status === "confirmed"
                                        ? "border-l-4 border-l-blue-500"
                                        : b.Status === "rescheduled"
                                        ? "border-l-4 border-l-orange-400"
                                        : "border-l-4 border-l-purple-500"
                                    }`}
                            >
                                <div className="flex justify-between flex-wrap gap-2">
                                    <div className="font-semibold text-sm">
                                        Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}, Tiết {b.StartPeriod}
                                    </div>

                                    <div className="text-right">
                                        <StatusBadge status={b.Status} />

                                        <div className="mt-2 flex gap-2 justify-end flex-wrap">
                                            {(b.Status === "confirmed" || b.Status === "rescheduled") &&
                                                !reviewedBookings.includes(b.BookingID) && (
                                                    <button
                                                        onClick={() => openReviewModal(b)}
                                                        className="px-3 py-1.5 rounded-lg text-sm font-semibold
                                                                   bg-yellow-300 text-yellow-700 hover:bg-yellow-200 transition"
                                                    >
                                                        Đánh giá
                                                    </button>
                                                )}

                                            {reviewedBookings.includes(b.BookingID) && (
                                                <button
                                                    onClick={() => fetchReview(b.BookingID)}
                                                    className="px-3 py-1.5 rounded-lg text-sm font-semibold
                                                               bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                                                >
                                                    Xem đánh giá
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 text-sm text-gray-600 space-y-1">
                                    <div><strong>Giảng viên:</strong> {b.TutorName}</div>
                                    <div>
                                        <strong>Địa điểm:</strong>{" "}
                                        {b.Location || "Chưa cập nhật"} ({b.MeetingMode})
                                    </div>
                                    <div><strong>Nội dung:</strong> {b.Topic}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ================= HISTORY ================= */}
            <section className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-red-600 border-b-2 border-red-500 pb-2 mb-5">
                    Lịch sử Hủy / Từ chối
                </h3>

                {historyBookings.length === 0 ? (
                    <p className="text-gray-500 italic">Không có lịch sử.</p>
                ) : (
                    <div className="space-y-4">
                        {historyBookings.map(b => (
                            <div
                                key={b.BookingID}
                                className="rounded-xl border border-red-200 bg-red-50 p-4"
                            >
                                <div className="flex justify-between items-center text-sm">
                                    <span className="line-through text-gray-600 font-medium">
                                        Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}
                                    </span>
                                    <span className="font-bold text-red-600">
                                        {b.Status === "cancelled"
                                            ? "Bạn đã hủy"
                                            : "Giảng viên từ chối"}
                                    </span>
                                </div>

                                <div className="mt-2 text-sm text-gray-700">
                                    <strong>Giảng viên:</strong> {b.TutorName}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ================= REVIEW MODAL ================= */}
            <BookingModal
                isOpen={!!viewReviewBooking}
                onClose={() => {
                    setViewReviewBooking(null);
                    setViewReviewData(null);
                }}
                title="Đánh giá chi tiết"
                actions={
                    <button
                        className="btn-primary px-4 py-2 rounded-lg"
                        onClick={() => setViewReviewBooking(null)}
                    >
                        Đóng
                    </button>
                }
            >
                {viewReviewData ? (
                    <div className="text-sm leading-relaxed space-y-2">
                        <p><strong>Giảng viên:</strong> {viewReviewData.TutorName}</p>
                        <p>
                            <strong>Số sao:</strong>{" "}
                            <span className="text-yellow-400 ml-2">
                                {"★".repeat(viewReviewData.Rating)}
                                {"☆".repeat(5 - viewReviewData.Rating)}
                            </span>
                        </p>
                        <p><strong>Nội dung:</strong> {viewReviewData.Comment}</p>
                        <p className="text-gray-500">
                            <strong>Ngày gửi:</strong>{" "}
                            {new Date(viewReviewData.CreatedAt).toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <p>Đang tải...</p>
                )}
            </BookingModal>
        </div>
    );
};

export default BookingHistory;
