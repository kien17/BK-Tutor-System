const { sql, connectDB } = require('../src/config/dbConfig');

async function createAcademicDB() {
    try {
        await connectDB();
        
        // 1. Bảng lưu Khung giờ rảnh của Tutor (Tutor Availability)
        // Tutor đánh dấu: "Tuần 15, Thứ 2, Tiết 1-3 tôi rảnh"
        const availQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TutorAvailability' AND xtype='U')
            CREATE TABLE TutorAvailability (
                AvailID INT IDENTITY(1,1) PRIMARY KEY,
                TutorID INT NOT NULL,
                WeekNumber INT NOT NULL,      -- Ví dụ: Tuần 1, Tuần 2...
                DayOfWeek INT NOT NULL,       -- 2 (Thứ 2) -> 8 (Chủ nhật)
                StartPeriod INT NOT NULL,     -- Tiết bắt đầu (1-17)
                EndPeriod INT NOT NULL,       -- Tiết kết thúc
                FOREIGN KEY (TutorID) REFERENCES Users(UserID)
            );
        `;
        await sql.query(availQuery);

        // 2. Bảng lưu Buổi tư vấn (Appointments/Bookings)
        // Sinh viên đăng ký hoặc Tutor tự mở
        const bookingQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AcademicBookings' AND xtype='U')
            CREATE TABLE AcademicBookings (
                BookingID INT IDENTITY(1,1) PRIMARY KEY,
                TutorID INT NOT NULL,
                StudentID INT NULL,           -- NULL nếu Tutor tự mở slot trống chờ người vào
                WeekNumber INT NOT NULL,
                DayOfWeek INT NOT NULL,
                StartPeriod INT NOT NULL,
                EndPeriod INT NOT NULL,
                Status NVARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled
                Topic NVARCHAR(200),          -- Nội dung tư vấn
                FOREIGN KEY (TutorID) REFERENCES Users(UserID),
                FOREIGN KEY (StudentID) REFERENCES Users(UserID)
            );
        `;
        await sql.query(bookingQuery);

        console.log("✅ Đã tạo xong hệ thống Database theo Tiết học!");
        process.exit();
    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

createAcademicDB();