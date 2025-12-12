import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from '../components/BookingModal'; // Đảm bảo bạn đã có file này
import CreateInterviewTab from '../components/tutor/CreateInterviewTab';
import ScheduleGridTab from '../components/tutor/ScheduleGridTab';
import BookingRequestsTab    from '../components/tutor/BookingRequestsTab';


const TutorDashboard = () => {
    const [week, setWeek] = useState(1);
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('grid');

    // State cho Modal xem chi tiết
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [locationInput, setLocationInput] = useState('');

    // State cho form tạo buổi tư vấn (Tab 3)
    const [interviewForm, setInterviewForm] = useState({
        emails: '',
        week: 1,
        day: 2,
        startPeriod: 1,
        topic: 'Tư vấn nhóm',
        location: 'Google Meet',
        mode: 'Online'
    });

    // State cho phần Reviews (Tab mới)
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tutorId = user.id;

    // Load dữ liệu khi vào trang hoặc đổi tuần
    useEffect(() => {
        fetchData();
    }, [week]);

    // Load đánh giá một lần khi có tutorId
    useEffect(() => {
        if (tutorId) fetchReviews();
    }, [tutorId]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token || !user?.id) return;

        try {
            // 1. Lấy lịch rảnh
            const resAvail = await axios.get(`http://localhost:5000/api/tutor/${user.id}/availability?week=${week}`);
            setAvailability(resAvail.data);

            // 2. Lấy danh sách Booking
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

            setReviews(res.data.reviews);                    // Đã có sẵn WeekNumber, Topic, ...
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

    // --- CÁC HÀNH ĐỘNG TRONG MODAL ---
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

    // --- LOGIC REQUESTS (TAB 2) ---
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

    // --- HÀM HIỂN THỊ SAO ---
    const renderStars = (rating) => {
        return (
            <div style={{ color: '#ffc107', fontSize: '18px' }}>
                {'★'.repeat(rating)}
                {'☆'.repeat(5 - rating)}
            </div>
        );
    };

    // --- RENDER GIAO DIỆN ---
    return (
        <div className="dashboard-container">
            <h2 style={{ color: '#004aad' }}>🎓 Giảng Viên Dashboard</h2>

            {/* THANH TAB */}
            <div style={{
                marginBottom: 20,
                borderBottom: '1px solid #ddd',
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap'
            }}>
                <button onClick={() => setActiveTab('grid')} style={getTabStyle(activeTab === 'grid')}>
                    📅 Lịch Biểu
                </button>
                <button onClick={() => setActiveTab('requests')} style={getTabStyle(activeTab === 'requests')}>
                    📩 Yêu cầu ({bookings.filter(b => b.Status === 'pending').length})
                </button>
                <button onClick={() => setActiveTab('interview')} style={getTabStyle(activeTab === 'interview')}>
                    👥 Tạo Buổi Tư Vấn
                </button>
                <button onClick={() => setActiveTab('reviews')} style={getTabStyle(activeTab === 'reviews')}>
                    ⭐ Xem Đánh Giá ({reviews.length})
                </button>
            </div>

            {/* TAB 1: GRID */}
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

            {/* TAB 2: REQUESTS */}
            {activeTab === 'requests' && (
                <BookingRequestsTab
                    bookings={bookings}
                    onHandleAction={handleAction} // truyền hàm xử lý hành động
                />
            )}

            {/* TAB 3: TẠO BUỔI TƯ VẤN */}
            {activeTab === 'interview' && (
                <CreateInterviewTab
                    interviewForm={interviewForm}
                    setInterviewForm={setInterviewForm}
                    onSuccess={fetchData} // sau khi tạo thành công thì reload lại bookings + availability
                />
            )}

            {/* TAB 4: XEM ĐÁNH GIÁ - HIỂN THỊ THEO BOOKINGID */}
            {activeTab === 'reviews' && (
                <div style={{ padding: 20 }}>
                    <h3 style={{ color: '#d63384', marginBottom: 20 }}>⭐ Đánh Giá Từ Sinh Viên</h3>

                    {/* Trung bình sao */}
                    <div style={{
                        background: '#f8f9fa',
                        padding: 20,
                        borderRadius: 10,
                        textAlign: 'center',
                        marginBottom: 30,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '48px', color: '#ffc107' }}>
                            {averageRating || '0.0'}
                        </h2>
                        <div style={{ fontSize: '28px', marginBottom: 10 }}>
                            {renderStars(Math.round(averageRating || 0))}
                        </div>
                        <p style={{ color: '#666' }}>Dựa trên {reviews.length} đánh giá</p>
                    </div>

                    {/* Danh sách đánh giá theo từng buổi tư vấn */}
                    {reviews.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', fontStyle: 'italic', padding: '40px' }}>
                            Chưa có đánh giá nào từ sinh viên.
                        </p>
                    ) : (
                        <div>
                            {reviews.map(review => (
                                <div key={review.ReviewID} style={{
                                    background: 'white',
                                    border: '1px solid #eee',
                                    borderRadius: 8,
                                    padding: 15,
                                    marginBottom: 15,
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <strong style={{ color: '#004aad' }}>{review.StudentName}</strong>
                                        <span style={{ color: '#666', fontSize: '14px' }}>
                                            {new Date(review.CreatedAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '14px', color: '#555', marginBottom: 10 }}>
                                        <strong>Buổi tư vấn:</strong> Tuần {review.WeekNumber}, Thứ {review.DayOfWeek}, Tiết {review.StartPeriod}{review.EndPeriod !== review.StartPeriod ? `-${review.EndPeriod}` : ''} <br />
                                        <strong>Chủ đề:</strong> {review.Topic}
                                    </div>

                                    <div style={{ marginBottom: 8 }}>{renderStars(review.Rating)}</div>

                                    <p style={{ margin: 0, color: '#333', lineHeight: 1.5 }}>
                                        {review.Comment || <em style={{ color: '#aaa' }}>Không có nhận xét</em>}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL CHI TIẾT BOOKING */}
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="📄 Chi tiết Buổi Tư Vấn"
                actions={
                    <>
                        <button
                            onClick={cancelBooking}
                            style={{
                                padding: "8px 16px",
                                background: "#fde2e4",
                                color: "#c1121f",
                                border: "1px solid #e5383b",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "0.2s",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = "#fcd7da";
                                e.target.style.borderColor = "#ba181b";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = "#fde2e4";
                                e.target.style.borderColor = "#e5383b";
                            }}
                        >
                            ❌ <span style={{ marginTop: 2 }}>Hủy Lịch</span>
                        </button>
                        {/* <button onClick={updateLocation} className="btn-primary">💾 Cập nhật</button> */}
                        <button
                            onClick={updateLocation}
                            style={{
                                padding: "8px 12px",
                                background: "#e7f5ff",
                                color: "#1c7ed6",
                                border: "1px solid #74c0fc",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 600,
                                whiteSpace: "nowrap",   // Giữ 1 dòng
                                maxWidth: "120px",      // Giới hạn độ dài
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            🔄 Cập nhật
                        </button>

                    </>
                }
            >
                {selectedBooking && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div><strong>Sinh viên:</strong> {selectedBooking.StudentName}</div>
                        <div><strong>Thời gian:</strong> Thứ {selectedBooking.DayOfWeek}, Tiết {selectedBooking.StartPeriod}</div>
                        <div><strong>Chủ đề:</strong> {selectedBooking.Topic}</div>
                        <div><strong>Hình thức:</strong> <span style={{ color: selectedBooking.MeetingMode === 'Online' ? 'blue' : 'green', fontWeight: 'bold' }}>{selectedBooking.MeetingMode}</span></div>
                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}>Địa điểm / Link Meeting:</label>
                            <input
                                type="text"
                                value={locationInput}
                                onChange={e => setLocationInput(e.target.value)}
                                placeholder="Nhập phòng học hoặc link Google Meet..."
                                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                            />
                        </div>
                    </div>
                )}
            </BookingModal>
        </div>
    );
};

const getTabStyle = (isActive) => ({
    padding: '10px 16px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: isActive ? '#e3f2fd' : 'white',
    color: isActive ? '#004aad' : '#333',
    borderBottom: isActive ? '3px solid #004aad' : 'none',
    borderRadius: '8px 8px 0 0'
});

export default TutorDashboard;