// src/components/student/ReviewModal.jsx
import React from "react";

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

  const starStyle = (active) => ({
    fontSize: 32,
    cursor: "pointer",
    color: active ? "#ffc107" : "#ddd",
    transition: "0.2s"
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Title */}
        <h3 style={{ marginBottom: 10, color: "#004aad" }}>
          ⭐ Đánh giá buổi tư vấn
        </h3>

        {/* Booking Info */}
        <div style={infoBox}>
          <div>
            <strong>Giảng viên:</strong> {booking.TutorName}
          </div>
          <div>
            <strong>Thời gian:</strong> Tuần {booking.WeekNumber}, Thứ {booking.DayOfWeek}, Tiết {booking.StartPeriod}
          </div>
        </div>

        {/* Stars */}
        <div style={{ margin: "15px 0", textAlign: "center" }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              style={starStyle(reviewStars >= s)}
              onClick={() => setReviewStars(s)}
            >
              ★
            </span>
          ))}
        </div>

        {/* Comment box */}
        <textarea
          placeholder="Chia sẻ trải nghiệm của bạn..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          style={textareaStyle}
        />

        {/* Footer buttons */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#f8d7da",
              color: "#b02a37",
              border: "1px solid #dc3545",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              transition: "0.2s",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#f1bfc4";
              e.target.style.borderColor = "#c82333";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#f8d7da";
              e.target.style.borderColor = "#dc3545";
            }}
          >
            Hủy
          </button>


          <button
            onClick={onSubmit}
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;

// --- STYLES ---
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};

const modalStyle = {
  background: "white",
  width: "420px",
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  animation: "fadeIn 0.2s"
};

const infoBox = {
  background: "#f8faff",
  padding: "10px 12px",
  borderRadius: 6,
  fontSize: 14,
  lineHeight: 1.6,
  border: "1px solid #e6eef8"
};

const textareaStyle = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  height: 90,
  borderRadius: 6,
  border: "1px solid #ccc",
  resize: "none",
  background: "#fff"
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 20,
  gap: 10
};
