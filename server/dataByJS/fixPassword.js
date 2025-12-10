const { sql, connectDB } = require('../src/config/dbConfig');
const bcrypt = require('bcryptjs');

async function fixPassword() {
    try {
        console.log("🔧 Đang kết nối Database để sửa mật khẩu...");
        await connectDB();

        // 1. Mở rộng cột PasswordHash (đề phòng lúc trước tạo bị ngắn quá)
        console.log("📏 Đang mở rộng độ dài cột mật khẩu...");
        try {
            await sql.query`ALTER TABLE Users ALTER COLUMN PasswordHash VARCHAR(255)`;
        } catch (e) {
            console.log("  -> (Cột đã đủ rộng hoặc có lỗi nhỏ, bỏ qua bước này)");
        }

        // 2. Tạo mã hóa cho số '123456'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        console.log("🔐 Mật khẩu mã hóa mới sẽ là:", hashedPassword);

        // 3. Cập nhật cho tất cả user
        await sql.query`
            UPDATE Users 
            SET PasswordHash = ${hashedPassword}
        `;

        console.log("✅ Đã cập nhật xong! Tất cả user giờ có mật khẩu là: 123456");
        process.exit();

    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

fixPassword();