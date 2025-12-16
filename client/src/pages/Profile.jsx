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

        axios.get('http://localhost:5000/api/profile', {
            headers: { Authorization: token }
        })
        .then(res => setProfile(res.data))
        .catch(err => console.error(err));
    }, [navigate]);

    if (!profile)
        return <div className="text-center mt-20 text-gray-500 text-lg">⏳ Đang tải thông tin...</div>;

    const formattedDob = profile.Dob ? new Date(profile.Dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

    // Màu role
    const roleColor = {
        admin: 'bg-red-100 text-red-700',
        student: 'bg-green-100 text-green-700',
        tutor: 'bg-blue-100 text-blue-700',
        pending: 'bg-purple-100 text-purple-700'
    }[profile.Role] || 'bg-gray-100 text-gray-700';

    return (
        <div className="max-w-[700px] mx-auto my-10 p-6 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)]">

            {/* Header */}
            <h2 className="text-2xl font-bold text-[#004aad] border-b pb-2 mb-6 flex items-center gap-2">
                Hồ sơ cá nhân
            </h2>

            {/* Avatar + Role */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl">
                    👤
                </div>
                <h3 className="mt-2 text-xl font-bold text-[#004aad]">
                    {profile.FullName || profile.Username}
                </h3>
                <span className={`mt-2 px-4 py-1 rounded-full text-xs font-bold ${roleColor}`}>
                    {profile.Role.toUpperCase()}
                </span>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-1 gap-4 text-gray-700">
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Mã số (ID):</span>
                    <span className="font-bold">{profile.SchoolID || "Chưa cấp"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Email:</span>
                    <span>{profile.Email || "---"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Mật khẩu:</span>
                    <span>******** (Đã mã hóa)</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Họ và tên:</span>
                    <span>{profile.FullName || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Ngày sinh:</span>
                    <span>{formattedDob}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Số điện thoại:</span>
                    <span>{profile.Phone || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Quê quán:</span>
                    <span>{profile.Hometown || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">Số Căn Cước (CCCD):</span>
                    <span>{profile.CitizenID || "Chưa cập nhật"}</span>
                </div>
            </div>

            {/* Nút chỉnh sửa */}
            <div className="flex justify-center mt-6">
                <button
                    onClick={() => navigate('/edit-profile')}
                    className="px-6 py-3 bg-[#004aad] text-white font-bold rounded-lg hover:bg-blue-700"
                >
                    Chỉnh sửa thông tin
                </button>
            </div>
        </div>
    );
};

export default Profile;
