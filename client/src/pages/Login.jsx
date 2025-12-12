import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/login', { email, password });
            
            // Lưu thông tin user vào bộ nhớ trình duyệt
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            alert(`Đăng nhập thành công! Xin chào ${res.data.user.role}`);
            
            // Chuyển hướng dựa trên Role (Logic phân quyền sơ khai)
            if (res.data.user.role === 'admin') {
                window.location.href = '/admin';
            } else if (res.data.user.role === 'tutor') {
                window.location.href = '/tutor';
            } else {
                window.location.href = '/student';
            }

        } catch (err) {
            alert(err.response?.data?.message || "Đăng nhập thất bại");
        }
    };

    return (
        <div className="login-container">
            <h2>🎓 Đăng Nhập BK Tutor</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Email:</label>
                    <input 
                        type="email" 
                        placeholder="Nhập email trường..."
                        value={email} onChange={e => setEmail(e.target.value)} 
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Mật khẩu:</label>
                    <input 
                        type="password" 
                        placeholder="Nhập mật khẩu..."
                        value={password} onChange={e => setPassword(e.target.value)} 
                        required
                    />
                </div>
                <button type="submit" className="btn-primary">
                    Đăng Nhập Ngay
                </button>

                <div style={{marginTop: '15px', fontSize: '14px'}}>
                    Chưa có tài khoản? <Link to="/register" style={{color: '#28a745', fontWeight: 'bold'}}>Đăng ký ngay</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;