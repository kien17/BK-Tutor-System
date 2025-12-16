import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import logoImg from '../assets/logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNoti, setShowNoti] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.IsRead).length;

    const dropdownRef = useRef(null);
    const notiRef = useRef(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
    }, []);

    // Click ngoài để tắt dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (notiRef.current && !notiRef.current.contains(event.target)) {
                setShowNoti(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        if(window.confirm("Bạn có chắc muốn đăng xuất?")) {
            localStorage.clear();
            setUser(null);
            navigate('/login');
            window.location.reload();
        }
    };

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

    useEffect(() => {
        fetchNoti();
    }, [user]);

    const handleRead = async () => {
        setShowNoti(!showNoti);
        if (!showNoti && unreadCount > 0) {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/notifications/read', {}, { headers: {Authorization:token}});
            fetchNoti();
        }
    };

    // Định nghĩa menu giữa
    const menuItems = [
        { name: 'Đăng Ký Tư Vấn', path: '/student/booking', roles: ['student'] },
        { name: 'Lịch Dạy', path: '/tutor', roles: ['tutor'] },
        { name: 'Quản Trị', path: '/admin', roles: ['admin'] },
        { name: 'Phản hồi & Đánh giá', path: '/admin/reviews', roles: ['admin'] },
        { name: 'Kho Tài Liệu', path: '/documents', roles: ['student','tutor','admin'] },
    ];

    // Xác định tab active “dài nhất phù hợp”
    const activeItem = menuItems
        .filter(item => user && item.roles.includes(user.role))
        .reduce((prev, curr) => {
            if (location.pathname.startsWith(curr.path)) {
                return (!prev || curr.path.length > prev.path.length) ? curr : prev;
            }
            return prev;
        }, null);

    return (
        <nav className="bg-[#004aad] text-white px-6 py-3 flex items-center justify-between shadow-md">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
                <img src={logoImg} alt="BK Tutor Logo" className="h-10 w-auto"/>
                <span className="font-bold text-xl tracking-wide">BK Tutor</span>
            </Link>

            {/* Menu giữa */}
            <div className="flex gap-3 flex-wrap items-center">
                {menuItems.map((item) => {
                    if (!user || !item.roles.includes(user.role)) return null;
                    const isActive = activeItem?.name === item.name; // Chỉ tab dài nhất
                    return (
                        <Link 
                            key={item.name} 
                            to={item.path} 
                            className={`px-4 py-2 rounded-md transition duration-300 font-semibold 
                                ${isActive 
                                    ? 'bg-white text-gray-900 shadow-sm'  // Active: nền trắng nhạt + text tối + shadow nhẹ
                                    : 'hover:bg-gray-100 hover:text-gray-800' // Hover: nền xám nhạt + text hơi tối
                                }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Góc phải */}
            <div className="flex items-center gap-4 relative">

                {/* Thông báo */}
                {user && (
                    <div ref={notiRef} className="relative">
                        <button 
                            onClick={handleRead} 
                            className="text-2xl relative hover:text-yellow-300 transition"
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-2">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNoti && (
                            <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-xl shadow-lg overflow-hidden z-50">
                                <h4 className="px-4 py-2 bg-[#004aad] text-white font-semibold border-b">Thông báo mới</h4>
                                {notifications.length === 0 ? (
                                    <p className="p-4 text-center text-gray-500">Không có thông báo.</p>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n.NotiID} 
                                            className={`px-4 py-2 border-b text-sm ${n.IsRead ? 'bg-white' : 'bg-blue-50'}`}
                                        >
                                            {n.Message}
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(n.CreatedAt).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* User Dropdown */}
                {user ? (
                    <div ref={dropdownRef} className="relative">
                        <button 
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 px-3 py-1 bg-white text-[#004aad] rounded-full font-semibold hover:bg-gray-100 transition"
                        >
                            👤 <span className="max-w-[120px] truncate">{user.fullName || user.username}</span> ▼
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-xl shadow-lg overflow-hidden z-50">
                                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 " onClick={() => setShowDropdown(false)}>📄 Xem thông tin</Link>
                                <Link to="/change-password" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>🔒 Đổi mật khẩu</Link>
                                <button 
                                    onClick={handleLogout} 
                                    className="w-full text-left px-4 py-2 hover:bg-red-100"
                                >
                                    🚪 Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="px-4 py-2 bg-white text-[#004aad] font-semibold rounded-lg hover:bg-gray-100 transition">
                        Đăng Nhập
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
