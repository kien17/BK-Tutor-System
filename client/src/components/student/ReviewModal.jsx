// src/components/student/ReviewModal.jsx
import React from "react";
import BookingModal from "../BookingModal";

const ReviewModal = ({
    isOpen,
    onClose,
    booking,
    reviewStars,
    setReviewStars,
    reviewText,
    setReviewText,
    onSubmit,
    isSubmitting
}) => {
    if (!isOpen || !booking) return null;

    return (
        <BookingModal
            isOpen={isOpen}
            onClose={onClose}
            title="Đánh giá buổi tư vấn"
            actions={
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-red-100 text-red-700 border border-red-400 rounded-lg font-semibold hover:bg-red-200 transition"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-lg font-semibold transition shadow-sm
                            ${
                                isSubmitting
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-100 text-blue-700 border border-blue-400 hover:bg-blue-200 hover:shadow-md"
                            }
                        `}
                    >
                        {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Booking info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
                    <div>
                        <span className="font-semibold">Giảng viên:</span>{" "}
                        {booking.TutorName}
                    </div>
                    <div>
                        <span className="font-semibold">Thời gian:</span>{" "}
                        Tuần {booking.WeekNumber} • Thứ {booking.DayOfWeek} • Tiết{" "}
                        {booking.StartPeriod}
                    </div>
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-2 text-3xl">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            onClick={() => setReviewStars(s)}
                            className={`transition transform hover:scale-110 ${
                                reviewStars >= s
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                            }`}
                            aria-label={`Rate ${s} stars`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                {/* Review text */}
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-gray-700">
                        Nhận xét của bạn
                    </label>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về buổi tư vấn..."
                        className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </BookingModal>
    );
};

export default ReviewModal;
