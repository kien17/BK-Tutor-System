const { sql, connectDB } = require('../src/config/dbConfig');

async function createScheduleTable() {
    try {
        await connectDB();
        console.log("⏳ Đang tạo bảng Lịch Rảnh (TutorSchedules)...");

        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TutorSchedules' AND xtype='U')
            CREATE TABLE TutorSchedules (
                ScheduleID INT IDENTITY(1,1) PRIMARY KEY,
                TutorID INT NOT NULL,
                StartTime DATETIME NOT NULL,
                EndTime DATETIME NOT NULL,
                IsBooked BIT DEFAULT 0, -- 0: Còn trống, 1: Đã có SV đặt
                FOREIGN KEY (TutorID) REFERENCES Users(UserID)
            );
        `;

        await sql.query(query);
        console.log("✅ Đã tạo bảng TutorSchedules thành công!");
        process.exit();
    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
}

createScheduleTable();