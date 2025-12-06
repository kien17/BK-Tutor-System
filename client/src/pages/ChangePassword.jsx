import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Kiểm tra xác nhận mật khẩu
        if (formData.newPassword !== formData.confirmPassword) {
            alert("❌ Mật khẩu mới và Xác nhận mật khẩu không khớp!");
            return;
        }

        // 2. Kiểm tra độ dài (Tùy chọn)
        if (formData.newPassword.length < 6) {
            alert("❌ Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // 3. Gọi API
            await axios.put('http://localhost:5000/api/change-password', {
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            }, {
                headers: { Authorization: token }
            });

            alert("✅ Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            
            // Đăng xuất và đá về trang Login
            localStorage.clear();
            window.location.href = '/login';

        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi đổi mật khẩu");
        }
    };

    return (
        <div className="login-container" style={{ marginTop: '50px' }}>
            <h2 style={{ color: '#004aad' }}>🔒 Đổi Mật Khẩu</h2>
            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                
                <div className="form-group">
                    <label>Mật khẩu cũ:</label>
                    <input 
                        type="password" 
                        name="oldPassword" 
                        value={formData.oldPassword} 
                        onChange={handleChange} 
                        required 
                        placeholder="Nhập mật khẩu hiện tại"
                    />
                </div>

                <div className="form-group">
                    <label>Mật khẩu mới:</label>
                    <input 
                        type="password" 
                        name="newPassword" 
                        value={formData.newPassword} 
                        onChange={handleChange} 
                        required 
                        placeholder="Nhập mật khẩu mới"
                    />
                </div>

                <div className="form-group">
                    <label>Xác nhận mật khẩu mới:</label>
                    <input 
                        type="password" 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        required 
                        placeholder="Nhập lại mật khẩu mới"
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" className="btn-primary">Xác nhận đổi</button>
                    <button 
                        type="button" 
                        onClick={() => navigate(-1)} // Quay lại trang trước đó
                        style={{ 
                            background: '#6c757d', color: 'white', padding: '12px', 
                            border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 0.5 
                        }}
                    >
                        Hủy
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ChangePassword;