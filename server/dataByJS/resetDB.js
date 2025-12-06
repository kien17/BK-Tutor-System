const { sql, connectDB } = require('../src/config/dbConfig');
const bcrypt = require('bcryptjs');

async function resetDatabase() {
    try {
        console.log("⏳ Đang kết nối Database để Reset...");
        await connectDB();

        // 1. XÓA BẢNG CŨ (Theo thứ tự để tránh lỗi khóa ngoại)
        console.log("🔥 Đang xóa sạch bảng cũ...");
        const dropQuery = `
            -- Xóa các bảng con trước
            IF OBJECT_ID('Appointments', 'U') IS NOT NULL DROP TABLE Appointments;
            IF OBJECT_ID('DocumentShares', 'U') IS NOT NULL DROP TABLE DocumentShares;
            IF OBJECT_ID('SearchHistory', 'U') IS NOT NULL DROP TABLE SearchHistory;
            IF OBJECT_ID('Documents', 'U') IS NOT NULL DROP TABLE Documents;
            
            -- Xóa bảng cha cuối cùng
            IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
        `;
        await sql.query(dropQuery);

        // 2. TẠO LẠI BẢNG (Chuẩn hóa độ dài PasswordHash)
        console.log("🏗 Đang xây dựng lại cấu trúc bảng...");
        const createQuery = `
            CREATE TABLE Users (
                UserID INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(50) NOT NULL,
                Email VARCHAR(100) UNIQUE NOT NULL,
                PasswordHash VARCHAR(255) NOT NULL, -- QUAN TRỌNG: Độ dài phải đủ lớn
                Role VARCHAR(20) CHECK (Role IN ('student', 'tutor', 'admin')) DEFAULT 'student',
                Bio NVARCHAR(MAX) NULL,
                CreatedAt DATETIME DEFAULT GETDATE()
            );

            CREATE TABLE Documents (
                DocID INT IDENTITY(1,1) PRIMARY KEY,
                Title NVARCHAR(200) NOT NULL,
                Url VARCHAR(500) NOT NULL,
                UploaderID INT,
                IsPublic BIT DEFAULT 1,
                FOREIGN KEY (UploaderID) REFERENCES Users(UserID)
            );
        `;
        await sql.query(createQuery);

        // 3. NẠP DỮ LIỆU MẪU (Mật khẩu 123456)
        console.log("🌱 Đang gieo dữ liệu mới (Pass: 123456)...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt); // Hash chuẩn

        // Insert Admin
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role)
            VALUES (N'Admin Reset', 'admin@bktutor.com', ${hashedPassword}, 'admin')
        `;

        // Insert Tutor
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role)
            VALUES (N'Giảng Viên A', 'tutor@hcmut.edu.vn', ${hashedPassword}, 'tutor')
        `;

        // Insert Student
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role)
            VALUES (N'Sinh Viên B', 'student@hcmut.edu.vn', ${hashedPassword}, 'student')
        `;

        console.log("✅ RESET THÀNH CÔNG! Mật khẩu tất cả user là: 123456");
        process.exit();

    } catch (err) {
        console.error("❌ Lỗi Reset:", err);
        process.exit(1);
    }
}

resetDatabase();