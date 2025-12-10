import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from '../components/BookingModal'; // Đảm bảo bạn đã có file này

const PERIODS = Array.from({length: 17}, (_, i) => i + 1);
const DAYS = [2, 3, 4, 5, 6, 7, 8];

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
        week: 1, day: 2, startPeriod: 1, 
        topic: 'Tư vấn nhóm', 
        location: 'Google Meet', 
        mode: 'Online'
    });

    // Load dữ liệu khi vào trang hoặc đổi tuần
    useEffect(() => {
        fetchData();
    }, [week]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) return;

        try {
            // 1. Lấy lịch rảnh
            const resAvail = await axios.get(`http://localhost:5000/api/tutor/${user.id}/availability?week=${week}`);
            setAvailability(resAvail.data);

            // 2. Lấy danh sách Booking (Lọc bỏ các cái đã hủy/từ chối để không hiện rác trên Grid)
            const resBook = await axios.get('http://localhost:5000/api/my-bookings', { headers: {Authorization: token} });
            const activeBookings = resBook.data.filter(b => b.WeekNumber == week && b.Status !== 'rejected' && b.Status !== 'cancelled');
            setBookings(activeBookings);
        } catch (err) {
            console.error(err);
        }
    };

    // --- LOGIC GRID (TAB 1) ---

    const handleGridClick = (day, period) => {
        // Kiểm tra xem ô này có Booking không
        const booking = bookings.find(b => b.DayOfWeek === day && period >= b.StartPeriod && period <= b.EndPeriod);
        
        if (booking) {
            // -> CÓ: Mở Modal xem chi tiết
            setSelectedBooking(booking);
            setLocationInput(booking.Location || ''); 
            setIsModalOpen(true);
        } else {
            // -> KHÔNG: Toggle Rảnh/Bận
            toggleAvailability(day, period);
        }
    };

    const toggleAvailability = async (day, period) => {
        const token = localStorage.getItem('token');
        const isFree = availability.find(a => a.DayOfWeek === day && period >= a.StartPeriod && period <= a.EndPeriod);
        
        try {
            if (isFree) {
                 // XÓA LỊCH RẢNH (DELETE)
                 await axios.delete('http://localhost:5000/api/tutor/availability', {
                    headers: { Authorization: token },
                    data: { week, day, startPeriod: period, endPeriod: period }
                 });
            } else {
                // THÊM LỊCH RẢNH (POST)
                await axios.post('http://localhost:5000/api/tutor/availability', {
                    week, day, startPeriod: period, endPeriod: period
                }, { headers: { Authorization: token } });
            }
            fetchData(); // Load lại
        } catch (e) { alert("Lỗi cập nhật lịch"); }
    };

    const getCellStyle = (day, period) => {
        // Ưu tiên 1: Booking -> Vàng
        const booking = bookings.find(b => b.DayOfWeek === day && period >= b.StartPeriod && period <= b.EndPeriod);
        if (booking) return { background: '#ffc107', color: '#000', cursor: 'pointer', fontWeight: 'bold' };
        
        // Ưu tiên 2: Rảnh -> Xanh
        const isFree = availability.find(a => a.DayOfWeek === day && period >= a.StartPeriod && period <= a.EndPeriod);
        if (isFree) return { background: '#d4edda', cursor: 'pointer' }; 
        
        // Mặc định -> Trắng
        return { background: 'white', cursor: 'pointer' };
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
        if(!reason) return;
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

    // --- LOGIC TẠO BUỔI TƯ VẤN (TAB 3) ---
    const handleCreateInterview = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/tutor/interview', {
                studentEmails: interviewForm.emails,
                week: interviewForm.week,
                day: interviewForm.day,
                startPeriod: interviewForm.startPeriod,
                endPeriod: interviewForm.startPeriod,
                topic: interviewForm.topic,
                location: interviewForm.location,
                meetingMode: interviewForm.mode
            }, { headers: { Authorization: token } });

            alert("✅ Đã tạo buổi tư vấn nhóm thành công!");
            setInterviewForm({...interviewForm, emails: ''});
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi tạo tư vấn");
        }
    };

    // --- RENDER GIAO DIỆN ---
    return (
        <div className="dashboard-container">
            <h2 style={{color:'#004aad'}}>🎓 Giảng Viên Dashboard</h2>
            
            {/* THANH TAB */}
            <div style={{marginBottom: 20, borderBottom: '1px solid #ddd', display: 'flex', gap: 10}}>
                <button onClick={() => setActiveTab('grid')} style={getTabStyle(activeTab === 'grid')}>📅 Lịch Biểu</button>
                <button onClick={() => setActiveTab('requests')} style={getTabStyle(activeTab === 'requests')}>📩 Yêu cầu ({bookings.filter(b => b.Status === 'pending').length})</button>
                <button onClick={() => setActiveTab('interview')} style={{...getTabStyle(activeTab === 'interview'), color: '#d63384'}}>👥 Tạo Buổi Tư Vấn</button>
            </div>

            {/* TAB 1: GRID */}
            {activeTab === 'grid' && (
                <>
                    <div style={{marginBottom: 10}}>
                        <label>Chọn tuần: </label>
                        <select onChange={e => setWeek(e.target.value)} value={week} style={{padding: 5, borderRadius: 4}}>
                            {[...Array(20)].map((_, i) => <option key={i} value={i+1}>Tuần {i+1}</option>)}
                        </select>
                        <div style={{marginTop:5, fontSize:13, color:'#666'}}>
                            * Click ô trắng -> <strong>Rảnh</strong>. Click ô xanh -> <strong>Hủy rảnh</strong>. Click ô vàng -> <strong>Xem chi tiết</strong>.
                        </div>
                    </div>
                    <div style={{overflowX: 'auto'}}>
                        <table style={{borderCollapse: 'collapse', width: '100%', textAlign: 'center'}}>
                            <thead>
                                <tr>
                                    <th style={{background:'#333', color:'white', width: '80px'}}>Tiết</th>
                                    {DAYS.map(d => <th key={d} style={{background:'#004aad', color:'white'}}>Thứ {d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {PERIODS.map(p => (
                                    <tr key={p}>
                                        <td style={{fontWeight:'bold', background:'#eee'}}>Tiết {p}</td>
                                        {DAYS.map(d => {
                                            const booking = bookings.find(b => b.DayOfWeek === d && p >= b.StartPeriod && p <= b.EndPeriod);
                                            return (
                                                <td key={`${d}-${p}`} 
                                                    onClick={() => handleGridClick(d, p)}
                                                    style={{border:'1px solid #ddd', height: 45, fontSize: 11, ...getCellStyle(d, p)}}
                                                >
                                                    {booking ? (
                                                        <div style={{lineHeight: 1.2}}>
                                                            <div>🔒 {booking.Status === 'pending' ? 'Chờ' : 'Đã nhận'}</div>
                                                            <div style={{fontSize: 9, fontWeight: 'normal', maxWidth: 80, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
                                                                {booking.StudentName}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* TAB 2: REQUESTS */}
            {activeTab === 'requests' && (
                <table style={{marginTop: 10}}>
                    <thead><tr><th>Sinh viên</th><th>Lịch hẹn</th><th>Nội dung</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                    <tbody>
                        {bookings.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>Không có yêu cầu nào.</td></tr>}
                        {bookings.map(b => (
                            <tr key={b.BookingID}>
                                <td style={{fontWeight:'bold', color: '#004aad'}}>{b.StudentName}</td>
                                <td>Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}, Tiết {b.StartPeriod}-{b.EndPeriod}</td>
                                <td>{b.Topic}</td>
                                <td><span style={{padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12, background: b.Status==='confirmed'?'green':(b.Status==='pending'?'#6c757d':'orange')}}>{b.Status.toUpperCase()}</span></td>
                                <td>
                                    {b.Status === 'pending' && (
                                        <div style={{display:'flex', gap: 5}}>
                                            <button className="action-btn" style={{background:'green'}} onClick={() => handleAction(b.BookingID, 'confirmed')}>✅ Duyệt</button>
                                            <button className="action-btn" style={{background:'#fd7e14'}} onClick={() => handleAction(b.BookingID, 'rescheduled')}>✏️ Đổi</button>
                                            <button className="action-btn" style={{background:'red'}} onClick={() => handleAction(b.BookingID, 'rejected')}>❌ Từ chối</button>
                                        </div>
                                    )}
                                    {b.Status === 'confirmed' && <button className="action-btn" style={{background:'#dc3545'}} onClick={() => handleAction(b.BookingID, 'rejected')}>Hủy bỏ</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* TAB 3: TẠO BUỔI TƯ VẤN */}
            {activeTab === 'interview' && (
                <div style={{maxWidth: '600px', margin: '0 auto', background: '#fff0f6', padding: 20, borderRadius: 8}}>
                    <h3 style={{color: '#d63384'}}>👥 Tạo Buổi Tư Vấn Nhóm</h3>
                    <form onSubmit={handleCreateInterview} style={{display:'flex', flexDirection:'column', gap: 15}}>
                        <div>
                            <label style={{fontWeight:'bold'}}>Danh sách Email (cách nhau dấu phẩy):</label>
                            <textarea required placeholder="sv1@hcmut.edu.vn, sv2@hcmut.edu.vn" value={interviewForm.emails} onChange={e => setInterviewForm({...interviewForm, emails: e.target.value})} style={{width:'100%', height: 60, padding: 8}} />
                        </div>
                        <div style={{display:'flex', gap: 10}}>
                            <div style={{flex:1}}>
                                <label style={{fontWeight:'bold'}}>Hình thức:</label>
                                <select style={{width:'100%', padding: 8}} value={interviewForm.mode} onChange={e => setInterviewForm({...interviewForm, mode: e.target.value})}>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                </select>
                            </div>
                            <div style={{flex:2}}>
                                <label style={{fontWeight:'bold'}}>Địa điểm / Link:</label>
                                <input type="text" value={interviewForm.location} onChange={e => setInterviewForm({...interviewForm, location: e.target.value})} style={{width:'100%', padding: 8}} />
                            </div>
                        </div>
                        <div style={{display:'flex', gap: 10}}>
                             <div style={{flex:1}}><label style={{fontWeight:'bold'}}>Tuần:</label><select style={{width:'100%', padding:8}} value={interviewForm.week} onChange={e => setInterviewForm({...interviewForm, week: e.target.value})}>{[...Array(20)].map((_, i) => <option key={i} value={i+1}>Tuần {i+1}</option>)}</select></div>
                             <div style={{flex:1}}><label style={{fontWeight:'bold'}}>Thứ:</label><select style={{width:'100%', padding:8}} value={interviewForm.day} onChange={e => setInterviewForm({...interviewForm, day: e.target.value})}>{DAYS.map(d=><option key={d} value={d}>Thứ {d}</option>)}</select></div>
                             <div style={{flex:1}}><label style={{fontWeight:'bold'}}>Tiết:</label><select style={{width:'100%', padding:8}} value={interviewForm.startPeriod} onChange={e => setInterviewForm({...interviewForm, startPeriod: e.target.value})}>{PERIODS.map(p=><option key={p} value={p}>Tiết {p}</option>)}</select></div>
                        </div>
                        <div>
                            <label style={{fontWeight:'bold'}}>Chủ đề:</label>
                            <input type="text" value={interviewForm.topic} onChange={e => setInterviewForm({...interviewForm, topic: e.target.value})} style={{width:'100%', padding: 8}} />
                        </div>
                        <button type="submit" className="btn-primary" style={{background: '#d63384'}}>✅ Tạo Lịch & Gửi TB</button>
                    </form>
                </div>
            )}

            {/* --- MODAL CHI TIẾT --- */}
            <BookingModal 
                isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                title="📄 Chi tiết Buổi Tư Vấn"
                actions={
                    <>
                        <button onClick={cancelBooking} style={{background:'#dc3545', color:'white', border:'none', padding:'8px 15px', borderRadius:4, cursor:'pointer'}}>❌ Hủy Lịch</button>
                        <button onClick={updateLocation} className="btn-primary">💾 Cập nhật</button>
                    </>
                }
            >
                {selectedBooking && (
                    <div style={{display:'flex', flexDirection:'column', gap: 10}}>
                        <div><strong>Sinh viên:</strong> {selectedBooking.StudentName}</div>
                        <div><strong>Thời gian:</strong> Thứ {selectedBooking.DayOfWeek}, Tiết {selectedBooking.StartPeriod}</div>
                        <div><strong>Chủ đề:</strong> {selectedBooking.Topic}</div>
                        <div><strong>Hình thức:</strong> <span style={{color: selectedBooking.MeetingMode==='Online'?'blue':'green', fontWeight:'bold'}}>{selectedBooking.MeetingMode}</span></div>
                        
                        <div>
                            <label style={{fontWeight:'bold', display:'block', marginBottom: 5}}>Địa điểm / Link Meeting:</label>
                            <input 
                                type="text" 
                                value={locationInput} 
                                onChange={e => setLocationInput(e.target.value)}
                                placeholder="Nhập phòng học hoặc link Google Meet..."
                                style={{width:'100%', padding: 8, border: '1px solid #ccc', borderRadius: 4}}
                            />
                        </div>
                    </div>
                )}
            </BookingModal>
        </div>
    );
};

const getTabStyle = (isActive) => ({
    padding: 10, border: 'none', cursor: 'pointer', fontWeight: 'bold',
    background: isActive ? '#eee' : 'white',
    borderBottom: isActive ? '2px solid #004aad' : 'none'
});

export default TutorDashboard;