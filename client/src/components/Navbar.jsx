import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import logoImg from '../assets/logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Kiểm tra đăng nhập mỗi khi Navbar render
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const handleLogout = () => {
        if(window.confirm("Bạn có chắc muốn đăng xuất?")) {
            localStorage.clear(); // Xóa token
            setUser(null); // Reset state
            navigate('/login'); // Chuyển về trang login
            window.location.reload(); // Reload để sạch sẽ state cũ
        }
    };

    const [notifications, setNotifications] = useState([]);
    const [showNoti, setShowNoti] = useState(false);
    const unreadCount = notifications.filter(n => !n.IsRead).length;

    // Hàm lấy thông báo
    const fetchNoti = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await axios.get('http://localhost:5000/api/notifications', {
                    headers: { Authorization: token }
                });
                setNotifications(res.data);
            } catch (e) {}
        }
    };

    // Gọi khi load trang
    useEffect(() => {
        fetchNoti();
        // Có thể set setInterval để tự động check mỗi 10s nếu muốn "Real-time" hơn
    }, [user]);

    const handleRead = async () => {
        setShowNoti(!showNoti);
        if (!showNoti && unreadCount > 0) {
            // Khi mở ra thì đánh dấu đã đọc hết
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/notifications/read', {}, { headers: {Authorization:token}});
            fetchNoti(); // Load lại để mất số đỏ
        }
    };

    return (
        <nav>
            {/* 1. Logo bên trái */}
            <Link to="/" style={{textDecoration:'none', display:'flex', alignItems:'center', gap: '12px'}}>
                <img 
                    src={logoImg} 
                    alt="BK Tutor Logo" 
                    style={{
                        height: '45px', 
                        width: 'auto'
                    }} 
                />
                
                <span style={{
                    color: 'white', 
                    fontSize: '22px', 
                    fontWeight: 'bold', 
                    letterSpacing: '1px',
                    fontFamily: '"Segoe UI", sans-serif'
                }}>
                    BK Tutor
                </span>
            </Link>

            {/* 2. Menu Giữa (Chỉ hiện khi đã đăng nhập) */}
            <div className="nav-links">
                {/* {user && user.role === 'student' && <Link to="/student" className="nav-link">Tìm Tài Liệu</Link>} */}
                {user && user.role === 'student' && <Link to="/student/booking" className="nav-link">Đăng Ký Tư Vấn</Link>}
                {user && user.role === 'tutor' && <Link to="/tutor" className="nav-link">Lịch Dạy</Link>}
                {user && user.role === 'admin' && <Link to="/admin" className="nav-link">Quản Trị</Link>}
                <Link to="/documents" className="nav-link">Kho Tài Liệu</Link>
            </div>

            {/* 3. Góc phải: Nút Login hoặc User Dropdown */}
            <div className="user-menu" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                {/* --- QUẢ CHUÔNG THÔNG BÁO --- */}
                {user && (
                    <div style={{position: 'relative'}}>
                        <button onClick={handleRead} style={{background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer'}}>
                            🔔
                        </button>
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -5, right: -5, 
                                background: 'red', color: 'white', borderRadius: '50%', 
                                fontSize: '10px', padding: '2px 6px'
                            }}>
                                {unreadCount}
                            </span>
                        )}

                        {/* Dropdown Thông báo */}
                        {showNoti && (
                            <div className="dropdown-menu" style={{width: '300px', right: -50}}>
                                <h4 style={{padding: '10px', borderBottom: '1px solid #eee', margin: 0, color: '#004aad'}}>Thông báo mới</h4>
                                {notifications.length === 0 ? <p style={{padding:10}}>Không có thông báo.</p> : (
                                    notifications.map(n => (
                                        <div key={n.NotiID} style={{padding: '10px', borderBottom: '1px solid #f0f0f0', background: n.IsRead ? 'white' : '#e8f0fe', fontSize: '13px'}}>
                                            {n.Message}
                                            <div style={{fontSize: '10px', color: '#888', marginTop: 3}}>
                                                {new Date(n.CreatedAt).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {user ? (
                    // Nếu ĐÃ đăng nhập
                    <div style={{position: 'relative'}}>
                        <button 
                            className="user-btn" 
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <span style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                👤 {user.fullName || user.username}
                            </span>
                            <span style={{fontSize: '10px'}}>▼</span>
                        </button>

                        {showDropdown && (
                            <div className="dropdown-menu">
                                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                    📄 Xem thông tin
                                </Link>
                                <Link to="/change-password" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                    🔒 Đổi mật khẩu
                                </Link>
                                <button className="dropdown-item logout" onClick={handleLogout}>
                                    🚪 Đăng xuất
                                </button>
                                
                            </div>
                        )}
                    </div>
                ) : (
                    // Nếu CHƯA đăng nhập
                    <Link to="/login" className="user-btn" style={{background: 'white', color: '#004aad'}}>
                        Đăng Nhập
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;