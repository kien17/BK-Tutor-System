const { sql, connectDB } = require('../src/config/dbConfig');

async function updateDocDB() {
    await connectDB();
    // Thêm cột Mô tả và Môn học
    try {
        await sql.query`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Documents') AND name = 'Description')
                ALTER TABLE Documents ADD Description NVARCHAR(500);
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Documents') AND name = 'Subject')
                ALTER TABLE Documents ADD Subject NVARCHAR(100);
        `;
        console.log("✅ Đã cập nhật bảng Documents!");
        process.exit();
    } catch(e) { console.log(e); process.exit(1); }
}
updateDocDB();