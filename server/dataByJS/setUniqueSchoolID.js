const { sql, connectDB } = require('../src/config/dbConfig');

async function setUnique() {
    try {
        console.log("⏳ Đang kết nối Database...");
        await connectDB();

        console.log("🧹 Đang xử lý dữ liệu cũ...");
        // Chuyển các ID rỗng ('') hoặc '0' thành NULL để không bị tính là trùng
        await sql.query`UPDATE Users SET SchoolID = NULL WHERE SchoolID = '' OR SchoolID = '0'`;

        console.log("🔒 Đang thiết lập ràng buộc UNIQUE cho SchoolID...");
        
        // Tạo Index Unique (Chỉ cho phép 1 mã số duy nhất, bỏ qua các dòng NULL)
        try {
            await sql.query`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_SchoolID')
                BEGIN
                    CREATE UNIQUE INDEX UQ_SchoolID ON Users(SchoolID) 
                    WHERE SchoolID IS NOT NULL
                END
            `;
            console.log("✅ Đã thiết lập thành công! Từ giờ Mã số là độc nhất.");
        } catch (e) {
            console.log("⚠️ Lỗi: Có thể trong DB đang có 2 người trùng mã số. Hãy xóa bớt hoặc sửa lại trước.");
            console.error(e.message);
        }

        process.exit();
    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

setUnique();