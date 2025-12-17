import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingGrid from '../components/student/BookingGrid';
import BookingHistory from '../components/student/BookingHistory';
import ReviewModal from '../components/student/ReviewModal';
import BookingModal from '../components/BookingModal';

const StudentBooking = () => {
    const [tutors, setTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState('');
    const [week, setWeek] = useState(1);

    const [availability, setAvailability] = useState([]);
    const [busySlots, setBusySlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [sessions, setSessions] = useState([]);

    const [activeTab, setActiveTab] = useState('booking');

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [modalType, setModalType] = useState(null); // 'book' | 'info' | 'session' | 'session-info'
    const [form, setForm] = useState({ topic: '', mode: 'Online' });

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [reviewStars, setReviewStars] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewedBookings, setReviewedBookings] = useState([]);

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        axios.get('http://localhost:5000/api/users')
            .then(res => setTutors(res.data.filter(u => u.Role === 'tutor')));
        fetchMyBookings();
        fetchMyReviews();
    }, []);

    useEffect(() => {
        if (!selectedTutor) return;

        const token = localStorage.getItem('token');

        // Academic sessions
        axios.get(
            'http://localhost:5000/api/student/academic-sessions',
            { params: { tutorId: selectedTutor, week }, headers: { Authorization: `Bearer ${token}` } }
        ).then(res => setSessions(res.data));

        axios.get(`http://localhost:5000/api/tutor/${selectedTutor}/availability?week=${week}`)
            .then(res => setAvailability(res.data));

        axios.get(`http://localhost:5000/api/tutor/${selectedTutor}/booked-slots?week=${week}`)
            .then(res => setBusySlots(res.data));

    }, [selectedTutor, week, myBookings]);

    const fetchMyBookings = () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        axios.get('http://localhost:5000/api/my-bookings', { headers: { Authorization: token } })
            .then(res => setMyBookings(res.data));
    };

    const fetchMyReviews = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/my-reviews", { headers: { Authorization: token } });
        const data = await res.json();
        setReviewedBookings(data.map(r => r.BookingID));
    };

    /* ================= SLOT LOGIC ================= */
    const getSlotStatus = (day, period) => {
        // 1️⃣ Booking cá nhân
        const bookingsAtSlot = myBookings.filter(b =>
            b.TutorID == selectedTutor &&
            b.WeekNumber == week &&
            b.DayOfWeek == day &&
            period >= b.StartPeriod &&
            period <= b.EndPeriod
        );
        const confirmed = bookingsAtSlot.find(b => b.Status === 'confirmed');
        if (confirmed) return { status: 'mine', label: 'Đã duyệt', color: '#007bff', cursor: 'pointer', data: confirmed };

        const pending = bookingsAtSlot.find(b => b.Status === 'pending');
        if (pending) return { status: 'mine', label: 'Chờ duyệt', color: '#6f42c1', cursor: 'not-allowed', data: pending };

        // 2️⃣ Tư vấn nhóm
        const session = sessions.find(s =>
            s.DayOfWeek == day &&
            period >= s.StartPeriod &&
            period <= s.EndPeriod
        );
        if (session) {
            if (session.IsRegistered) return { status: 'session-registered', label: 'Đã đăng ký', color: '#198754', cursor: 'pointer', data: session };
            if (session.Status === 'open') return { status: 'session-open', label: `Tư vấn nhóm (${session.CurrentStudents}/${session.MaxStudents})`, color: '#0d6efd', cursor: 'pointer', data: session };
            return { status: 'session-full', label: 'Tư vấn nhóm (Đã đủ)', color: '#adb5bd', cursor: 'not-allowed', data: session };
        }

        // 3️⃣ Slot bận
        const isBusy = busySlots.find(b =>
            b.DayOfWeek == day &&
            period >= b.StartPeriod &&
            period <= b.EndPeriod
        );
        if (isBusy) return { status: 'busy', label: 'Đã có lịch', color: '#ffc107', cursor: 'not-allowed' };

        // 4️⃣ Slot mở
        const isOpen = availability.find(a =>
            a.DayOfWeek == day &&
            period >= a.StartPeriod &&
            period <= a.EndPeriod
        );
        if (isOpen) return { status: 'free', label: 'Đăng ký', color: '#28a745', cursor: 'pointer' };

        return { status: 'closed', label: '', color: '#fff', cursor: 'default' };
    };

    /* ================= CLICK SLOT ================= */
    const handleSlotClick = (day, period, status, data) => {
        if (status === 'free') {
            setSelectedSlot({ day, period });
            setModalType('book');
            setForm({ topic: '', mode: 'Online' });
        } else if (status === 'session-open') {
            setSelectedSlot(data);
            setModalType('session');
        } else if (status === 'session-registered') {
            setSelectedSlot(data);
            setModalType('session-info'); // modal chi tiết session đã đăng ký
        } else if (status === 'mine' && data.Status === 'confirmed') {
            setSelectedSlot(data);
            setModalType('info');
        }
    };

    /* ================= ACTIONS ================= */
    const confirmBooking = async () => {
        if (!form.topic) return alert("Vui lòng nhập nội dung!");
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/booking', {
            tutorId: selectedTutor,
            week,
            day: selectedSlot.day,
            startPeriod: selectedSlot.period,
            endPeriod: selectedSlot.period,
            topic: form.topic,
            meetingMode: form.mode
        }, { headers: { Authorization: token } });
        alert("✅ Đăng ký thành công! Vui lòng chờ duyệt.");
        setModalType(null);
        fetchMyBookings();
    };

    const confirmSessionRegister = async () => {
        const token = localStorage.getItem('token');
        await axios.post(
            `http://localhost:5000/api/student/sessions/${selectedSlot.SessionID}/register`,
            {}, { headers: { Authorization: `Bearer ${token}` } }
        );
        setSessions(prev => prev.map(s => s.SessionID === selectedSlot.SessionID ? { ...s, IsRegistered: 1 } : s));
        alert("✅ Đăng ký tư vấn nhóm thành công!");
        setModalType(null);
    };

    const openReviewModal = (booking) => {
        setSelectedBooking(booking);
        setReviewStars(5);
        setReviewText('');
    };

    const submitReview = async () => {
        if (!selectedBooking) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({ bookingId: selectedBooking.BookingID, rating: reviewStars, comment: reviewText })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message || "Lỗi gửi đánh giá!"); setIsSubmitting(false); return; }
            alert("Đánh giá thành công!");
            setReviewedBookings(prev => [...prev, selectedBooking.BookingID]);
            setSelectedBooking(null);
        } catch (err) {
            alert("Lỗi kết nối server!");
        } finally { setIsSubmitting(false); }
    };

    const renderStatusBadge = (status) => {
        if (status === 'confirmed') return <span className="text-green-600 font-bold">✅ ĐÃ DUYỆT</span>;
        if (status === 'rescheduled') return <span className="text-orange-500 font-bold">📅 ĐÃ ĐỔI LỊCH</span>;
        return <span className="text-purple-600 font-bold">⏳ ĐANG CHỜ</span>;
    };

    const activeBookings = myBookings.filter(b => !['rejected', 'cancelled'].includes(b.Status));
    const historyBookings = myBookings.filter(b => ['rejected', 'cancelled'].includes(b.Status));

    return (
        <div className="max-w-[1200px] mx-auto p-6 font-sans">
            <h2 className="text-2xl font-bold text-[#004aad] mb-6">📅 Sinh Viên Dashboard</h2>

            <div className="flex gap-2 border-b mb-6">
                <TabButton active={activeTab==='booking'} onClick={()=>setActiveTab('booking')}>
                    📅 Đặt Lịch
                </TabButton>
                <TabButton active={activeTab==='history'} onClick={()=>setActiveTab('history')}>
                    📜 Lịch Sử
                </TabButton>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
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

            </div>
            
            {/* Modal Đặt lịch */}
            <BookingModal
                isOpen={modalType === 'book'}
                onClose={() => setModalType(null)}
                title={`📅 Đặt lịch Thứ ${selectedSlot?.day} - Tiết ${selectedSlot?.period}`}
                actions={
                    <>
                        <button onClick={() => setModalType(null)} className="btn-secondary">Hủy</button>
                        <button onClick={confirmBooking} className="btn-primary">Xác nhận</button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="font-semibold mb-1 block">Hình thức:</label>
                        <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                            <option value="Online">🌐 Online</option>
                            <option value="Offline">🏫 Offline</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold mb-1 block">Nội dung tư vấn:</label>
                        <textarea value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="w-full px-3 py-2 border rounded-lg h-20 resize-none" placeholder="VD: Em muốn hỏi về đồ án..."/>
                    </div>
                </div>
            </BookingModal>

            {/* Modal Tư vấn nhóm */}
            <BookingModal
                isOpen={modalType === 'session'}
                onClose={() => setModalType(null)}
                title="👥 Đăng ký tư vấn nhóm"
                actions={
                    <>
                        <button onClick={() => setModalType(null)} className="btn-secondary">Hủy</button>
                        <button onClick={confirmSessionRegister} className="btn-primary">Đăng ký</button>
                    </>
                }
            >
                {selectedSlot && (
                    <div className="text-sm space-y-2">
                        <p><b>Chủ đề:</b> {selectedSlot.Topic}</p>
                        <p><b>Thời gian:</b> Tuần {selectedSlot.WeekNumber} – Thứ {selectedSlot.DayOfWeek} – Tiết {selectedSlot.StartPeriod}</p>
                        <p><b>Số lượng:</b> {selectedSlot.CurrentStudents}/{selectedSlot.MaxStudents}</p>
                        <p><b>Hình thức:</b> {selectedSlot.MeetingMode}</p>
                    </div>
                )}
            </BookingModal>

            {/* Modal Chi tiết session đã đăng ký */}
            <BookingModal
                isOpen={modalType === 'session-info'}
                onClose={() => setModalType(null)}
                title="👥 Chi tiết tư vấn nhóm đã đăng ký"
                actions={<button onClick={() => setModalType(null)} className="btn-primary">Đóng</button>}
            >
                {selectedSlot && (
                    <div className="text-sm space-y-2">
                        <p><b>Chủ đề:</b> {selectedSlot.Topic}</p>
                        <p><b>Thời gian:</b> Tuần {selectedSlot.WeekNumber} – Thứ {selectedSlot.DayOfWeek} – Tiết {selectedSlot.StartPeriod}</p>
                        <p><b>Hình thức:</b> {selectedSlot.MeetingMode}</p>
                        <p><b>Số lượng:</b> {selectedSlot.CurrentStudents}/{selectedSlot.MaxStudents}</p>
                        {selectedSlot.RegisteredStudents?.length > 0 && (
                            <div>
                                <b>Danh sách sinh viên:</b>
                                <ul className="list-disc list-inside">
                                    {selectedSlot.RegisteredStudents.map(s => (
                                        <li key={s.StudentID}>{s.StudentName}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="text-green-600 font-bold">✅ Bạn đã đăng ký</p>
                    </div>
                )}
            </BookingModal>

            {/* Modal Xem chi tiết */}
            <BookingModal
                isOpen={modalType === 'info'}
                onClose={() => setModalType(null)}
                title="📄 Chi tiết Lịch hẹn"
                actions={<button onClick={() => setModalType(null)} className="btn-primary">Đóng</button>}
            >
                {selectedSlot && (
                    <table className="w-full text-sm">
                        <tbody>
                            <tr><td className="text-gray-600 w-32">Giảng viên:</td><td><strong>{selectedSlot.TutorName}</strong></td></tr>
                            <tr><td className="text-gray-600">Thời gian:</td><td>Tuần {selectedSlot.WeekNumber}, Thứ {selectedSlot.DayOfWeek}, Tiết {selectedSlot.StartPeriod}</td></tr>
                            <tr><td className="text-gray-600">Hình thức:</td><td><span className={`px-2 py-1 rounded ${selectedSlot.MeetingMode==='Online'?'bg-blue-100 text-blue-600':'bg-green-100 text-green-700'} font-bold`}>{selectedSlot.MeetingMode}</span></td></tr>
                            <tr><td className="text-gray-600">Địa điểm:</td><td className="text-red-600 font-bold">{selectedSlot.Location || "Đang cập nhật..."}</td></tr>
                            <tr><td className="text-gray-600">Nội dung:</td><td>{selectedSlot.Topic}</td></tr>
                            <tr><td className="text-gray-600">Trạng thái:</td><td>{renderStatusBadge(selectedSlot.Status)}</td></tr>
                        </tbody>
                    </table>
                )}
            </BookingModal>

            {/* Modal Review */}
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

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-bold rounded-t-lg
            ${active
                ? 'bg-blue-100 text-blue-900 border-b-4 border-blue-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
    >
        {children}
    </button>
);

export default StudentBooking;
