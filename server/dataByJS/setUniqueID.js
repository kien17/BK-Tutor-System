const { sql, connectDB } = require('../src/config/dbConfig');

async function setUnique() {
    try {
        console.log("⏳ Đang kết nối Database...");
        await connectDB();

        console.log("🧹 Đang dọn dẹp dữ liệu cũ (Xóa các ID trùng hoặc rỗng)...");
        // Chuyển các ID rỗng ('') hoặc '0' thành NULL để không bị tính là trùng
        await sql.query`UPDATE Users SET SchoolID = NULL WHERE SchoolID = '' OR SchoolID = '0'`;

        console.log("🔒 Đang thiết lập ràng buộc UNIQUE cho SchoolID...");
        
        // Kiểm tra xem đã có ràng buộc chưa, nếu chưa thì thêm
        try {
            await sql.query`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_SchoolID')
                BEGIN
                    CREATE UNIQUE INDEX UQ_SchoolID ON Users(SchoolID) 
                    WHERE SchoolID IS NOT NULL -- Chỉ check trùng với các dòng có dữ liệu
                END
            `;
            console.log("✅ Đã thiết lập thành công! Từ giờ Mã số là độc nhất.");
        } catch (e) {
            console.log("⚠️ Có thể dữ liệu hiện tại đang bị trùng nên không khóa được. Hãy kiểm tra lại DB.");
            console.error(e.message);
        }

        process.exit();
    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

setUnique();