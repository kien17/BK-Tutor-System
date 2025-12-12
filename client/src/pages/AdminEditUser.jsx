import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const AdminEditUser = () => {
    const { id } = useParams(); // Lấy ID người cần sửa từ URL
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        fullName: '',
        schoolId: '', // Admin được quyền sửa cả mã số
        phone: '',
        hometown: '',
        dob: '',
        citizenId: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        // Lấy thông tin hiện tại của user đó để điền vào form
        axios.get(`http://localhost:5000/api/users/${id}`, {
            headers: { Authorization: token }
        })
        .then(res => {
            const user = res.data;
            setFormData({
                fullName: user.FullName || '',
                schoolId: user.SchoolID || '',
                phone: user.Phone || '',
                hometown: user.Hometown || '',
                citizenId: user.CitizenID || '',
                dob: user.Dob ? user.Dob.split('T')[0] : ''
            });
        })
        .catch(err => alert("Không tìm thấy người dùng!"));
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            await axios.put(`http://localhost:5000/api/users/${id}`, formData, {
                headers: { Authorization: token }
            });
            alert("✅ Admin đã cập nhật thành công!");
            navigate(`/user/${id}`); // Quay về trang xem chi tiết user đó
        } catch (err) {
            alert("Lỗi khi cập nhật!");
            console.error(err);
        }
    };

    return (
        <div className="login-container" style={{maxWidth: '600px', marginTop: '40px'}}>
            <h2 style={{color: '#dc3545', borderBottom: '2px solid #eee', paddingBottom: '10px'}}>
                🛠 Admin: Sửa Thông Tin
            </h2>
            
            <form onSubmit={handleSubmit} style={{textAlign: 'left'}}>
                <div className="form-group">
                    <label>Mã số (ID Trường):</label>
                    <input name="schoolId" value={formData.schoolId} onChange={handleChange} style={{fontWeight: 'bold'}} />
                </div>

                <div className="form-group">
                    <label>Họ và tên:</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>Ngày sinh:</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Số điện thoại:</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Quê quán:</label>
                    <input name="hometown" value={formData.hometown} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Số CCCD:</label>
                    <input name="citizenId" value={formData.citizenId} onChange={handleChange} />
                </div>

                <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                    <button type="submit" className="btn-primary" style={{background: '#dc3545'}}>
                        Lưu thay đổi (Admin)
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate(-1)}
                        style={{background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1}}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminEditUser;