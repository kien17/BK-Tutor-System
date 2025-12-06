const { sql, connectDB } = require('../src/config/dbConfig');

async function updateProfileDB() {
    try {
        console.log("⏳ Đang kết nối Database...");
        await connectDB();

        console.log("🛠 Đang thêm các cột thông tin cá nhân...");
        
        // 1. Thêm cột nếu chưa có
        const alterQuery = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'FullName')
                ALTER TABLE Users ADD FullName NVARCHAR(100);
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Dob')
                ALTER TABLE Users ADD Dob DATE;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Phone')
                ALTER TABLE Users ADD Phone VARCHAR(15);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Hometown')
                ALTER TABLE Users ADD Hometown NVARCHAR(100);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'CitizenID')
                ALTER TABLE Users ADD CitizenID VARCHAR(20);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'SchoolID')
                ALTER TABLE Users ADD SchoolID VARCHAR(20);
        `;
        await sql.query(alterQuery);

        console.log("🔄 Đang cập nhật dữ liệu mẫu cho khớp quy luật...");

        // 2. Cập nhật dữ liệu giả cho các user hiện có
        // Admin: Mã số = 0
        await sql.query`
            UPDATE Users SET 
                FullName = N'Quản Trị Viên Hệ Thống',
                Dob = '1990-01-01',
                Phone = '0909000000',
                Hometown = N'Hà Nội',
                CitizenID = '001090000001',
                SchoolID = '0'
            WHERE Role = 'admin'
        `;

        // Student: Mã số 7 chữ số bắt đầu bằng 2 (VD: 2110001)
        await sql.query`
            UPDATE Users SET 
                FullName = N'Nguyễn Văn Sinh Viên',
                Dob = '2003-05-20',
                Phone = '0912345678',
                Hometown = N'TP. Hồ Chí Minh',
                CitizenID = '079203000001',
                SchoolID = '2110001' 
            WHERE Role = 'student'
        `;

        // Tutor: Mã số 7 chữ số bắt đầu bằng 0 (VD: 0112233)
        await sql.query`
            UPDATE Users SET 
                FullName = N'Thầy Giáo A',
                Dob = '1985-11-20',
                Phone = '0987654321',
                Hometown = N'Đà Nẵng',
                CitizenID = '048085000001',
                SchoolID = '0112233'
            WHERE Role = 'tutor'
        `;

        console.log("✅ Đã nâng cấp DB và điền dữ liệu mẫu thành công!");
        process.exit();

    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

updateProfileDB();