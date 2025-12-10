import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Gọi API lấy thông tin
        axios.get('http://localhost:5000/api/profile', {
            headers: { Authorization: token } // Gửi token lên để server biết ai đang hỏi
        })
        .then(res => setProfile(res.data))
        .catch(err => console.error(err));
    }, []);

    if (!profile) return <div style={{textAlign:'center', marginTop: 50}}>⏳ Đang tải thông tin...</div>;

    // Format ngày sinh cho đẹp (bỏ phần giờ phút)
    const formattedDob = profile.Dob ? new Date(profile.Dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

    return (
        <div className="dashboard-container" style={{maxWidth: '600px'}}>
            <h2 style={{borderBottom: '2px solid #004aad', paddingBottom: '10px', marginBottom: '20px'}}>
                📄 Hồ Sơ Cá Nhân
            </h2>

            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                
                {/* Ảnh đại diện giả lập */}
                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                    <div style={{
                        width: '100px', height: '100px', background: '#ddd', borderRadius: '50%', 
                        margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '40px'
                    }}>
                        👤
                    </div>
                    <h3 style={{marginTop: '10px', color: '#004aad'}}>{profile.FullName || profile.Username}</h3>
                    <span className={`role-badge role-${profile.Role}`}>{profile.Role.toUpperCase()}</span>
                </div>

                {/* Bảng thông tin chi tiết */}
                <table style={{marginTop: 0}}>
                    <tbody>
                        <tr>
                            <td><strong>Mã số (ID):</strong></td>
                            <td style={{fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold'}}>
                                {profile.SchoolID || "Chưa cấp"}
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Email:</strong></td>
                            <td>{profile.Email}</td>
                        </tr>
                        <tr>
                            <td><strong>Mật khẩu:</strong></td>
                            <td>******** (Đã mã hóa)</td> 
                        </tr>
                        <tr>
                            <td><strong>Họ và tên:</strong></td>
                            <td>{profile.FullName || "Chưa cập nhật"}</td>
                        </tr>
                        <tr>
                            <td><strong>Ngày sinh:</strong></td>
                            <td>{formattedDob}</td>
                        </tr>
                        <tr>
                            <td><strong>Số điện thoại:</strong></td>
                            <td>{profile.Phone || "Chưa cập nhật"}</td>
                        </tr>
                        <tr>
                            <td><strong>Quê quán:</strong></td>
                            <td>{profile.Hometown || "Chưa cập nhật"}</td>
                        </tr>
                        <tr>
                            <td><strong>Số Căn Cước (CCCD):</strong></td>
                            <td>{profile.CitizenID || "Chưa cập nhật"}</td>
                        </tr>
                    </tbody>
                </table>
                
                <button 
                    onClick={() => navigate('/edit-profile')} 
                    className="btn-primary" 
                    style={{marginTop: '20px', background: '#004aad'}}
                >
                    ✏️ Chỉnh sửa thông tin
                </button>
            </div>
        </div>
    );
};

export default Profile;