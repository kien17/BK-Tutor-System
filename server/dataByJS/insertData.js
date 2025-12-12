const { sql, connectDB } = require('../src/config/dbConfig');
const bcrypt = require('bcryptjs');

async function insertData() {
    try {
        console.log("⏳ Đang kết nối Database...");
        await connectDB();

        // 1. Chuẩn bị mật khẩu mã hóa (Pass: 123456)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        console.log("➕ Đang thêm người dùng mẫu...");

        // Thêm Sinh Viên (Nếu chưa có)
        const studentCheck = await sql.query`SELECT * FROM Users WHERE Email = 'student@hcmut.edu.vn'`;
        if (studentCheck.recordset.length === 0) {
            await sql.query`
                INSERT INTO Users (Username, Email, PasswordHash, Role)
                VALUES (N'Nguyễn Văn Sinh Viên', 'student@hcmut.edu.vn', ${hashedPassword}, 'student')
            `;
            console.log("   -> Đã thêm: Sinh Viên");
        } else {
            console.log("   -> Sinh viên đã có sẵn (Bỏ qua)");
        }

        // Thêm Tutor (Nếu chưa có)
        const tutorCheck = await sql.query`SELECT * FROM Users WHERE Email = 'tutor@hcmut.edu.vn'`;
        if (tutorCheck.recordset.length === 0) {
            await sql.query`
                INSERT INTO Users (Username, Email, PasswordHash, Role)
                VALUES (N'Thầy Giáo Ba', 'tutor@hcmut.edu.vn', ${hashedPassword}, 'tutor')
            `;
            console.log("   -> Đã thêm: Tutor");
        } else {
            console.log("   -> Tutor đã có sẵn (Bỏ qua)");
        }

        // 2. QUAN TRỌNG: In ra danh sách hiện tại để kiểm chứng
        console.log("\n📊 DANH SÁCH USER HIỆN CÓ TRONG DB:");
        console.log("------------------------------------------------");
        const allUsers = await sql.query`SELECT UserID, Username, Role FROM Users`;
        console.table(allUsers.recordset); // In dạng bảng đẹp
        console.log("------------------------------------------------");

        process.exit();
    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

insertData();