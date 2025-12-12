import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [activeTab, setActiveTab] = useState('users'); // Tab hiện tại
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!token || !user || user.role !== 'admin') {
            alert("⛔ CẢNH BÁO: Bạn không có quyền truy cập trang Quản Trị!");
            navigate('/login');
            return;
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users', {
                headers: { Authorization: token }
            });
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // --- CÁC HÀM XỬ LÝ USER ---

    const changeRole = async (userId, newRole) => {
        if (!window.confirm(`Bạn chắc chắn muốn chuyển người này thành ${newRole}?`)) return;
        try {
            await axios.put(`http://localhost:5000/api/users/${userId}/role`, { role: newRole });
            alert("✅ Đã cập nhật quyền thành công!");
            fetchUsers();
        } catch (err) { alert("Lỗi khi cập nhật"); }
    };

    const resetPass = async (userId, username) => {
        if (!window.confirm(`Reset mật khẩu của "${username}" về mặc định "123456"?`)) return;
        try {
            await axios.put(`http://localhost:5000/api/users/${userId}/reset-pass`);
            alert(`✅ Xong! Mật khẩu mới là: 123456`);
        } catch (err) { alert("Lỗi khi reset password"); }
    };

    const deleteUser = async (userId, username) => {
        const confirmMsg = `⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN user "${username}"?\n\nTất cả tài liệu và lịch sử của người này cũng sẽ bị xóa theo!`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/users/${userId}`, {
                headers: { Authorization: token }
            });
            alert("✅ Đã xóa thành công!");
            fetchUsers();
        } catch (err) { alert("Lỗi khi xóa người dùng"); }
    };

    // --- CÁC HÀM HỆ THỐNG ---

    const handleResetSemester = async () => {
        if (!window.confirm("⚠️ CẢNH BÁO NGUY HIỂM!\n\nBạn có chắc muốn RESET HỌC KỲ không?\nHành động này sẽ XÓA SẠCH toàn bộ:\n- Lịch rảnh của tất cả Tutor\n- Tất cả buổi hẹn/phỏng vấn đã tạo\n\nKhông thể khôi phục lại được!")) {
            return;
        }
        const check = prompt("Để xác nhận, hãy nhập chữ 'RESET' vào ô bên dưới:");
        if (check !== 'RESET') return alert("Hủy thao tác.");

        try {
            const token = localStorage.getItem('token');
            await axios.delete('http://localhost:5000/api/admin/reset-semester', {
                headers: { Authorization: token }
            });
            alert("✅ Đã Reset thành công! Hệ thống đã trắng trơn.");
            fetchUsers(); 
        } catch (err) { alert("Lỗi khi reset"); }
    };

    // --- LOGIC LỌC DANH SÁCH ---
    const filteredUsers = users.filter(user => {
        const matchSearch = 
            (user.FullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.SchoolID || '').includes(searchTerm);
        const matchRole = filterRole === 'all' || user.Role === filterRole;
        return matchSearch && matchRole;
    });

    return (
        <div className="dashboard-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                <h2 style={{color: '#dc3545'}}>🛠 Admin Dashboard</h2>
                <button 
                    onClick={() => { localStorage.clear(); window.location.href='/login'; }} 
                    style={{padding:'8px 16px', background:'#6c757d', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}
                >
                    Đăng Xuất
                </button>
            </div>

            {/* THANH TAB */}
            <div style={{marginBottom: 20, borderBottom: '1px solid #ddd', display: 'flex', gap: 10}}>
                <button onClick={() => setActiveTab('users')} style={getTabStyle(activeTab === 'users')}>👥 Quản Lý Người Dùng</button>
                <button onClick={() => setActiveTab('system')} style={getTabStyle(activeTab === 'system')}>⚙️ Hệ Thống</button>
            </div>

            {/* --- TAB 1: QUẢN LÝ USER --- */}
            {activeTab === 'users' && (
                <>
                    {/* Công cụ tìm kiếm & lọc */}
                    <div style={{display: 'flex', gap: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', flexWrap: 'wrap'}}>
                        <div style={{flex: 1, minWidth: '200px'}}>
                            <input 
                                type="text" placeholder="🔍 Tìm theo Tên, Email, Mã số..." 
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px'}}
                            />
                        </div>
                        <div style={{minWidth: '200px'}}>
                            <select 
                                value={filterRole} onChange={e => setFilterRole(e.target.value)}
                                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold', color: '#004aad'}}
                            >
                                <option value="all">-- Tất cả vai trò --</option>
                                <option value="student">🟢 Sinh viên</option>
                                <option value="tutor">🔵 Tutor (Giáo viên)</option>
                                <option value="admin">🔴 Admin</option>
                                <option value="pending">⏳ Đang đăng ký</option>
                            </select>
                        </div>
                    </div>

                    {/* Bảng dữ liệu */}
                    {loading ? <p>Đang tải...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã số (ID)</th>
                                    <th>Họ và Tên (Click xem)</th>
                                    <th>Email</th>
                                    <th>Vai trò</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                    <tr key={user.UserID}>
                                        <td style={{fontFamily:'monospace', fontWeight:'bold'}}>{user.SchoolID || "---"}</td>
                                        <td>
                                            <span 
                                                onClick={() => navigate(`/user/${user.UserID}`)}
                                                style={{color:'#004aad', fontWeight:'bold', cursor:'pointer', textDecoration:'underline'}}
                                                title="Xem chi tiết"
                                            >
                                                {user.FullName || user.Username}
                                            </span>
                                        </td>
                                        <td>{user.Email}</td>
                                        <td>
                                            <span className={`role-badge role-${user.Role}`}>
                                                {user.Role === 'pending' ? 'CHỜ DUYỆT' : user.Role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                                                {user.Role === 'pending' && (
                                                    <>
                                                        <button className="action-btn" style={{background:'#28a745'}} onClick={() => changeRole(user.UserID, 'student')}>✅ Duyệt SV</button>
                                                        <button className="action-btn" style={{background:'#007bff'}} onClick={() => changeRole(user.UserID, 'tutor')}>✅ Duyệt Tutor</button>
                                                    </>
                                                )}
                                                {user.Role === 'student' && (
                                                    <button className="action-btn btn-promote" onClick={() => changeRole(user.UserID, 'tutor')}>🔼 Lên Tutor</button>
                                                )}
                                                {user.Role === 'tutor' && (
                                                    <button className="action-btn btn-demote" onClick={() => changeRole(user.UserID, 'student')}>🔽 Xuống SV</button>
                                                )}
                                                
                                                <button className="action-btn btn-reset" onClick={() => resetPass(user.UserID, user.Username)}>🔑 Reset</button>
                                                
                                                <button 
                                                    className="action-btn" 
                                                    onClick={() => deleteUser(user.UserID, user.Username)}
                                                    style={{background: '#343a40', color: '#fff'}}
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    🗑 Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" style={{textAlign:'center', padding:'20px', color:'#888'}}>🚫 Không tìm thấy kết quả.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {/* --- TAB 2: HỆ THỐNG --- */}
            {activeTab === 'system' && (
                <div style={{padding: 40, textAlign: 'center', background: '#fff5f5', borderRadius: 8, border: '1px dashed #dc3545', marginTop: 20}}>
                    <h3 style={{color: '#dc3545'}}>💀 Vùng Nguy Hiểm (Danger Zone)</h3>
                    <p>Các tác vụ dưới đây sẽ ảnh hưởng toàn bộ dữ liệu của hệ thống. Hãy cân nhắc kỹ trước khi bấm!</p>
                    
                    <button 
                        onClick={handleResetSemester}
                        style={{
                            padding:'15px 30px', fontSize: '16px', fontWeight: 'bold',
                            background:'#dc3545', color:'white', border:'none', borderRadius:'8px', cursor:'pointer',
                            boxShadow: '0 4px 10px rgba(220, 53, 69, 0.3)'
                        }}
                    >
                        ⚠️ RESET TOÀN BỘ DỮ LIỆU HỌC KỲ
                    </button>
                    <p style={{fontSize: 12, color: '#666', marginTop: 10}}>* Hành động này sẽ xóa sạch Lịch rảnh và Booking, nhưng giữ lại Tài khoản người dùng.</p>
                </div>
            )}
        </div>
    );
};

// Style cho Tab
const getTabStyle = (isActive) => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
    background: isActive ? '#eee' : 'white',
    borderBottom: isActive ? '3px solid #dc3545' : 'none',
    color: isActive ? '#dc3545' : '#333'
});

export default AdminDashboard;