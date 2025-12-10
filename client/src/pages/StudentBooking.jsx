import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from '../components/BookingModal'; // Import Modal dùng chung

const PERIODS = Array.from({length: 17}, (_, i) => i + 1);
const DAYS = [2, 3, 4, 5, 6, 7, 8];

const StudentBooking = () => {
    const [tutors, setTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState('');
    const [week, setWeek] = useState(1);
    
    // Dữ liệu
    const [availability, setAvailability] = useState([]); // Lịch thầy mở
    const [busySlots, setBusySlots] = useState([]);       // Lịch người khác đặt
    const [myBookings, setMyBookings] = useState([]);     // Lịch của mình
    
    // Giao diện
    const [activeTab, setActiveTab] = useState('booking'); // Tab hiện tại
    const [selectedSlot, setSelectedSlot] = useState(null); // Ô đang click
    const [modalType, setModalType] = useState(null); // 'book' hoặc 'info'
    const [form, setForm] = useState({ topic: '', mode: 'Online' }); // Form đặt

    useEffect(() => {
        // Lấy danh sách giảng viên
        axios.get('http://localhost:5000/api/users').then(res => {
            setTutors(res.data.filter(u => u.Role === 'tutor'));
        });
        fetchMyBookings();
    }, []);

    // Load dữ liệu lưới khi chọn Thầy hoặc đổi Tuần
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
        if(token) {
            axios.get('http://localhost:5000/api/my-bookings', { headers: {Authorization: token} })
                .then(res => setMyBookings(res.data));
        }
    }

    // --- LOGIC MÀU SẮC Ô ---
    const getSlotStatus = (day, period) => {
        // 1. Check MÌNH đã đặt (Tính cả Active và Rescheduled, bỏ qua Rejected/Cancelled)
        const isMine = myBookings.find(b => 
            b.TutorID == selectedTutor && b.WeekNumber == week && 
            b.DayOfWeek == day && period >= b.StartPeriod && period <= b.EndPeriod &&
            b.Status !== 'rejected' && b.Status !== 'cancelled'
        );
        
        if (isMine) {
            let color = '#6f42c1'; // Pending (Mặc định Tím)
            let label = 'Chờ duyệt';

            if (isMine.Status === 'confirmed') {
                color = '#007bff'; label = 'Đã duyệt'; // Xanh dương
            } else if (isMine.Status === 'rescheduled') {
                color = '#fd7e14'; label = 'Đã đổi'; // Cam
            }

            return { status: 'mine', label: label, color: color, cursor: 'pointer', data: isMine };
        }

        // 2. Check NGƯỜI KHÁC đặt
        const isBusy = busySlots.find(b => 
            b.DayOfWeek == day && period >= b.StartPeriod && period <= b.EndPeriod
        );
        if (isBusy) return { status: 'busy', label: 'Đã có lịch', color: '#ffc107', cursor: 'not-allowed' };

        // 3. Check LỊCH MỞ (Tutor rảnh)
        const isOpen = availability.find(a => 
            a.DayOfWeek == day && period >= a.StartPeriod && period <= a.EndPeriod
        );
        if (isOpen) return { status: 'free', label: 'Đăng ký', color: '#28a745', cursor: 'pointer' };

        // 4. Còn lại là Đóng
        return { status: 'closed', label: '', color: 'white', cursor: 'default' };
    };

    // --- XỬ LÝ CLICK ---
    const handleSlotClick = (day, period, status, bookingData) => {
        if (status === 'free') {
            // Mở form đặt lịch
            setSelectedSlot({ day, period });
            setModalType('book');
            setForm({ topic: '', mode: 'Online' });
        } else if (status === 'mine') {
            // Xem chi tiết vé của mình
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
                week, day: selectedSlot.day, 
                startPeriod: selectedSlot.period, endPeriod: selectedSlot.period,
                topic: form.topic, meetingMode: form.mode
            }, { headers: {Authorization: token} });
            
            alert("✅ Đăng ký thành công! Vui lòng chờ giảng viên duyệt.");
            setModalType(null);
            fetchMyBookings();
        } catch (err) { alert(err.response?.data?.message || "Lỗi đăng ký"); }
    };

    // Helper hiển thị trạng thái
    const renderStatusBadge = (status) => {
        if (status === 'confirmed') return <span style={{color:'green', fontWeight:'bold'}}>✅ ĐÃ DUYỆT</span>;
        if (status === 'rescheduled') return <span style={{color:'#fd7e14', fontWeight:'bold'}}>📅 ĐÃ ĐỔI LỊCH</span>;
        return <span style={{color:'#6f42c1', fontWeight:'bold'}}>⏳ ĐANG CHỜ</span>;
    };

    // Lọc danh sách cho Tab Lịch Sử
    const activeBookings = myBookings.filter(b => b.Status !== 'rejected' && b.Status !== 'cancelled');
    const historyBookings = myBookings.filter(b => b.Status === 'rejected' || b.Status === 'cancelled');

    return (
        <div className="dashboard-container">
            <h2 style={{color: '#004aad'}}>📅 Sinh Viên Dashboard</h2>

            {/* THANH TAB */}
            <div style={{marginBottom: 20, borderBottom: '1px solid #ddd', display: 'flex', gap: 10}}>
                <button onClick={() => setActiveTab('booking')} style={getTabStyle(activeTab === 'booking')}>📅 Đặt Lịch Tư Vấn</button>
                <button onClick={() => setActiveTab('history')} style={getTabStyle(activeTab === 'history')}>📜 Lịch Sử Vé</button>
            </div>

            {/* TAB 1: ĐẶT LỊCH (GRID) */}
            {activeTab === 'booking' && (
                <>
                    <div style={{display:'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', alignItems:'center'}}>
                        <div>
                            <label style={{fontWeight:'bold', marginRight: 10}}>Chọn Giảng Viên:</label>
                            <select onChange={e => setSelectedTutor(e.target.value)} style={{padding: 8, borderRadius: 4, minWidth: 200}}>
                                <option value="">-- Chọn --</option>
                                {tutors.map(t => <option key={t.UserID} value={t.UserID}>{t.FullName || t.Username}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{fontWeight:'bold', marginRight: 10}}>Tuần:</label>
                            <select onChange={e => setWeek(Number(e.target.value))} style={{padding: 8, borderRadius: 4}}>
                                {[...Array(20)].map((_, i) => <option key={i} value={i+1}>Tuần {i+1}</option>)}
                            </select>
                        </div>

                        <div style={{display:'flex', gap: 10, fontSize: 12, marginLeft: 'auto'}}>
                            <span style={{background:'#28a745', width:15, height:15}}></span> Rảnh
                            <span style={{background:'#ffc107', width:15, height:15}}></span> Đầy
                            <span style={{background:'#6f42c1', width:15, height:15}}></span> Chờ
                            <span style={{background:'#007bff', width:15, height:15}}></span> Duyệt
                        </div>
                    </div>

                    {selectedTutor ? (
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
                                                const { status, label, color, cursor, data } = getSlotStatus(d, p);
                                                return (
                                                    <td key={`${d}-${p}`} 
                                                        style={{border:'1px solid #ddd', height: 45, background: color, cursor: cursor, fontSize: 11, color: status==='closed'?'black':'white', fontWeight:'bold'}}
                                                        onClick={() => handleSlotClick(d, p, status, data)}
                                                    >
                                                        {label}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{textAlign:'center', marginTop: 50, color:'#888', fontStyle:'italic'}}>👈 Vui lòng chọn một Giảng viên để xem lịch rảnh.</p>
                    )}
                </>
            )}

            {/* TAB 2: LỊCH SỬ (LIST) */}
            {activeTab === 'history' && (
                <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
                    <div style={{flex: 1}}>
                        <h3 style={{borderBottom: '2px solid #28a745', paddingBottom: 5, color: '#28a745'}}>🎫 Vé Đang Hoạt Động</h3>
                        <ul style={{listStyle: 'none', padding: 0}}>
                            {activeBookings.length === 0 && <p style={{color:'#666'}}>Chưa có vé nào.</p>}
                            {activeBookings.map(b => (
                                <li key={b.BookingID} style={{padding: '15px', background: 'white', marginBottom: 10, borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `5px solid ${b.Status==='confirmed'?'#007bff':(b.Status==='rescheduled'?'#fd7e14':'#6f42c1')}`}}>
                                    <div style={{display:'flex', justifyContent:'space-between'}}>
                                        <strong style={{fontSize:16}}>Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}, Tiết {b.StartPeriod}</strong>
                                        {renderStatusBadge(b.Status)}
                                    </div>
                                    <div style={{marginTop: 5, color: '#555'}}>
                                        👨‍🏫 <strong>GV:</strong> {b.TutorName} <br/>
                                        📍 <strong>Tại:</strong> {b.Location || 'Chưa cập nhật'} ({b.MeetingMode}) <br/>
                                        📝 <strong>ND:</strong> {b.Topic}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{flex: 1}}>
                        <h3 style={{borderBottom: '2px solid #dc3545', paddingBottom: 5, color: '#dc3545'}}>🗑 Lịch sử Hủy / Từ chối</h3>
                        <ul style={{listStyle: 'none', padding: 0}}>
                            {historyBookings.length === 0 && <p style={{color:'#666'}}>Trống.</p>}
                            {historyBookings.map(b => (
                                <li key={b.BookingID} style={{padding: '15px', background: '#fff5f5', marginBottom: 10, borderRadius: 8, border: '1px solid #eee', opacity: 0.8}}>
                                    <div style={{display:'flex', justifyContent:'space-between'}}>
                                        <strong style={{textDecoration:'line-through'}}>Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}</strong>
                                        <span style={{color: '#dc3545', fontWeight:'bold'}}>{b.Status === 'cancelled' ? 'BẠN HỦY' : 'TỪ CHỐI'}</span>
                                    </div>
                                    <div style={{marginTop: 5, fontSize: 13}}>GV: {b.TutorName}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* --- MODAL ĐẶT LỊCH --- */}
            <BookingModal 
                isOpen={modalType === 'book'} onClose={() => setModalType(null)}
                title={`📅 Đặt lịch Thứ ${selectedSlot?.day} - Tiết ${selectedSlot?.period}`}
                actions={<><button onClick={() => setModalType(null)} className="btn-secondary">Hủy</button><button onClick={confirmBooking} className="btn-primary">Xác nhận Đặt</button></>}
            >
                <div className="form-group">
                    <label>Hình thức:</label>
                    <select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})} style={{width:'100%', padding: 8}}>
                        <option value="Online">🌐 Online (Google Meet/Zoom)</option>
                        <option value="Offline">🏫 Offline (Tại trường)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Nội dung cần tư vấn:</label>
                    <textarea 
                        value={form.topic} onChange={e => setForm({...form, topic: e.target.value})}
                        placeholder="VD: Em muốn hỏi về đồ án môn học..."
                        style={{width:'100%', padding: 8, height: 80}}
                    />
                </div>
            </BookingModal>

            {/* --- MODAL XEM CHI TIẾT (KHÔNG CÓ NÚT HỦY) --- */}
            <BookingModal 
                isOpen={modalType === 'info'} onClose={() => setModalType(null)}
                title="📄 Chi tiết Lịch hẹn"
                actions={<button onClick={() => setModalType(null)} className="btn-primary">Đóng</button>}
            >
                {selectedSlot && (
                    <table style={{width:'100%', lineHeight: '1.8'}}>
                        <tbody>
                            <tr><td style={{width:'100px', color:'#666'}}>Giảng viên:</td><td><strong>{selectedSlot.TutorName}</strong></td></tr>
                            <tr><td style={{color:'#666'}}>Thời gian:</td><td>Tuần {selectedSlot.WeekNumber}, Thứ {selectedSlot.DayOfWeek}, Tiết {selectedSlot.StartPeriod}</td></tr>
                            <tr><td style={{color:'#666'}}>Hình thức:</td><td><span style={{background: selectedSlot.MeetingMode==='Online'?'#e7f1ff':'#d4edda', padding:'2px 8px', borderRadius:4, color: selectedSlot.MeetingMode==='Online'?'#007bff':'#155724', fontWeight:'bold'}}>{selectedSlot.MeetingMode}</span></td></tr>
                            <tr><td style={{color:'#666'}}>Địa điểm:</td><td style={{color: '#dc3545', fontWeight:'bold'}}>{selectedSlot.Location || "Đang cập nhật..."}</td></tr>
                            <tr><td style={{color:'#666'}}>Nội dung:</td><td>{selectedSlot.Topic}</td></tr>
                            <tr><td style={{color:'#666'}}>Trạng thái:</td><td>{renderStatusBadge(selectedSlot.Status)}</td></tr>
                        </tbody>
                    </table>
                )}
            </BookingModal>
        </div>
    );
};

const getTabStyle = (isActive) => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
    background: isActive ? '#eee' : 'white',
    borderBottom: isActive ? '3px solid #004aad' : 'none',
    color: isActive ? '#004aad' : '#333'
});

export default StudentBooking;