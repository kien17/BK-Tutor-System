import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import CreateInterviewTab from '../components/tutor/CreateInterviewTab';
import ScheduleGridTab from '../components/tutor/ScheduleGridTab';
import BookingRequestsTab from '../components/tutor/BookingRequestsTab';
import ReviewTab from '../components/tutor/ReviewTab';
import AcademicSessionModal from '../components/tutor/AcademicSessionModal';

const TutorDashboard = () => {
    const [week, setWeek] = useState(1);
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [sessions, setSessions] = useState([]); // ✅ thêm
    const [activeTab, setActiveTab] = useState('grid');

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

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

            // ✅ FETCH ACADEMIC SESSIONS
            const resSessions = await axios.get(
                `http://localhost:5000/api/tutor/academic-sessions?week=${week}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSessions(resSessions.data);

        } catch (err) {
            console.error(err);
        }
    };

    const openBookingModal = (booking) => {
        setSelectedBooking(booking);
        setLocationInput(booking.Location || '');
        setIsModalOpen(true);
    };
    const openSessionModal = (session) => {
        setSelectedSession(session);
        setIsSessionModalOpen(true);
    };

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

    const handleAction = async (bookingId, action) => {
        const token = localStorage.getItem('token');
        let body = { status: action };

        if (action === 'rescheduled') {
            const newInfo = prompt("Nhập lịch mới (Tuần-Thứ-Tiết):", `${week}-2-1`);
            if (!newInfo) return;
            const p = newInfo.split('-');
            if (p.length !== 3) return alert("Sai định dạng!");
            body = { status: 'rescheduled', newWeek: p[0], newDay: p[1], newPeriod: p[2] };
        }

        try {
            await axios.put(`http://localhost:5000/api/booking/${bookingId}/status`, body, {
                headers: { Authorization: token }
            });
            alert("✅ Đã xử lý!");
            fetchData();
        } catch (e) {
            alert("Lỗi xử lý");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
                🎓 Giảng Viên Dashboard
            </h2>

            <div className="flex gap-2 border-b mb-6">
                <TabButton active={activeTab==='grid'} onClick={()=>setActiveTab('grid')}>
                    📅 Lịch Biểu
                </TabButton>
                <TabButton active={activeTab==='requests'} onClick={()=>setActiveTab('requests')}>
                    📩 Yêu cầu
                </TabButton>
                <TabButton active={activeTab==='interview'} onClick={()=>setActiveTab('interview')}>
                    👥 Tạo Buổi Tư Vấn
                </TabButton>
                <TabButton active={activeTab==='reviews'} onClick={()=>setActiveTab('reviews')}>
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
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Chi tiết Buổi Tư Vấn"
                actions={
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={cancelBooking}
                            className="px-4 py-2 bg-red-100 text-red-700 border border-red-500 rounded-lg font-semibold"
                        >
                            Hủy Lịch
                        </button>
                        <button
                            onClick={updateLocation}
                            className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg font-semibold"
                        >
                            Cập nhật
                        </button>
                    </div>
                }
            >
                {selectedBooking ? (
                    <div className="flex flex-col gap-4">
                        <div className="text-gray-700 break-words whitespace-normal">
                            <span className="font-semibold">Sinh viên:</span>{" "}
                            {selectedBooking.StudentName}
                        </div>

                        <div className="text-gray-700 break-words whitespace-normal">
                            <span className="font-semibold">Thời gian:</span>{" "}
                            Tuần {selectedBooking.WeekNumber} • Thứ {selectedBooking.DayOfWeek} • Tiết {selectedBooking.StartPeriod}
                        </div>

                        <div className="text-gray-700 break-words whitespace-normal">
                            <span className="font-semibold">Chủ đề:</span>{" "}
                            {selectedBooking.Topic}
                        </div>

                        <div className="text-gray-700 break-words whitespace-normal">
                            <span className="font-semibold">Hình thức:</span>{" "}
                            {selectedBooking.MeetingMode}
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="text-gray-700 break-words whitespace-normal">
                                <span className="font-semibold">Địa điểm/ Link:</span>{" "}
                            </div>
                                <input
                                    value={locationInput}
                                    onChange={e => setLocationInput(e.target.value)}
                                    className="border px-3 py-2 rounded"
                                />
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500 italic">Chưa chọn buổi tư vấn</div>
                )}
            </BookingModal>
            <AcademicSessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                session={selectedSession}
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