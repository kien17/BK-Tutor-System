import { useState, useEffect } from 'react';
import axios from 'axios';

import BookingModal from '../components/BookingModal';
import CreateInterviewTab from '../components/tutor/CreateInterviewTab';
import ScheduleGridTab from '../components/tutor/ScheduleGridTab';
import BookingRequestsTab from '../components/tutor/BookingRequestsTab';
import ReviewTab from '../components/tutor/ReviewTab';
import AcademicSessionModal from '../components/tutor/AcademicSessionModal';
import RescheduleModal from '../components/tutor/RescheduleModal';

const TutorDashboard = () => {
    const [week, setWeek] = useState(1);
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('grid');

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [locationInput, setLocationInput] = useState('');

    const [selectedSession, setSelectedSession] = useState(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

    // 🔄 RESCHEDULE
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [rescheduleBooking, setRescheduleBooking] = useState(null);

    const [interviewForm, setInterviewForm] = useState({
        week: 1,
        day: 2,
        startPeriod: 1,
        topic: 'Tư vấn nhóm',
        location: 'Google Meet',
        meetingMode: 'Online',
        maxStudents: 5
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tutorId = user.id;

    useEffect(() => {
        fetchData();
    }, [week]);

    // ================= FETCH DATA =================
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token || !user?.id) return;

        try {
            const resAvail = await axios.get(
                `http://localhost:5000/api/tutor/${user.id}/availability?week=${week}`
            );
            setAvailability(resAvail.data);

            const resBook = await axios.get(
                'http://localhost:5000/api/my-bookings',
                { headers: { Authorization: token } }
            );
            setBookings(
                resBook.data.filter(
                    b => b.WeekNumber == week && !['cancelled'].includes(b.Status)
                )
            );

            const resSessions = await axios.get(
                `http://localhost:5000/api/tutor/academic-sessions?week=${week}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSessions(resSessions.data);

        } catch (err) {
            console.error(err);
        }
    };

    // ================= MODALS =================
    const openBookingModal = (booking) => {
        setSelectedBooking(booking);
        setLocationInput(booking.Location || '');
        setIsModalOpen(true);
    };

    const openSessionModal = (session) => {
        setSelectedSession(session);
        setIsSessionModalOpen(true);
    };

    // ================= AVAILABILITY =================
    const toggleAvailability = async (day, period) => {
        const token = localStorage.getItem('token');
        const isFree = availability.find(
            a => a.DayOfWeek === day && period >= a.StartPeriod && period <= a.EndPeriod
        );

        try {
            if (isFree) {
                await axios.delete(
                    'http://localhost:5000/api/tutor/availability',
                    {
                        headers: { Authorization: token },
                        data: { week, day, startPeriod: period, endPeriod: period }
                    }
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/tutor/availability',
                    { week, day, startPeriod: period, endPeriod: period },
                    { headers: { Authorization: token } }
                );
            }
            fetchData();
        } catch {
            alert("Lỗi cập nhật lịch");
        }
    };

    // ================= BOOKING ACTIONS =================
    const updateLocation = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(
                `http://localhost:5000/api/booking/${selectedBooking.BookingID}/location`,
                { location: locationInput },
                { headers: { Authorization: token } }
            );
            alert("✅ Đã cập nhật địa điểm!");
            setIsModalOpen(false);
            fetchData();
        } catch {
            alert("Lỗi cập nhật");
        }
    };

    const cancelBooking = async () => {
        const reason = prompt("Nhập lý do hủy:");
        if (!reason) return;

        const token = localStorage.getItem('token');
        try {
            await axios.put(
                `http://localhost:5000/api/booking/${selectedBooking.BookingID}/cancel`,
                { reason },
                { headers: { Authorization: token } }
            );
            alert("✅ Đã hủy lịch!");
            setIsModalOpen(false);
            fetchData();
        } catch {
            alert("Lỗi hủy");
        }
    };

    // ================= HANDLE ACTION =================
    const submitAction = async (bookingId, body) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(
                `http://localhost:5000/api/booking/${bookingId}/status`,
                body,
                { headers: { Authorization: token } }
            );
            alert("✅ Đã xử lý!");
            fetchData();
        } catch {
            alert("Lỗi xử lý");
        }
    };

    const handleAction = (bookingId, action) => {
        if (action === 'rescheduled') {
            const booking = bookings.find(b => b.BookingID === bookingId);
            setRescheduleBooking(booking);
            setIsRescheduleOpen(true);
            return;
        }

        submitAction(bookingId, { status: action });
    };

    const confirmReschedule = ({ week, day, period }) => {
        submitAction(rescheduleBooking.BookingID, {
            status: 'rescheduled',
            newWeek: week,
            newDay: day,
            newPeriod: period
        });
    };

    // ================= RENDER =================
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
                🎓 Giảng Viên Dashboard
            </h2>

            <div className="flex gap-2 border-b mb-6">
                <TabButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')}>
                    📅 Lịch Biểu
                </TabButton>
                <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>
                    📩 Yêu cầu
                </TabButton>
                <TabButton active={activeTab === 'interview'} onClick={() => setActiveTab('interview')}>
                    👥 Tạo Buổi Tư Vấn
                </TabButton>
                <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
                    ⭐ Đánh Giá
                </TabButton>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                {activeTab === 'grid' && (
                    <ScheduleGridTab
                        week={week}
                        setWeek={setWeek}
                        availability={availability}
                        bookings={bookings}
                        sessions={sessions}
                        onToggleAvailability={toggleAvailability}
                        onOpenBookingModal={openBookingModal}
                        onOpenSessionModal={openSessionModal}
                    />
                )}

                {activeTab === 'interview' && (
                    <CreateInterviewTab
                        interviewForm={interviewForm}
                        setInterviewForm={setInterviewForm}
                        onSuccess={fetchData}
                    />
                )}

                {activeTab === 'reviews' && <ReviewTab tutorId={tutorId} />}

                {activeTab === 'requests' && (
                    <BookingRequestsTab
                        bookings={bookings}
                        onHandleAction={handleAction}
                    />
                )}
            </div>

            {/* BOOKING DETAIL */}
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Chi tiết Buổi Tư Vấn"
                actions={
                    <div className="flex gap-3 justify-end">
                        <button onClick={cancelBooking} className="btn-danger">Hủy Lịch</button>
                        <button onClick={updateLocation} className="btn-primary">Cập nhật</button>
                    </div>
                }
            >
                {selectedBooking && (
                    <div className="flex flex-col gap-4">
                        <div><b>Sinh viên:</b> {selectedBooking.StudentName}</div>
                        <div><b>Thời gian:</b> Tuần {selectedBooking.WeekNumber} • Thứ {selectedBooking.DayOfWeek} • Tiết {selectedBooking.StartPeriod}</div>
                        <div><b>Chủ đề:</b> {selectedBooking.Topic}</div>
                        <div><b>Hình thức:</b> {selectedBooking.MeetingMode}</div>
                        <input
                            value={locationInput}
                            onChange={e => setLocationInput(e.target.value)}
                            className="border px-3 py-2 rounded"
                        />
                    </div>
                )}
            </BookingModal>

            <AcademicSessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                session={selectedSession}
            />

            {/* 🔄 RESCHEDULE MODAL */}
            <RescheduleModal
                isOpen={isRescheduleOpen}
                onClose={() => setIsRescheduleOpen(false)}
                booking={rescheduleBooking}
                week={week}
                bookings={bookings}
                sessions={sessions}
                onConfirm={confirmReschedule}
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

export default TutorDashboard;
