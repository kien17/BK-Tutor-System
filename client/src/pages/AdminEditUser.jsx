import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const AdminEditUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        schoolId: '',
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
        .catch(() => alert("Không tìm thấy người dùng!"));
    }, [id, navigate]);

    const handleChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            await axios.put(
                `http://localhost:5000/api/users/${id}`,
                formData,
                { headers: { Authorization: token } }
            );
            alert("✅ Admin đã cập nhật thành công!");
            navigate(`/user/${id}`);
        } catch {
            alert("Lỗi khi cập nhật!");
        }
    };

    return (
        <div className="max-w-[700px] mx-auto my-10 p-6 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)]">

            {/* Header */}
            <div className="mb-6 border-b pb-3">
                <h2 className="text-[22px] font-bold text-red-600 flex items-center gap-2">
                    🛠 Admin – Sửa Thông Tin Người Dùng
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Chỉnh sửa thông tin cá nhân của người dùng trong hệ thống
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Mã số */}
                <div>
                    <label className="block text-sm font-semibold mb-1">
                        Mã số (ID Trường)
                    </label>
                    <input
                        name="schoolId"
                        value={formData.schoolId}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 font-bold
                                   focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>

                {/* Họ tên */}
                <div>
                    <label className="block text-sm font-semibold mb-1">
                        Họ và tên
                    </label>
                    <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300
                                   focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>

                {/* Ngày sinh */}
                <div>
                    <label className="block text-sm font-semibold mb-1">
                        Ngày sinh
                    </label>
                    <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300
                                   focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>

                {/* SĐT */}
                <div>
                    <label className="block text-sm font-semibold mb-1">
                        Số điện thoại
                    </label>
                    <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300
                                   focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>

                {/* Quê quán */}
                <div>
                    <label className="block text-sm font-semibold mb-1">
                        Quê quán
                    </label>
                    <input
                        name="hometown"
                        value={formData.hometown}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300
                                   focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>

                {/* CCCD */}
                <div>
                    <label className="block text-sm font-semibold mb-1">
                        Số CCCD
                    </label>
                    <input
                        name="citizenId"
                        value={formData.citizenId}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300
                                   focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        className="flex-1 py-3 rounded-lg bg-red-600 text-white font-bold
                                   hover:bg-red-700 transition"
                    >
                        💾 Lưu thay đổi
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-bold
                                   hover:bg-gray-300 transition"
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminEditUser;
