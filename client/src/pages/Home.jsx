import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    // Thêm state để lưu trạng thái đăng nhập
    const [isLoggedIn, setIsLoggedIn] = useState(false); 

    useEffect(() => {
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token); // !!token sẽ trả về true nếu token tồn tại (user đã đăng nhập)
    }, []);

    return (
        <div style={{fontFamily: 'Segoe UI, sans-serif'}}>
            {/* --- HERO SECTION (Ảnh Bìa) --- */}
            <div style={{
                backgroundImage: 'url("https://scontent.fsgn13-1.fna.fbcdn.net/v/t39.30808-6/544809441_1084775863842398_5319943524332361704_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEr4toit3I9VsuRgrkzeVS8xMbFWjHSs__ExsVaMdKz_8cTo65BBRx3I2H7YoVjdbVT75EVbhAEXVpnGaYo4kFT&_nc_ohc=-v8AloVNe8gQ7kNvwEG_3Zf&_nc_oc=AdnyvB7brD8pTv1SbVhwAlUTbVHK2KaFaRfk6_QtJJohsXlazVS3TImjeg4prleT5Lg&_nc_zt=23&_nc_ht=scontent.fsgn13-1.fna&_nc_gid=-1erfFzF4vHQqi3B3AV8ig&oh=00_AfmRbLaiDlrnkHjGIrrQ4Hhx-fvZbQY5G_ACiIQS5h5q1Q&oe=693A3125")', // Link ảnh BK (ví dụ)
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                {/* Lớp phủ màu đen mờ */}
                <div style={{position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)'}}></div>
                
                <div style={{position:'relative', zIndex:1, textAlign:'center', color:'white', padding: '0 20px'}}>
                    <h1 style={{fontSize: '48px', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                        HỆ THỐNG BK TUTOR
                    </h1>
                    <p style={{fontSize: '20px', maxWidth: '700px', margin: '0 auto 30px'}}>
                        Kết nối Sinh viên và Giảng viên - Đặt lịch tư vấn - Tra cứu tài liệu học tập
                        chất lượng cao tại Đại học Bách Khoa.
                    </p>
                    
                    {/* --- ĐIỀU KIỆN MỚI: CHỈ HIỆN NÚT NẾU CHƯA ĐĂNG NHẬP --- */}
                    {!isLoggedIn && (
                        <button 
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '15px 40px', fontSize: '18px', fontWeight: 'bold',
                                background: '#004aad', color: 'white', border: 'none', borderRadius: '30px',
                                cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,74,173,0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.target.style.transform = 'scale(1)'}
                        >
                            BẮT ĐẦU NGAY 🚀
                        </button>
                    )}
                    {/* ---------------------------------------------------- */}
                </div>
            </div>

            {/* --- INFO SECTION (Thông tin) --- */}
            <div style={{maxWidth: '1200px', margin: '50px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px'}}>
                
                <div style={cardStyle}>
                    <div style={iconStyle}>📅</div>
                    <h3 style={{color: '#004aad'}}>Đặt Lịch Linh Hoạt</h3>
                    <p style={{color: '#555', lineHeight: '1.6'}}>
                        Sinh viên dễ dàng xem thời khóa biểu rảnh của giảng viên và đặt lịch hẹn tư vấn Online hoặc Offline chỉ với vài cú click.
                    </p>
                </div>

                <div style={cardStyle}>
                    <div style={iconStyle}>📚</div>
                    <h3 style={{color: '#004aad'}}>Kho Tài Liệu Số</h3>
                    <p style={{color: '#555', lineHeight: '1.6'}}>
                        Truy cập hàng ngàn đề thi, bài giảng và tài liệu tham khảo được chia sẻ chính thức từ đội ngũ Tutor và Giảng viên.
                    </p>
                </div>

                <div style={cardStyle}>
                    <div style={iconStyle}>🔔</div>
                    <h3 style={{color: '#004aad'}}>Thông Báo Tức Thời</h3>
                    <p style={{color: '#555', lineHeight: '1.6'}}>
                        Nhận thông báo ngay lập tức khi lịch hẹn được duyệt, thay đổi địa điểm hoặc khi có tài liệu mới liên quan đến môn học.
                    </p>
                </div>

            </div>

            {/* --- FOOTER --- */}
            <div style={{background: '#333', color: 'white', padding: '20px', textAlign: 'center', marginTop: '50px'}}>
                <p>&copy; 2025 BK Tutor System - Ho Chi Minh City University of Technology</p>
            </div>
        </div>
    );
};

// CSS phụ trợ (Giữ nguyên)
const cardStyle = {
    background: 'white', padding: '30px', borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center',
    transition: 'transform 0.3s'
};

const iconStyle = {
    fontSize: '50px', marginBottom: '20px'
};

export default Home;