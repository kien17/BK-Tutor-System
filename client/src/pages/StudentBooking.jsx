// src/pages/StudentBooking.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingGrid from '../components/student/BookingGrid';
import BookingHistory from '../components/student/BookingHistory';
import ReviewModal from '../components/student/ReviewModal';
import BookingModal from '../components/BookingModal';

const PERIODS = Array.from({ length: 17 }, (_, i) => i + 1);
const DAYS = [2, 3, 4, 5, 6, 7, 8];

const StudentBooking = () => {
    // --- STATES ---
    

    const [tutors, setTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState('');
    const [week, setWeek] = useState(1);

    const [availability, setAvailability] = useState([]);
    const [busySlots, setBusySlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);

    const [activeTab, setActiveTab] = useState('booking');

    // --- Modal đặt lịch ---
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [modalType, setModalType] = useState(null); // 'book' | 'info'
    const [form, setForm] = useState({ topic: '', mode: 'Online' });

    // --- Modal đánh giá ---
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [reviewStars, setReviewStars] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewedBookings, setReviewedBookings] = useState([]);

    // --- EFFECTS ---
    useEffect(() => {
        // Lấy danh sách giảng viên
        axios.get('http://localhost:5000/api/users')
        .then(res => setTutors(res.data.filter(u => u.Role === 'tutor')));

        fetchMyBookings();
        fetchMyReviews();
    }, []);

    useEffect(() => {
        if (selectedTutor) {
        axios.get(`http://localhost:5000/api/tutor/${selectedTutor}/availability?week=${week}`)
            .then(res => setAvailability(res.data));

        axios.get(`http://localhost:5000/api/tutor/${selectedTutor}/booked-slots?week=${week}`)
            .then(res => setBusySlots(res.data));
        }
    }, [selectedTutor, week, myBookings]);

    // --- FETCH FUNCTIONS ---
    const fetchMyBookings = () => {
        const token = localStorage.getItem('token');
        if (token) {
        axios.get('http://localhost:5000/api/my-bookings', { headers: { Authorization: token } })
            .then(res => setMyBookings(res.data));
        }
    };

    const fetchMyReviews = async () => {
        try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/my-reviews", {
            headers: { "Authorization": token }
        });
        const data = await res.json();
        setReviewedBookings(data.map(r => r.BookingID));
        } catch (err) {
        console.error(err);
        }
    };

    

    // --- SLOT LOGIC ---
    const getSlotStatus = (day, period) => {
        // 1. Kiểm tra slot CỦA MÌNH trước (dùng == để tự động ép kiểu)
        const isMine = myBookings.find(b =>
            b.TutorID == selectedTutor &&           // ← sửa === → ==
            b.WeekNumber == week &&                 // ← sửa === → ==
            b.DayOfWeek == day &&
            period >= b.StartPeriod &&
            period <= b.EndPeriod &&
            b.Status !== 'rejected' &&
            b.Status !== 'cancelled'
        );

        if (isMine) {
            let color = '#6f42c1';      // pending
            let label = 'Chờ duyệt';

            if (isMine.Status === 'confirmed') {
                color = '#007bff';
                label = 'Đã duyệt';
            } else if (isMine.Status === 'rescheduled') {
                color = '#fd7e14';
                label = 'Đã đổi';
            }

            return { status: 'mine', label, color, cursor: 'pointer', data: isMine };
        }

        // 2. Slot của NGƯỜI KHÁC (busySlots đã được backend trả về chỉ chứa booking của người khác)
        const isBusy = busySlots.find(b =>
            b.DayOfWeek == day &&
            period >= b.StartPeriod &&
            period <= b.EndPeriod
        );
        if (isBusy) return { status: 'busy', label: 'Đã có lịch', color: '#ffc107', cursor: 'not-allowed' };

        // 3. Slot MỞ (rảnh)
        const isOpen = availability.find(a =>
            a.DayOfWeek == day &&
            period >= a.StartPeriod &&
            period <= a.EndPeriod
        );
        if (isOpen) return { status: 'free', label: 'Đăng ký', color: '#28a745', cursor: 'pointer' };

        // 4. Đóng
        return { status: 'closed', label: '', color: 'white', cursor: 'default' };
    };

    const handleSlotClick = (day, period, status, bookingData) => {
        if (status === 'free') {
        setSelectedSlot({ day, period });
        setModalType('book');
        setForm({ topic: '', mode: 'Online' });
        } else if (status === 'mine') {
        setSelectedSlot(bookingData);
        setModalType('info');
        }
    };

    const confirmBooking = async () => {
        if (!form.topic) return alert("Vui lòng nhập nội dung!");
        const token = localStorage.getItem('token');
        try {
        await axios.post('http://localhost:5000/api/booking', {
            tutorId: selectedTutor,
            week,
            day: selectedSlot.day,
            startPeriod: selectedSlot.period,
            endPeriod: selectedSlot.period,
            topic: form.topic,
            meetingMode: form.mode
        }, { headers: { Authorization: token } });
        alert("✅ Đăng ký thành công! Vui lòng chờ giảng viên duyệt.");
        setModalType(null);
        fetchMyBookings();
        } catch (err) {
        alert(err.response?.data?.message || "Lỗi đăng ký");
        }
    };

    // --- REVIEW LOGIC ---
    const openReviewModal = (booking) => {
        setSelectedBooking(booking);
        setReviewText("");
        setReviewStars(5);
    };

    const submitReview = async () => {
        if (!selectedBooking) return;
        setIsSubmitting(true);
        try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/reviews", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "Authorization": token
            },
            body: JSON.stringify({
            bookingId: selectedBooking.BookingID,
            rating: reviewStars,
            comment: reviewText
            })
        });
        const data = await res.json();
        if (!res.ok) { alert(data.message || "Lỗi gửi đánh giá!"); setIsSubmitting(false); return; }
        alert("Đánh giá thành công!");
        setReviewedBookings(prev => [...prev, selectedBooking.BookingID]);
        setSelectedBooking(null);
        } catch (err) {
        console.error(err);
        alert("Lỗi kết nối server!");
        } finally {
        setIsSubmitting(false);
        }
    };

    const renderStatusBadge = (status) => {
        if (status === 'confirmed') return <span style={{ color: 'green', fontWeight: 'bold' }}>✅ ĐÃ DUYỆT</span>;
        if (status === 'rescheduled') return <span style={{ color: '#fd7e14', fontWeight: 'bold' }}>📅 ĐÃ ĐỔI LỊCH</span>;
        return <span style={{ color: '#6f42c1', fontWeight: 'bold' }}>⏳ ĐANG CHỜ</span>;
    };

    const activeBookings = myBookings.filter(b => b.Status !== 'rejected' && b.Status !== 'cancelled');
    const historyBookings = myBookings.filter(b => b.Status === 'rejected' || b.Status === 'cancelled');

    return (
        <div className="dashboard-container">
        <h2 style={{ color: '#004aad' }}>📅 Sinh Viên Dashboard</h2>

        {/* Tab */}
        <div style={{ marginBottom: 20, borderBottom: '1px solid #ddd', display: 'flex', gap: 10 }}>
            <button onClick={() => setActiveTab('booking')} style={getTabStyle(activeTab === 'booking')}>📅 Đặt Lịch Tư Vấn</button>
            <button onClick={() => setActiveTab('history')} style={getTabStyle(activeTab === 'history')}>📜 Lịch Sử Vé</button>
        </div>

        {activeTab === 'booking' && (
            <BookingGrid
            tutors={tutors}
            selectedTutor={selectedTutor}
            setSelectedTutor={setSelectedTutor}
            week={week}
            setWeek={setWeek}
            getSlotStatus={getSlotStatus}
            handleSlotClick={handleSlotClick}
            />
        )}

        {activeTab === 'history' && (
            <BookingHistory
            activeBookings={activeBookings}
            historyBookings={historyBookings}
            reviewedBookings={reviewedBookings}
            openReviewModal={openReviewModal}
            renderStatusBadge={renderStatusBadge}
            />
        )}

        {/* Modal Đặt lịch */}
        <BookingModal
            isOpen={modalType === 'book'}
            onClose={() => setModalType(null)}
            title={`📅 Đặt lịch Thứ ${selectedSlot?.day} - Tiết ${selectedSlot?.period}`}
            actions={
            <>
                <button onClick={() => setModalType(null)} className="btn-secondary">Hủy</button>
                <button onClick={confirmBooking} className="btn-primary">Xác nhận Đặt</button>
            </>
            }
        >
            <div className="form-group">
            <label>Hình thức:</label>
            <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} style={{ width: '100%', padding: 8 }}>
                <option value="Online">🌐 Online (Google Meet/Zoom)</option>
                <option value="Offline">🏫 Offline (Tại trường)</option>
            </select>
            </div>
            <div className="form-group">
            <label>Nội dung cần tư vấn:</label>
            <textarea
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                placeholder="VD: Em muốn hỏi về đồ án môn học..."
                style={{ width: '100%', padding: 8, height: 80 }}
            />
            </div>
        </BookingModal>

        {/* Modal Xem chi tiết */}
        <BookingModal
            isOpen={modalType === 'info'}
            onClose={() => setModalType(null)}
            title="📄 Chi tiết Lịch hẹn"
            actions={<button onClick={() => setModalType(null)} className="btn-primary">Đóng</button>}
        >
            {selectedSlot && (
            <table style={{ width: '100%', lineHeight: '1.8' }}>
                <tbody>
                <tr><td style={{ width: '100px', color: '#666' }}>Giảng viên:</td><td><strong>{selectedSlot.TutorName}</strong></td></tr>
                <tr><td style={{ color: '#666' }}>Thời gian:</td><td>Tuần {selectedSlot.WeekNumber}, Thứ {selectedSlot.DayOfWeek}, Tiết {selectedSlot.StartPeriod}</td></tr>
                <tr><td style={{ color: '#666' }}>Hình thức:</td><td><span style={{ background: selectedSlot.MeetingMode === 'Online' ? '#e7f1ff' : '#d4edda', padding: '2px 8px', borderRadius: 4, color: selectedSlot.MeetingMode === 'Online' ? '#007bff' : '#155724', fontWeight: 'bold' }}>{selectedSlot.MeetingMode}</span></td></tr>
                <tr><td style={{ color: '#666' }}>Địa điểm:</td><td style={{ color: '#dc3545', fontWeight: 'bold' }}>{selectedSlot.Location || "Đang cập nhật..."}</td></tr>
                <tr><td style={{ color: '#666' }}>Nội dung:</td><td>{selectedSlot.Topic}</td></tr>
                <tr><td style={{ color: '#666' }}>Trạng thái:</td><td>{renderStatusBadge(selectedSlot.Status)}</td></tr>
                </tbody>
            </table>
            )}
        </BookingModal>

        {/* Modal Đánh giá */}
        <ReviewModal
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            booking={selectedBooking}
            reviewStars={reviewStars}
            setReviewStars={setReviewStars}
            reviewText={reviewText}
            setReviewText={setReviewText}
            onSubmit={submitReview}
            isSubmitting={isSubmitting}
        />
        </div>
    );
};

const getTabStyle = (isActive) => ({
  padding: '10px 20px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  background: isActive ? '#eee' : 'white',
  borderBottom: isActive ? '3px solid #004aad' : 'none',
  color: isActive ? '#004aad' : '#333'
});

export default StudentBooking;
