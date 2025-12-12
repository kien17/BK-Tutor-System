const { sql, connectDB } = require('../src/config/dbConfig');
const bcrypt = require('bcryptjs');

async function addMoreUsers() {
    try {
        console.log("⏳ Đang kết nối Database...");
        await connectDB();

        // Tạo mật khẩu mã hóa cho 123456
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        console.log("➕ Đang thêm Sinh viên và Tutor...");

        // 1. Thêm Sinh Viên (để bạn test nút Thăng cấp)
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role)
            VALUES (N'Sinh Viên Test', 'student@hcmut.edu.vn', ${hashedPassword}, 'student')
        `;

        // 2. Thêm Tutor (để bạn test nút Hạ cấp)
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role)
            VALUES (N'Giảng Viên A', 'tutor@hcmut.edu.vn', ${hashedPassword}, 'tutor')
        `;

        console.log("✅ Đã thêm xong 2 người dùng mới!");
        console.log("👉 Bạn hãy F5 lại trang Admin để thấy họ.");
        process.exit();

    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

addMoreUsers();