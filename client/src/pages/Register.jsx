import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
    schoolId: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Kiểm tra mật khẩu khớp nhau
        if (formData.password !== formData.confirmPassword) {
            alert("❌ Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/register', {
            schoolId: formData.schoolId, 
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password
        });
            
            alert("✅ Đăng ký thành công! Vui lòng chờ Admin duyệt tài khoản.");
            navigate('/login'); // Chuyển về trang đăng nhập

        } catch (err) {
            alert(err.response?.data?.message || "Đăng ký thất bại");
        }
    };

    return (
        <div className="login-container">
            <h2 style={{color: '#28a745'}}>📝 Đăng Ký Tài Khoản</h2>
            <form onSubmit={handleRegister}>
                <div className="form-group">
                    <label>Mã số (SV/Tutor):</label>
                    <input 
                        type="text" name="schoolId" 
                        placeholder="VD: 2310001"
                        value={formData.schoolId} onChange={handleChange} required 
                        style={{fontWeight: 'bold', color: '#004aad'}}
                    />
                </div>
                
                <div className="form-group">
                    <label>Họ và tên:</label>
                    <input 
                        type="text" name="fullName" 
                        placeholder="Nhập họ tên đầy đủ..."
                        value={formData.fullName} onChange={handleChange} required 
                    />
                </div>

                <div className="form-group">
                    <label>Email:</label>
                    <input 
                        type="email" name="email" 
                        placeholder="Nhập email..."
                        value={formData.email} onChange={handleChange} required 
                    />
                </div>

                <div className="form-group">
                    <label>Mật khẩu:</label>
                    <input 
                        type="password" name="password" 
                        placeholder="Nhập mật khẩu..."
                        value={formData.password} onChange={handleChange} required 
                    />
                </div>

                <div className="form-group">
                    <label>Xác nhận mật khẩu:</label>
                    <input 
                        type="password" name="confirmPassword" 
                        placeholder="Nhập lại mật khẩu..."
                        value={formData.confirmPassword} onChange={handleChange} required 
                    />
                </div>

                <button type="submit" className="btn-primary" style={{background: '#28a745'}}>
                    Đăng Ký Ngay
                </button>

                <div style={{marginTop: '15px', fontSize: '14px'}}>
                    Đã có tài khoản? <Link to="/login" style={{color: '#004aad', fontWeight: 'bold'}}>Đăng nhập tại đây</Link>
                </div>
            </form>
        </div>
    );
};

export default Register;