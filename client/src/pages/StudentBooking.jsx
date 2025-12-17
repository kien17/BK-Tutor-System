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
    const [tutors, setTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState('');
    const [week, setWeek] = useState(1);

    const [availability, setAvailability] = useState([]);
    const [busySlots, setBusySlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);

    const [activeTab, setActiveTab] = useState('booking');

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [modalType, setModalType] = useState(null); // 'book' | 'info'
    const [form, setForm] = useState({ topic: '', mode: 'Online' });

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [reviewStars, setReviewStars] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewedBookings, setReviewedBookings] = useState([]);

    useEffect(() => {
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
        const bookingsAtSlot = myBookings.filter(b =>
            b.TutorID == selectedTutor &&
            b.WeekNumber == week &&
            b.DayOfWeek == day &&
            period >= b.StartPeriod &&
            period <= b.EndPeriod
        );

        const confirmedBooking = bookingsAtSlot.find(b => b.Status === 'confirmed');
        if (confirmedBooking) return { status: 'mine', label: 'Đã duyệt', color: '#007bff', cursor: 'pointer', data: confirmedBooking };

        const pendingBooking = bookingsAtSlot.find(b => b.Status === 'pending');
        if (pendingBooking) return { status: 'mine', label: 'Chờ duyệt', color: '#6f42c1', cursor: 'not-allowed', data: pendingBooking };

        if (bookingsAtSlot.length > 0 && bookingsAtSlot.every(b => b.Status === 'cancelled' || b.Status === 'rejected'))
            return { status: 'mine', label: 'Đã hủy', color: '#6c757d', cursor: 'not-allowed', data: bookingsAtSlot[0] };

        const isBusy = busySlots.find(b =>
            b.DayOfWeek == day &&
            period >= b.StartPeriod &&
            period <= b.EndPeriod
        );
        if (isBusy) return { status: 'busy', label: 'Đã có lịch', color: '#ffc107', cursor: 'not-allowed' };

        const isOpen = availability.find(a =>
            a.DayOfWeek == day &&
            period >= a.StartPeriod &&
            period <= a.EndPeriod
        );
        if (isOpen) return { status: 'free', label: 'Đăng ký', color: '#28a745', cursor: 'pointer' };

        return { status: 'closed', label: '', color: 'white', cursor: 'default' };
    };

    const handleSlotClick = (day, period, status, bookingData) => {
        if (status === 'free') {
            setSelectedSlot({ day, period });
            setModalType('book');
            setForm({ topic: '', mode: 'Online' });
        } else if (status === 'mine' && bookingData.Status === 'confirmed') {
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
        if (status === 'confirmed') return <span className="text-green-600 font-bold">✅ ĐÃ DUYỆT</span>;
        if (status === 'rescheduled') return <span className="text-orange-500 font-bold">📅 ĐÃ ĐỔI LỊCH</span>;
        return <span className="text-purple-600 font-bold">⏳ ĐANG CHỜ</span>;
    };

    const activeBookings = myBookings.filter(b => b.Status !== 'rejected' && b.Status !== 'cancelled');
    const historyBookings = myBookings.filter(b => b.Status === 'rejected' || b.Status === 'cancelled');

    return (
        <div className="max-w-[1200px] mx-auto p-6 font-sans">
            <h2 className="text-2xl font-bold text-[#004aad] mb-6">📅 Sinh Viên Dashboard</h2>

            {/* Tab */}
            <div className="flex gap-4 border-b mb-6">
                <TabButton isActive={activeTab === 'booking'} onClick={() => setActiveTab('booking')}>📅 Đặt Lịch Tư Vấn</TabButton>
                <TabButton isActive={activeTab === 'history'} onClick={() => setActiveTab('history')}>📜 Lịch Sử Buổi Tư Vấn</TabButton>
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
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="font-semibold mb-1 block">Hình thức:</label>
                        <select
                            value={form.mode}
                            onChange={e => setForm({ ...form, mode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Online">🌐 Online (Google Meet/Zoom)</option>
                            <option value="Offline">🏫 Offline (Tại trường)</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold mb-1 block">Nội dung cần tư vấn:</label>
                        <textarea
                            value={form.topic}
                            onChange={e => setForm({ ...form, topic: e.target.value })}
                            placeholder="VD: Em muốn hỏi về đồ án môn học..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                        />
                    </div>
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
                    <table className="w-full text-sm leading-6">
                        <tbody>
                            <tr>
                                <td className="w-32 text-gray-600">Giảng viên:</td>
                                <td><strong>{selectedSlot.TutorName}</strong></td>
                            </tr>
                            <tr>
                                <td className="text-gray-600">Thời gian:</td>
                                <td>Tuần {selectedSlot.WeekNumber}, Thứ {selectedSlot.DayOfWeek}, Tiết {selectedSlot.StartPeriod}</td>
                            </tr>
                            <tr>
                                <td className="text-gray-600">Hình thức:</td>
                                <td>
                                    <span className={`px-2 py-1 rounded ${selectedSlot.MeetingMode === 'Online' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700'} font-bold`}>
                                        {selectedSlot.MeetingMode}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="text-gray-600">Địa điểm:</td>
                                <td className="text-red-600 font-bold">{selectedSlot.Location || "Đang cập nhật..."}</td>
                            </tr>
                            <tr>
                                <td className="text-gray-600">Nội dung:</td>
                                <td>{selectedSlot.Topic}</td>
                            </tr>
                            <tr>
                                <td className="text-gray-600">Trạng thái:</td>
                                <td>{renderStatusBadge(selectedSlot.Status)}</td>
                            </tr>
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

// Tab Button Component
const TabButton = ({ isActive, children, onClick }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2 font-semibold rounded-t-lg transition-all duration-200 ${isActive ? 'bg-red-100 text-red-600 border-b-4 border-red-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
    >
        {children}
    </button>
);

export default StudentBooking;
