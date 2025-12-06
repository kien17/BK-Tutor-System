const { sql, connectDB } = require('../src/config/dbConfig');
const bcrypt = require('bcryptjs');

async function forceFix() {
    try {
        console.log("🛠 BẮT ĐẦU SỬA LỖI MẬT KHẨU...");
        await connectDB();

        // 1. MỞ RỘNG CỘT (Quan trọng nhất)
        console.log("📏 Đang mở rộng cột PasswordHash lên 255 ký tự...");
        try {
            await sql.query`ALTER TABLE Users ALTER COLUMN PasswordHash VARCHAR(255)`;
            console.log("   -> Đã mở rộng thành công!");
        } catch (e) {
            console.log("   -> (Có thể cột đã rộng sẵn, bỏ qua)");
        }

        // 2. XÓA USER CŨ BỊ LỖI (Để tạo lại cho sạch)
        console.log("🗑 Đang xóa User admin cũ...");
        await sql.query`DELETE FROM Users WHERE Email = 'admin@bktutor.com'`;

        // 3. TẠO LẠI USER ADMIN MỚI
        console.log("👤 Đang tạo lại Admin mới...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt); // Mật khẩu 123456 chuẩn

        // Insert lại
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role)
            VALUES (N'Admin Final', 'admin@bktutor.com', ${hashedPassword}, 'admin')
        `;

        console.log("✅ XONG! Admin đã được tạo lại với mật khẩu: 123456");
        console.log("👉 Bạn hãy thử đăng nhập lại ngay!");
        process.exit();

    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

forceFix();