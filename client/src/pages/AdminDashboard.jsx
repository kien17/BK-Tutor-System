import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [activeTab, setActiveTab] = useState('users');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!token || !user || user.role !== 'admin') {
            alert("⛔ Bạn không có quyền truy cập trang Quản Trị!");
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

    const changeRole = async (userId, newRole) => {
        if (!window.confirm(`Bạn chắc chắn muốn chuyển người này thành ${newRole}?`)) return;
        try {
            await axios.put(`http://localhost:5000/api/users/${userId}/role`, { role: newRole });
            alert("✅ Cập nhật quyền thành công!");
            fetchUsers();
        } catch (err) { alert("Lỗi khi cập nhật"); }
    };

    const resetPass = async (userId, username) => {
        if (!window.confirm(`Reset mật khẩu của "${username}" về mặc định "123456"?`)) return;
        try {
            await axios.put(`http://localhost:5000/api/users/${userId}/reset-pass`);
            alert(`✅ Mật khẩu mới: 123456`);
        } catch (err) { alert("Lỗi khi reset password"); }
    };

    const deleteUser = async (userId, username) => {
        const confirmMsg = `⚠️ Bạn có chắc muốn XÓA VĨNH VIỄN user "${username}"?`;
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

    const handleResetSemester = async () => {
        if (!window.confirm("⚠️ RESET HỌC KỲ sẽ xóa toàn bộ lịch rảnh và booking!")) return;
        const check = prompt("Nhập chữ 'RESET' để xác nhận:");
        if (check !== 'RESET') return alert("Hủy thao tác.");

        try {
            const token = localStorage.getItem('token');
            await axios.delete('http://localhost:5000/api/admin/reset-semester', {
                headers: { Authorization: token }
            });
            alert("✅ Đã reset thành công!");
            fetchUsers(); 
        } catch (err) { alert("Lỗi khi reset"); }
    };

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
        <div style={{
            maxWidth: 1200,
            margin: '20px auto',
            padding: 20,
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#fff', // <-- nền trắng
            borderRadius: 10,         // tuỳ chọn để bo góc
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)' // tuỳ chọn để nổi bật

        }}>
            {/* Header */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                <h2 style={{color: '#dc3545'}}>🛠 Admin Dashboard</h2>
                <button 
                    onClick={() => { localStorage.clear(); window.location.href='/login'; }} 
                    style={{
                        padding:'8px 16px',
                        background:'#6c757d',
                        color:'white',
                        border:'none',
                        borderRadius:6,
                        cursor:'pointer',
                        fontWeight:600
                    }}
                >
                    Đăng Xuất
                </button>
            </div>

            {/* Tabs */}
            <div style={{marginBottom: 20, borderBottom: '1px solid #ddd', display: 'flex', gap: 10}}>
                <button onClick={() => setActiveTab('users')} style={getTabStyle(activeTab === 'users')}>👥 Quản Lý Người Dùng</button>
                <button onClick={() => setActiveTab('system')} style={getTabStyle(activeTab === 'system')}>⚙️ Hệ Thống</button>
            </div>

            {/* Tab Users */}
            {activeTab === 'users' && (
                <>
                    {/* Search & Filter */}
                    <div style={{
                        display: 'flex', gap: 15, flexWrap:'wrap', background:'#f8f9fa',
                        padding: 15, borderRadius:10, marginBottom:20, alignItems:'center'
                    }}>
                        <input 
                            type="text"
                            placeholder="🔍 Tìm theo Tên, Email, Mã số..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{flex:1, minWidth:200, padding:10, border:'1px solid #ccc', borderRadius:6}}
                        />
                        <select 
                            value={filterRole} onChange={e => setFilterRole(e.target.value)}
                            style={{minWidth:200, padding:10, border:'1px solid #ccc', borderRadius:6, fontWeight:'bold', color:'#004aad'}}
                        >
                            <option value="all">-- Tất cả vai trò --</option>
                            <option value="student">🟢 Sinh viên</option>
                            <option value="tutor">🔵 Tutor</option>
                            <option value="admin">🔴 Admin</option>
                            <option value="pending">⏳ Đang đăng ký</option>
                        </select>
                    </div>

                    {/* Table */}
                    {loading ? <p>Đang tải...</p> : (
                        <div style={{overflowX:'auto'}}>
                            <table style={{width:'100%', borderCollapse:'collapse', minWidth:700}}>
                                <thead>
                                    <tr style={{background:'#004aad', color:'white'}}>
                                        <th style={thStyle}>Mã số (ID)</th>
                                        <th style={thStyle}>Họ và Tên</th>
                                        <th style={thStyle}>Email</th>
                                        <th style={thStyle}>Vai trò</th>
                                        <th style={thStyle}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length ? filteredUsers.map(user => (
                                        <tr key={user.UserID} style={{background:'#fff'}}>
                                            <td style={tdStyle}>{user.SchoolID || "---"}</td>
                                            <td style={tdStyle}>
                                                <span onClick={() => navigate(`/user/${user.UserID}`)}
                                                    style={{color:'#004aad', fontWeight:600, cursor:'pointer', textDecoration:'underline'}}>
                                                    {user.FullName || user.Username}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>{user.Email}</td>
                                            <td style={tdStyle}>
                                                <span className={`role-badge role-${user.Role}`} style={{
                                                    padding:'4px 8px', borderRadius:6, color:'#fff', fontWeight:600,
                                                    background: user.Role==='pending'? '#6f42c1' :
                                                               user.Role==='student'? '#28a745' :
                                                               user.Role==='tutor'? '#007bff' :
                                                               '#dc3545'
                                                }}>
                                                    {user.Role==='pending'? 'CHỜ DUYỆT' : user.Role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                                                    {user.Role==='pending' && <>
                                                        <button style={actionBtnStyle('#28a745')} onClick={()=>changeRole(user.UserID,'student')}>✅ Duyệt SV</button>
                                                        <button style={actionBtnStyle('#007bff')} onClick={()=>changeRole(user.UserID,'tutor')}>✅ Duyệt Tutor</button>
                                                    </>}
                                                    {user.Role==='student' && <button style={actionBtnStyle('#007bff')} onClick={()=>changeRole(user.UserID,'tutor')}>🔼 Lên Tutor</button>}
                                                    {user.Role==='tutor' && <button style={actionBtnStyle('#28a745')} onClick={()=>changeRole(user.UserID,'student')}>🔽 Xuống SV</button>}
                                                    <button style={actionBtnStyle('#6c757d')} onClick={()=>resetPass(user.UserID, user.Username)}>🔑 Reset</button>
                                                    <button style={actionBtnStyle('#343a40')} onClick={()=>deleteUser(user.UserID, user.Username)}>🗑 Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{textAlign:'center', padding:20, color:'#888'}}>🚫 Không tìm thấy kết quả</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Tab System */}
            {activeTab === 'system' && (
                <div style={{
                    padding: 40, textAlign:'center', background:'#fff5f5', borderRadius:10, border:'1px dashed #dc3545',
                    marginTop:20
                }}>
                    <h3 style={{color:'#dc3545'}}>💀 Vùng Nguy Hiểm</h3>
                    <p>Các tác vụ dưới đây sẽ ảnh hưởng toàn bộ dữ liệu của hệ thống.</p>
                    <button onClick={handleResetSemester} style={{
                        padding:'15px 30px', fontSize:16, fontWeight:'bold',
                        background:'#dc3545', color:'#fff', border:'none', borderRadius:8, cursor:'pointer',
                        boxShadow:'0 4px 10px rgba(220,53,69,0.3)'
                    }}>⚠️ RESET TOÀN BỘ DỮ LIỆU HỌC KỲ</button>
                    <p style={{fontSize:12,color:'#666', marginTop:10}}>* Hành động này sẽ xóa sạch Lịch rảnh và Booking nhưng giữ lại Tài khoản người dùng.</p>
                </div>
            )}
        </div>
    );
};

// Styles
const getTabStyle = (isActive) => ({
    padding:'10px 20px',
    border:'none',
    cursor:'pointer',
    fontWeight:'bold',
    background:isActive?'#eee':'white',
    borderBottom:isActive?'3px solid #dc3545':'none',
    color:isActive?'#dc3545':'#333'
});

const thStyle = {padding:12, textAlign:'left'};
const tdStyle = {padding:12, verticalAlign:'middle', fontSize:14};
const actionBtnStyle = (bgColor) => ({
    background:bgColor,
    color:'#fff',
    border:'none',
    borderRadius:6,
    padding:'6px 12px',
    cursor:'pointer',
    fontWeight:600,
    fontSize:13
});

export default AdminDashboard;
