const { sql, connectDB } = require('../src/config/dbConfig');

async function createTables() {
    try {
        await connectDB();
        
        const tableQuery = `
            -- 1. Bảng Users
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (
                UserID INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(50) NOT NULL,
                Email VARCHAR(100) UNIQUE NOT NULL,
                PasswordHash VARCHAR(255) NOT NULL, -- Sau này sẽ mã hóa
                Role VARCHAR(20) CHECK (Role IN ('student', 'tutor', 'admin')) DEFAULT 'student',
                CreatedAt DATETIME DEFAULT GETDATE()
            );

            -- 2. Bảng Documents
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Documents' AND xtype='U')
            CREATE TABLE Documents (
                DocID INT IDENTITY(1,1) PRIMARY KEY,
                Title NVARCHAR(200) NOT NULL,
                Url VARCHAR(500) NOT NULL,
                UploaderID INT,
                IsPublic BIT DEFAULT 1,
                FOREIGN KEY (UploaderID) REFERENCES Users(UserID)
            );
            
            -- 3. Tạo 1 User mẫu để test
            IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@bktutor.com')
            INSERT INTO Users (Username, Email, PasswordHash, Role) 
            VALUES (N'Admin Demo', 'admin@bktutor.com', '123456', 'admin');
        `;

        await sql.query(tableQuery);
        console.log("✅ Đã tạo bảng và dữ liệu mẫu thành công!");
        process.exit();
    } catch (err) {
        console.error("❌ Lỗi tạo bảng:", err);
        process.exit(1);
    }
}

createTables();