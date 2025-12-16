import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserManagementTab from '../components/admin/UserManagement';

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
        } catch {
            alert("Lỗi khi cập nhật");
        }
    };

    const resetPass = async (userId, username) => {
        if (!window.confirm(`Reset mật khẩu của "${username}" về mặc định "123456"?`)) return;
        try {
            await axios.put(`http://localhost:5000/api/users/${userId}/reset-pass`);
            alert(`✅ Mật khẩu mới: 123456`);
        } catch {
            alert("Lỗi khi reset password");
        }
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
        } catch {
            alert("Lỗi khi xóa người dùng");
        }
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
        } catch {
            alert("Lỗi khi reset");
        }
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
        <div className="max-w-[1200px] mx-auto my-8 p-6 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] font-sans">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-[22px] font-bold m-0">Admin Dashboard</h2>
                    <p className="text-sm text-gray-500 m-0">
                        Quản lý người dùng và hệ thống
                    </p>
                </div>

                <button
                    onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                    className="px-[14px] py-2 rounded-[10px] border bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100"
                >
                    Đăng xuất
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b mb-5">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-5 py-2 font-bold ${
                        activeTab === 'users'
                            ? 'border-b-4 border-red-500 text-red-500'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    Quản Lý Người Dùng
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`px-5 py-2 font-bold ${
                        activeTab === 'system'
                            ? 'border-b-4 border-red-500 text-red-500'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    Hệ Thống
                </button>
            </div>

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <UserManagementTab
                    users={filteredUsers}
                    loading={loading}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterRole={filterRole}
                    setFilterRole={setFilterRole}
                    onChangeRole={changeRole}
                    onResetPass={resetPass}
                    onDeleteUser={deleteUser}
                />
            )}


            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
                <div className="mt-6 p-10 text-center bg-red-50 border border-dashed border-red-500 rounded-xl">
                    <h3 className="text-red-600 text-xl font-bold mb-2">💀 Vùng Nguy Hiểm</h3>
                    <p className="mb-4">
                        Các tác vụ dưới đây sẽ ảnh hưởng toàn bộ dữ liệu của hệ thống.
                    </p>

                    <button
                        onClick={handleResetSemester}
                        className="px-8 py-4 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700"
                    >
                        ⚠️ RESET TOÀN BỘ DỮ LIỆU HỌC KỲ
                    </button>

                    <p className="text-xs text-gray-600 mt-3">
                        * Hành động này sẽ xóa sạch Lịch rảnh và Booking nhưng giữ lại Tài khoản người dùng.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
