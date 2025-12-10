const { sql, connectDB } = require('../src/config/dbConfig');

async function createNotificationDB() {
    await connectDB();
    await sql.query`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
        CREATE TABLE Notifications (
            NotiID INT IDENTITY(1,1) PRIMARY KEY,
            UserID INT NOT NULL,         -- Người nhận thông báo (Sinh viên)
            Message NVARCHAR(500),       -- Nội dung: "GV A đã đổi lịch..."
            IsRead BIT DEFAULT 0,        -- 0: Chưa xem, 1: Đã xem
            CreatedAt DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (UserID) REFERENCES Users(UserID)
        );
    `;
    console.log("✅ Đã tạo bảng Notifications!");
    process.exit();
}
createNotificationDB();