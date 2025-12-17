import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import CreateInterviewTab from '../components/tutor/CreateInterviewTab';
import ScheduleGridTab from '../components/tutor/ScheduleGridTab';
import BookingRequestsTab from '../components/tutor/BookingRequestsTab';

const TutorDashboard = () => {
    const [week, setWeek] = useState(1);
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('grid');

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [locationInput, setLocationInput] = useState('');

    const [interviewForm, setInterviewForm] = useState({
        emails: '',
        week: 1,
        day: 2,
        startPeriod: 1,
        topic: 'Tư vấn nhóm',
        location: 'Google Meet',
        mode: 'Online'
    });

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tutorId = user.id;

    useEffect(() => {
        fetchData();
    }, [week]);

    useEffect(() => {
        if (tutorId) fetchReviews();
    }, [tutorId]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token || !user?.id) return;

        try {
            const resAvail = await axios.get(`http://localhost:5000/api/tutor/${user.id}/availability?week=${week}`);
            setAvailability(resAvail.data);

            const resBook = await axios.get('http://localhost:5000/api/my-bookings', {
                headers: { Authorization: token }
            });
            const activeBookings = resBook.data.filter(
                b => b.WeekNumber == week && b.Status !== 'rejected' && b.Status !== 'cancelled'
            );
            setBookings(activeBookings);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReviews = async () => {
        const token = localStorage.getItem('token');
        if (!token || !tutorId) return;

        try {
            const res = await axios.get(
                `http://localhost:5000/api/tutors/${tutorId}/reviews-with-booking`,
                { headers: { Authorization: token } }
            );
            setReviews(res.data.reviews);
            setAverageRating(res.data.averageRating ? Number(res.data.averageRating).toFixed(1) : 0);
        } catch (err) {
            console.error('Lỗi tải đánh giá:', err);
            setReviews([]);
            setAverageRating(0);
        }
    };

    const openBookingModal = (booking) => {
        setSelectedBooking(booking);
        setLocationInput(booking.Location || '');
        setIsModalOpen(true);
    };
    
    const toggleAvailability = async (day, period) => {
        const token = localStorage.getItem('token');
        const isFree = availability.find(a => a.DayOfWeek === day && period >= a.StartPeriod && period <= a.EndPeriod);

        try {
            if (isFree) {
                await axios.delete('http://localhost:5000/api/tutor/availability', {
                    headers: { Authorization: token },
                    data: { week, day, startPeriod: period, endPeriod: period }
                });
            } else {
                await axios.post('http://localhost:5000/api/tutor/availability', {
                    week, day, startPeriod: period, endPeriod: period
                }, { headers: { Authorization: token } });
            }
            fetchData();
        } catch (e) {
            alert("Lỗi cập nhật lịch");
        }
    };

    const updateLocation = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:5000/api/booking/${selectedBooking.BookingID}/location`,
                { location: locationInput },
                { headers: { Authorization: token } }
            );
            alert("✅ Đã cập nhật địa điểm!");
            setIsModalOpen(false);
            fetchData();
        } catch (e) { alert("Lỗi cập nhật"); }
    };

    const cancelBooking = async () => {
        const reason = prompt("Nhập lý do hủy:");
        if (!reason) return;
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:5000/api/booking/${selectedBooking.BookingID}/cancel`,
                { reason },
                { headers: { Authorization: token } }
            );
            alert("✅ Đã hủy lịch!");
            setIsModalOpen(false);
            fetchData();
        } catch (e) { alert("Lỗi hủy"); }
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
        } catch (e) { alert("Lỗi xử lý"); }
    };

    const renderStars = (rating) => (
        <div className="text-yellow-400 text-lg">
            {'★'.repeat(rating)}
            {'☆'.repeat(5 - rating)}
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto ">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">🎓 Giảng Viên Dashboard</h2>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-300 mb-6">
                <TabButton active={activeTab==='grid'} onClick={()=>setActiveTab('grid')}>📅 Lịch Biểu</TabButton>
                <TabButton active={activeTab==='requests'} onClick={()=>setActiveTab('requests')}>📩 Yêu cầu ({bookings.filter(b=>b.Status==='pending').length})</TabButton>
                <TabButton active={activeTab==='interview'} onClick={()=>setActiveTab('interview')}>👥 Tạo Buổi Tư Vấn</TabButton>
                <TabButton active={activeTab==='reviews'} onClick={()=>setActiveTab('reviews')}>⭐ Xem Đánh Giá ({reviews.length})</TabButton>
            </div>

            {/* Tab content */}
            <div className="bg-white p-6 rounded-lg shadow-sm min-h-[300px]">
                {activeTab === 'grid' && (
                    <ScheduleGridTab
                        week={week}
                        setWeek={setWeek}
                        availability={availability}
                        bookings={bookings}
                        onToggleAvailability={toggleAvailability}
                        onOpenBookingModal={openBookingModal}
                    />
                )}
                {activeTab === 'requests' && (
                    <BookingRequestsTab
                        bookings={bookings}
                        onHandleAction={handleAction}
                    />
                )}
                {activeTab === 'interview' && (
                    <CreateInterviewTab
                        interviewForm={interviewForm}
                        setInterviewForm={setInterviewForm}
                        onSuccess={fetchData}
                    />
                )}
                {activeTab === 'reviews' && (
                    <div>
                        <h3 className="text-pink-600 text-xl font-semibold mb-6">Đánh Giá Từ Sinh Viên</h3>

                        {/* Average rating */}
                        <div className="bg-gray-50 p-6 rounded-xl text-center mb-6 shadow-sm">
                            <h2 className="text-5xl text-yellow-400 font-bold mb-2">{averageRating || '0.0'}</h2>
                            <div className="text-2xl mb-2">{renderStars(Math.round(averageRating || 0))}</div>
                            <p className="text-gray-500">Dựa trên {reviews.length} đánh giá</p>
                        </div>

                        {/* Reviews list */}
                        {reviews.length === 0 ? (
                            <p className="text-center text-gray-400 italic py-10">Chưa có đánh giá nào từ sinh viên.</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review.ReviewID} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition">
                                        <div className="flex justify-between mb-2">
                                            <strong className="text-blue-900">{review.StudentName}</strong>
                                            <span className="text-gray-500 text-sm">{new Date(review.CreatedAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="text-gray-600 text-sm mb-2">
                                            <strong>Buổi tư vấn:</strong> Tuần {review.WeekNumber}, Thứ {review.DayOfWeek}, Tiết {review.StartPeriod}{review.EndPeriod !== review.StartPeriod ? `-${review.EndPeriod}` : ''}<br/>
                                            <strong>Chủ đề:</strong> {review.Topic}
                                        </div>
                                        <div className="mb-2">{renderStars(review.Rating)}</div>
                                        <p className="text-gray-800">{review.Comment || <em className="text-gray-400">Không có nhận xét</em>}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Chi tiết Buổi Tư Vấn"
                actions={
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={cancelBooking}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-500 rounded-lg font-semibold hover:bg-red-200 transition-shadow shadow-sm hover:shadow-md"
                        >
                            Hủy Lịch
                        </button>
                        <button
                            onClick={updateLocation}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg font-semibold hover:bg-blue-200 transition-shadow shadow-sm hover:shadow-md"
                        >
                            Cập nhật
                        </button>
                    </div>
                }
            >
                {selectedBooking ? (
                    <div className="flex flex-col gap-5">
                        {/* Sinh viên & Thời gian */}
                        <div className="text-gray-700">
                            <span className="font-semibold">Sinh viên:</span> {selectedBooking.StudentName}
                        </div>
                        {/* Thời gian */}
                        <div className="text-gray-700">
                            <span className="font-semibold">Thời gian:</span> Tuần {selectedBooking.WeekNumber} • Thứ {selectedBooking.DayOfWeek} • Tiết {selectedBooking.StartPeriod}{selectedBooking.EndPeriod !== selectedBooking.StartPeriod ? `-${selectedBooking.EndPeriod}` : ""}
                        </div>

                        {/* Chủ đề */}
                        <div className="text-gray-700 break-words">
                            <span className="font-semibold">Chủ đề:</span> {selectedBooking.Topic}
                        </div>

                        {/* Hình thức */}
                        <div className="text-gray-700">
                            <span className="font-semibold">Hình thức:</span>{" "}
                            <span
                                className={`font-bold px-2 py-1 rounded-full ${
                                    selectedBooking.MeetingMode === 'Online' 
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                            >
                                {selectedBooking.MeetingMode}
                            </span>
                        </div>

                        {/* Địa điểm / Link */}
                        <div className="flex flex-col gap-1">
                            <label className="font-semibold text-gray-700">Địa điểm / Link Meeting:</label>
                            <input
                                type="text"
                                value={locationInput}
                                onChange={e => setLocationInput(e.target.value)}
                                placeholder="Nhập phòng học hoặc link Google Meet..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-8 italic">Không có thông tin buổi tư vấn nào được chọn</div>
                )}
            </BookingModal>

        </div>
    );
};

// Tab Button component
const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-bold rounded-t-lg transition
            ${active ? 'bg-blue-100 text-blue-900 border-b-4 border-blue-900 shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
    >
        {children}
    </button>
);

export default TutorDashboard;
