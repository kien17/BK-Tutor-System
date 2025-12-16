import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserDetail = () => {
    const { id } = useParams();
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

        axios.get(`http://localhost:5000/api/users/${id}`, {
            headers: { Authorization: token }
        })
        .then(res => setUser(res.data))
        .catch(() => alert("Không tìm thấy thông tin người dùng!"));
    }, [id, navigate]);

    if (!user)
        return (
            <div className="text-center mt-20 text-gray-500 text-lg">
                ⏳ Đang tải...
            </div>
        );

    const formattedDob = user.Dob ? new Date(user.Dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

    // Role màu sắc
    const roleColor = {
        admin: 'bg-red-100 text-red-700',
        student: 'bg-green-100 text-green-700',
        tutor: 'bg-blue-100 text-blue-700',
        pending: 'bg-purple-100 text-purple-700'
    }[user.Role] || 'bg-gray-100 text-gray-700';

    return (
        <div className="max-w-[700px] mx-auto my-10 p-6 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)]">

            

            <h2 className="text-2xl font-bold text-[#004aad] border-b pb-2 mb-6 flex items-center gap-2">
                Thông tin chi tiết: {user.FullName || user.Username}
            </h2>

            {/* Avatar + Role */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl">
                    👤
                </div>
                <span
                    className={`mt-2 px-4 py-1 rounded-full text-xs font-bold ${roleColor}`}
                >
                    {user.Role.toUpperCase()}
                </span>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-1 gap-4 text-gray-700">
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Mã số (ID):</span>
                    <span className="font-bold">{user.SchoolID || "---"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Họ và Tên:</span>
                    <span>{user.FullName || "---"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Email:</span>
                    <span>{user.Email || "---"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Ngày sinh:</span>
                    <span>{formattedDob}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Số điện thoại:</span>
                    <span>{user.Phone || "---"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Quê quán:</span>
                    <span>{user.Hometown || "---"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">CCCD:</span>
                    <span>{user.CitizenID || "---"}</span>
                </div>
            </div>
            {/* Header + Back + Edit */}
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                >
                    ⬅ Quay lại
                </button>

                {isAdmin && (
                    <button
                        onClick={() => navigate(`/admin/edit-user/${id}`)}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                    >
                        Sửa thông tin (Admin)
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserDetail;
