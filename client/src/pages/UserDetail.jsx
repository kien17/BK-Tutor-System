import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

const UserDetail = () => {
    const { id } = useParams(); // Lấy ID từ URL (ví dụ: /user/5)
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = currentUser && currentUser.role === 'admin';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Gọi API lấy thông tin người dùng cụ thể
        axios.get(`http://localhost:5000/api/users/${id}`, {
            headers: { Authorization: token }
        })
        .then(res => setUser(res.data))
        .catch(err => alert("Không tìm thấy thông tin người dùng!"));
    }, [id]);

    if (!user) return <div style={{textAlign:'center', marginTop: 50}}>⏳ Đang tải...</div>;

    const formattedDob = user.Dob ? new Date(user.Dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

    return (
        <div className="dashboard-container" style={{maxWidth: '600px'}}>
            <button onClick={() => navigate('/admin')} style={{marginBottom: '15px', cursor: 'pointer', padding: '5px 10px'}}>
                ⬅ Quay lại
            </button>

            {/* NÚT SỬA CHỈ HIỆN VỚI ADMIN */}
            {isAdmin && (
                    <button 
                        onClick={() => navigate(`/admin/edit-user/${id}`)}
                        style={{
                            background: '#dc3545', color: 'white', border: 'none', 
                            padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        ✏️ Sửa thông tin (Admin)
                    </button>
                )}
            
            <h2 style={{borderBottom: '2px solid #004aad', paddingBottom: '10px', marginBottom: '20px'}}>
                📄 Thông tin chi tiết: {user.FullName || user.Username}
            </h2>

            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                    <div style={{
                        width: '80px', height: '80px', background: '#ddd', borderRadius: '50%', 
                        margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '30px'
                    }}>
                        👤
                    </div>
                    <span className={`role-badge role-${user.Role}`} style={{marginTop: '10px', display: 'inline-block'}}>
                        {user.Role.toUpperCase()}
                    </span>
                </div>

                <table style={{marginTop: 0}}>
                    <tbody>
                        <tr><td><strong>ID Hệ thống:</strong></td><td>#{user.UserID}</td></tr>
                        <tr><td><strong>Mã số (ID):</strong></td><td style={{fontWeight: 'bold'}}>{user.SchoolID || "---"}</td></tr>
                        <tr><td><strong>Họ và Tên:</strong></td><td>{user.FullName || "---"}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>{user.Email}</td></tr>
                        <tr><td><strong>Ngày sinh:</strong></td><td>{formattedDob}</td></tr>
                        <tr><td><strong>SĐT:</strong></td><td>{user.Phone || "---"}</td></tr>
                        <tr><td><strong>Quê quán:</strong></td><td>{user.Hometown || "---"}</td></tr>
                        <tr><td><strong>CCCD:</strong></td><td>{user.CitizenID || "---"}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserDetail;