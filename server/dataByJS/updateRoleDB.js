const { sql, connectDB } = require('../src/config/dbConfig');

async function updateRoleDB() {
    try {
        console.log("⏳ Đang kết nối Database...");
        await connectDB();

        console.log("🛠 Đang cập nhật ràng buộc Role...");

        // 1. Tìm tên của ràng buộc CHECK hiện tại (Vì SQL tự đặt tên ngẫu nhiên)
        const constraintResult = await sql.query`
            SELECT name 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('Users') 
            AND definition LIKE '%Role%'
        `;

        if (constraintResult.recordset.length > 0) {
            const constraintName = constraintResult.recordset[0].name;
            console.log(`   -> Tìm thấy ràng buộc cũ: ${constraintName}`);
            
            // 2. Xóa ràng buộc cũ
            await sql.query(`ALTER TABLE Users DROP CONSTRAINT ${constraintName}`);
            console.log("   -> Đã xóa ràng buộc cũ.");
        }

        // 3. Thêm ràng buộc mới bao gồm cả 'pending'
        await sql.query`
            ALTER TABLE Users 
            ADD CONSTRAINT CK_Users_Role 
            CHECK (Role IN ('student', 'tutor', 'admin', 'pending'))
        `;

        console.log("✅ Đã cập nhật xong! Giờ DB chấp nhận role: 'pending' (Đang đăng ký)");
        process.exit();

    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

updateRoleDB();