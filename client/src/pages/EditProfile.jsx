import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
    const navigate = useNavigate();
    
    // State chứa dữ liệu form
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        hometown: '',
        dob: '',
        citizenId: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Lấy thông tin cũ để điền sẵn vào form
        axios.get('http://localhost:5000/api/profile', {
            headers: { Authorization: token }
        })
        .then(res => {
            const user = res.data;
            setFormData({
                fullName: user.FullName || '',
                phone: user.Phone || '',
                hometown: user.Hometown || '',
                citizenId: user.CitizenID || '',
                // Chuyển ngày từ SQL (YYYY-MM-DDTHH...) sang format của input (YYYY-MM-DD)
                dob: user.Dob ? user.Dob.split('T')[0] : '' 
            });
        })
        .catch(err => console.error(err));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            await axios.put('http://localhost:5000/api/profile', formData, {
                headers: { Authorization: token }
            });
            
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...currentUser, fullName: formData.fullName }; // Cập nhật tên mới vào bộ nhớ
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert("✅ Cập nhật thành công!");
            navigate('/profile'); // Quay về trang xem thông tin
        } catch (err) {
            alert("Lỗi khi cập nhật!");
            console.error(err);
        }
    };

    return (
        <div className="login-container" style={{maxWidth: '600px', marginTop: '40px'}}>
            <h2 style={{color: '#004aad', borderBottom: '2px solid #eee', paddingBottom: '10px'}}>
                ✏️ Chỉnh sửa thông tin
            </h2>
            
            <form onSubmit={handleSubmit} style={{textAlign: 'left'}}>
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
                    <button type="submit" className="btn-primary">Lưu thay đổi</button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/profile')}
                        style={{background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1}}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;