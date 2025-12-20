import { useNavigate } from 'react-router-dom';

const UserManagementTab = ({
    users,
    loading,
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    onChangeRole,
    onResetPass,
    onDeleteUser,
}) => {
    const navigate = useNavigate();

    return (
        <>
            {/* Search & Filter */}
            <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border mb-5">
                <input
                    type="text"
                    placeholder="Tìm theo tên, email, mã số..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[220px] px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm bg-white"
                >
                    <option value="all">Tất cả vai trò</option>
                    <option value="student">Student</option>
                    <option value="tutor">Tutor</option>
                    <option value="admin">Admin</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                        <tr className="bg-[#004aad] text-white">
                            <th className="p-3 text-center">Mã số (ID)</th>
                            <th className="p-3 text-center">Họ và Tên</th>
                            <th className="p-3 text-center">Email</th>
                            <th className="p-3 text-center">Vai trò</th>
                            <th className="p-3 text-center">Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-6 text-center">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : users.length ? (
                            users.map(user => (
                                <tr key={user.UserID} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-center">
                                        {user.SchoolID || '---'}
                                    </td>

                                    <td className="p-3 text-center">
                                        <span
                                            onClick={() => navigate(`/user/${user.UserID}`)}
                                            className="text-[#004aad] font-semibold underline cursor-pointer"
                                        >
                                            {user.FullName || user.Username}
                                        </span>
                                    </td>

                                    <td className="p-3 text-center truncate max-w-[220px]" title={user.Email}>
                                        {user.Email}
                                    </td>

                                    <td className="p-3 text-center">
                                        <div className="flex justify-center">

                                            {/* ===== ADMIN: khóa, không cho chọn ===== */}
                                            {user.Role === 'admin' ? (
                                                <span
                                                    className="
                                                        px-3 py-1 rounded-full
                                                        text-xs font-bold
                                                        bg-red-100 text-red-700
                                                        cursor-not-allowed
                                                    "
                                                >
                                                    Admin
                                                </span>
                                            ) : (
                                                <select
                                                    value={user.Role === 'pending' ? '' : user.Role}
                                                    onChange={e => onChangeRole(user.UserID, e.target.value)}
                                                    className={`
                                                        px-3 py-1
                                                        rounded-full
                                                        text-xs font-bold
                                                        border
                                                        cursor-pointer
                                                        text-center
                                                        focus:outline-none
                                                        focus:ring-1

                                                        ${user.Role === 'student' &&
                                                            'bg-green-100 text-green-700 border-green-200 focus:ring-green-400'}
                                                        ${user.Role === 'tutor' &&
                                                            'bg-blue-100 text-blue-700 border-blue-200 focus:ring-blue-400'}
                                                        ${user.Role === 'pending' &&
                                                            'bg-purple-100 text-purple-700 border-purple-200 focus:ring-purple-400'}
                                                    `}
                                                >
                                                    {user.Role === 'pending' && (
                                                        <option
                                                            value=""
                                                            disabled
                                                            className="bg-white text-gray-800 text-center font-normal"
                                                        >
                                                            Chờ duyệt
                                                        </option>
                                                    )}

                                                    <option
                                                        value="student"
                                                        className="bg-white text-gray-800 text-center font-normal"
                                                    >
                                                        Student
                                                    </option>

                                                    <option
                                                        value="tutor"
                                                        className="bg-white text-gray-800 text-center font-normal"
                                                    >
                                                        Tutor
                                                    </option>
                                                </select>
                                            )}
                                        </div>
                                    </td>

                                    {/* ===== HÀNH ĐỘNG (chỉ còn Reset + Xóa) ===== */}
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    onResetPass(user.UserID, user.Username)
                                                }
                                                className="
                                                    px-3 py-1
                                                    border rounded-lg text-sm
                                                    bg-gray-50 text-gray-700
                                                    hover:bg-gray-100
                                                "
                                            >
                                                Reset mật khẩu
                                            </button>

                                            <span className="hidden sm:inline-block w-px h-6 bg-gray-200" />

                                            <button
                                                onClick={() =>
                                                    onDeleteUser(user.UserID, user.Username)
                                                }
                                                className="
                                                    px-3 py-1
                                                    border rounded-lg text-sm
                                                    bg-red-50 text-red-600 border-red-200
                                                    hover:bg-red-100
                                                "
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-6 text-center text-gray-500">
                                    Không tìm thấy người dùng
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>
        </>
    );
};

export default UserManagementTab;
