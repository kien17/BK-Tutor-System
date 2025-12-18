import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BookingGrid from '../components/student/BookingGrid';
import BookingHistory from '../components/student/BookingHistory';
import ReviewModal from '../components/student/ReviewModal';
import BookingModal from '../components/BookingModal';

// ==================== Custom Hook cho Data ====================
const useStudentBookingData = (selectedTutor, week) => {
  const [tutors, setTutors] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [reviewedBookings, setReviewedBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [busySlots, setBusySlots] = useState([]);
  const [sessions, setSessions] = useState([]);

  const token = localStorage.getItem('token');

  // Fetch tutors + initial data
  useEffect(() => {
    axios.get('http://localhost:5000/api/users')
      .then(res => setTutors(res.data.filter(u => u.Role === 'tutor')));

    if (token) {
      axios.get('http://localhost:5000/api/my-bookings', {
        headers: { Authorization: token }
      }).then(res => setMyBookings(res.data));

      fetch("http://localhost:5000/api/my-reviews", {
        headers: { Authorization: token }
      })
        .then(res => res.json())
        .then(data => setReviewedBookings(data.map(r => r.BookingID)));
    }
  }, [token]);

  // Fetch tutor-specific data
  useEffect(() => {
    if (!selectedTutor || !token) {
      setAvailability([]);
      setBusySlots([]);
      setSessions([]);
      return;
    }

    // Academic sessions
    axios.get('http://localhost:5000/api/student/academic-sessions', {
      params: { tutorId: selectedTutor, week },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSessions(res.data));

    // Availability & busy slots
    axios.get(`http://localhost:5000/api/tutor/${selectedTutor}/availability?week=${week}`)
      .then(res => setAvailability(res.data));

    axios.get(`http://localhost:5000/api/tutor/${selectedTutor}/booked-slots?week=${week}`)
      .then(res => setBusySlots(res.data));
  }, [selectedTutor, week, token]);

  const refetchMyBookings = useCallback(() => {
    if (!token) return;
    axios.get('http://localhost:5000/api/my-bookings', {
      headers: { Authorization: token }
    }).then(res => setMyBookings(res.data));
  }, [token]);

  return {
    tutors,
    myBookings,
    reviewedBookings,
    setReviewedBookings,
    availability,
    busySlots,
    sessions,
    setSessions,
    refetchMyBookings,
  };
};

// ==================== Badge Components ====================
const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: { text: "Đã duyệt", class: "bg-blue-100 text-blue-700 border-blue-300" },
    rescheduled: { text: "Đổi lịch", class: "bg-orange-100 text-orange-700 border-orange-300" },
    pending: { text: "Chờ duyệt", class: "bg-purple-100 text-purple-700 border-purple-300" },
    cancelled: { text: "Đã huỷ", class: "bg-red-100 text-red-700 border-red-300" },
    rejected: { text: "Từ chối", class: "bg-red-200 text-red-800 border-red-400" },
  };

  const { text, class: cls } = styles[status] || styles.pending;

  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${cls}`}>
      {text}
    </span>
  );
};

// ==================== Main Component ====================
const StudentBooking = () => {
  const [selectedTutor, setSelectedTutor] = useState('');
  const [week, setWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('booking');

  const {
    tutors,
    myBookings,
    reviewedBookings,
    setReviewedBookings,
    availability,
    busySlots,
    sessions,
    setSessions,
    refetchMyBookings,
  } = useStudentBookingData(selectedTutor, week);

  const [modalType, setModalType] = useState(null); // 'book' | 'session' | 'session-info' | 'info'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ topic: '', mode: 'Online' });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= SLOT STATUS LOGIC ================= */
  const getSlotStatus = (day, period) => {
    // 1. My personal bookings
    const bookingsAtSlot = myBookings.filter(b =>
        b.TutorID == selectedTutor &&
        b.WeekNumber == week &&
        b.DayOfWeek == day &&
        period >= b.StartPeriod &&
        period <= b.EndPeriod
    );

    const mine = bookingsAtSlot.find(b => b.Status === 'confirmed' || b.Status === 'rescheduled');
    if (mine) {
        return {
            status: 'mine',
            label: mine.Status === 'rescheduled' ? 'Đã đổi lịch' : 'Đã duyệt',
            color: '#007bff',
            cursor: 'pointer',
            data: mine
        };
    }

    const pending = bookingsAtSlot.find(b => b.Status === 'pending');
    if (pending) {
        return {
            status: 'mine',
            label: 'Chờ duyệt',
            color: '#6f42c1',
            cursor: 'pointer',
            data: pending
        };
    }

    // 2. Group sessions
    const session = sessions.find(s =>
        s.DayOfWeek == day &&
        period >= s.StartPeriod &&
        period <= s.EndPeriod
    );

    if (session) {
      if (session.IsRegistered) {
        return { status: 'session-registered', label: 'Đã đăng ký', color: '#0d6efd', cursor: 'pointer', data: session };
      }
      if (session.Status === 'open') {
        return {
            status: 'session-open',
            label: `Tư vấn nhóm (${session.CurrentStudents}/${session.MaxStudents})`,
            color: '#0d6efd',
            cursor: 'pointer',
            data: session
        };
      }
      return { status: 'session-full', label: 'Tư vấn nhóm (Đã đủ)', color: '#adb5bd', cursor: 'not-allowed', data: session };
    }

    // 3. Busy slots
    const isBusy = busySlots.some(b =>
        b.DayOfWeek == day &&
        period >= b.StartPeriod &&
        period <= b.EndPeriod
    );
    if (isBusy) {
        return { status: 'busy', label: 'Đã có lịch', color: '#ffc107', cursor: 'not-allowed' };
    }

    // 4. Available slots
    const isOpen = availability.some(a =>
        a.DayOfWeek == day &&
        period >= a.StartPeriod &&
        period <= a.EndPeriod
    );
    if (isOpen) {
        return { status: 'free', label: 'Đăng ký', color: '#28a745', cursor: 'pointer' };
    }

        return { status: 'closed', label: '', color: '#fff', cursor: 'default' };
    };

    /* ================= HANDLE SLOT CLICK ================= */
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
            setModalType('session-info');

        } else if (status === 'mine') {
            // Cho phép xem chi tiết cả pending, confirmed và rescheduled
            setSelectedSlot(data);
            setModalType('info');
        }
    };
    /* ================= ACTIONS ================= */
    const confirmBooking = async () => {
        if (!form.topic.trim()) return alert("Vui lòng nhập nội dung!");
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

        alert("✅ Đăng ký thành công! Vui lòng chờ duyệt.");
        setModalType(null);
        refetchMyBookings();
        } catch (err) {
        alert("Lỗi khi đặt lịch!");
        }
    };

    const confirmSessionRegister = async () => {
        const token = localStorage.getItem('token');
        try {
        await axios.post(
            `http://localhost:5000/api/student/sessions/${selectedSlot.SessionID}/register`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setSessions(prev => prev.map(s =>
            s.SessionID === selectedSlot.SessionID ? { ...s, IsRegistered: 1 } : s
        ));
        alert("✅ Đăng ký tư vấn nhóm thành công!");
        setModalType(null);
        } catch (err) {
        alert("Lỗi khi đăng ký!");
        }
    };

    const openReviewModal = (booking) => {
        setSelectedBooking(booking);
        setReviewStars(5);
        setReviewText('');
    };

    const submitReview = async () => {
        if (!selectedBooking) return;
        setIsSubmitting(true);
        const token = localStorage.getItem("token");
        try {
        const res = await fetch("http://localhost:5000/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: token },
            body: JSON.stringify({
            bookingId: selectedBooking.BookingID,
            rating: reviewStars,
            comment: reviewText
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi");

        alert("Đánh giá thành công!");
        setReviewedBookings(prev => [...prev, selectedBooking.BookingID]);
        setSelectedBooking(null);
        } catch (err) {
        alert(err.message || "Lỗi gửi đánh giá!");
        } finally {
        setIsSubmitting(false);
        }
    };

  const activeBookings = myBookings.filter(b => !['rejected', 'cancelled'].includes(b.Status));
  const historyBookings = myBookings.filter(b => ['rejected', 'cancelled'].includes(b.Status));

  return (
    <div className="max-w-[1200px] mx-auto p-6 font-sans">
        <h2 className="text-2xl font-bold text-[#004aad] mb-6">📅 Sinh Viên Dashboard</h2>

        <div className="flex gap-2 border-b mb-6">
            <TabButton active={activeTab === 'booking'} onClick={() => setActiveTab('booking')}>
            📅 Đặt Lịch
            </TabButton>
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
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
                renderStatusBadge={(status) => <StatusBadge status={status} />}
            />
            )}
        </div>

        {/* Modal Đặt lịch cá nhân */}
        <BookingModal
            isOpen={modalType === 'book'}
            onClose={() => setModalType(null)}
            title={`📅 Đặt lịch Thứ ${selectedSlot?.day} - Tiết ${selectedSlot?.period}`}
            actions={
            <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={() => setModalType(null)} className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-semibold">
                Hủy
                </button>
                <button onClick={confirmBooking} className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg font-semibold">
                Xác nhận
                </button>
            </div>
            }
        >
            <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-semibold">Hình thức:</label>
                <select
                value={form.mode}
                onChange={e => setForm(prev => ({ ...prev, mode: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-gray-700"
                >
                <option value="Online">🌐 Online</option>
                <option value="Offline">🏫 Offline</option>
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-semibold">Nội dung tư vấn:</label>
                <textarea
                value={form.topic}
                onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-gray-700 h-20 resize-none"
                placeholder="VD: Em muốn hỏi về đồ án..."
                />
            </div>
            </div>
        </BookingModal>

        {/* Modal Đăng ký tư vấn nhóm */}
        <BookingModal
            isOpen={modalType === 'session'}
            onClose={() => setModalType(null)}
            title="👥 Đăng ký tư vấn nhóm"
            actions={
            <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={() => setModalType(null)} className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-semibold">
                Hủy
                </button>
                <button onClick={confirmSessionRegister} className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg font-semibold">
                Đăng ký
                </button>
            </div>
            }
        >
            {selectedSlot && (
            <div className="flex flex-col gap-4 text-gray-700">
                <div><span className="font-semibold">Chủ đề:</span> {selectedSlot.Topic}</div>
                <div><span className="font-semibold">Thời gian:</span> Tuần {selectedSlot.WeekNumber} • Thứ {selectedSlot.DayOfWeek} • Tiết {selectedSlot.StartPeriod}</div>
                <div><span className="font-semibold">Số lượng:</span> {selectedSlot.CurrentStudents}/{selectedSlot.MaxStudents}</div>
                <div><span className="font-semibold">Hình thức:</span> {selectedSlot.MeetingMode}</div>
            </div>
            )}
        </BookingModal>

        {/* Modal Chi tiết tư vấn nhóm đã đăng ký */}
        <BookingModal
            isOpen={modalType === 'session-info'}
            onClose={() => setModalType(null)}
            title="Chi tiết tư vấn nhóm đã đăng ký"
            actions={
            <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg font-semibold"
            >
                Đóng
            </button>
            }
        >
            {selectedSlot && (
            <div className="flex flex-col gap-4 text-gray-700">
                <div>
                <span className="font-semibold">Chủ đề:</span> {selectedSlot.Topic}
                </div>
                <div>
                <span className="font-semibold">Thời gian:</span>{" "}
                Tuần {selectedSlot.WeekNumber} • Thứ {selectedSlot.DayOfWeek} • Tiết {selectedSlot.StartPeriod}
                </div>
                <div>
                <span className="font-semibold">Hình thức:</span> {selectedSlot.MeetingMode}
                </div>
                <div>
                <span className="font-semibold">Số lượng:</span>{" "}
                {selectedSlot.CurrentStudents}/{selectedSlot.MaxStudents}
                </div>

                {selectedSlot.RegisteredStudents?.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="font-semibold">Danh sách sinh viên đã đăng ký:</div>
                    <ul className="list-disc list-inside ml-4 text-sm">
                    {selectedSlot.RegisteredStudents.map(s => (
                        <li key={s.StudentID}>{s.StudentName}</li>
                    ))}
                    </ul>
                </div>
                )}

                {/* Badge "Đã đăng ký" thay cho text cũ */}
                <div>
                <span className="font-semibold">Trạng thái:</span>{" "}
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full border bg-green-100 text-green-800 border-green-300">
                    Đã đăng ký
                </span>
                </div>
            </div>
            )}
        </BookingModal>

      {/* Modal Chi tiết lịch cá nhân */}
      <BookingModal
        isOpen={modalType === 'info'}
        onClose={() => setModalType(null)}
        title="Chi tiết Lịch hẹn"
        actions={
          <button onClick={() => setModalType(null)} className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg font-semibold">
            Đóng
          </button>
        }
      >
        {selectedSlot && (
          <div className="flex flex-col gap-4 text-gray-700">
            <div><span className="font-semibold">Giảng viên:</span> {selectedSlot.TutorName}</div>
            <div><span className="font-semibold">Thời gian:</span> Tuần {selectedSlot.WeekNumber} • Thứ {selectedSlot.DayOfWeek} • Tiết {selectedSlot.StartPeriod}</div>
            <div><span className="font-semibold">Hình thức:</span> {selectedSlot.MeetingMode}</div>
            <div><span className="font-semibold">Địa điểm:</span> {selectedSlot.Location || "Đang cập nhật..."}</div>
            <div className="break-words"><span className="font-semibold">Nội dung:</span> {selectedSlot.Topic}</div>
            <div><span className="font-semibold">Trạng thái:</span> <StatusBadge status={selectedSlot.Status} /></div>
          </div>
        )}
      </BookingModal>

      {/* Review Modal */}
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
    className={`px-4 py-2 font-bold rounded-t-lg ${
      active
        ? 'bg-blue-100 text-blue-900 border-b-4 border-blue-900'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

export default StudentBooking;