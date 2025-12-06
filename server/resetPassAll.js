const { sql, connectDB } = require('./src/config/dbConfig');
const bcrypt = require('bcryptjs');

async function resetAllPasswords() {
    try {
        await connectDB();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);

        console.log("🔐 Đang đặt lại mật khẩu tất cả user thành: 123456");
        await sql.query`UPDATE Users SET PasswordHash = ${hash}`;

        console.log("✅ Xong! Giờ Database đã chuẩn.");
        process.exit();
    } catch (err) {
        console.error(err);
    }
}
resetAllPasswords();