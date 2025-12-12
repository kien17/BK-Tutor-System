const { sql, connectDB } = require('./src/config/dbConfig');

async function updateBookingSchema() {
    try {
        await connectDB();
        console.log("🛠 Đang cập nhật bảng AcademicBookings...");

        const query = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('AcademicBookings') AND name = 'Location')
                ALTER TABLE AcademicBookings ADD Location NVARCHAR(100);

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('AcademicBookings') AND name = 'MeetingMode')
                ALTER TABLE AcademicBookings ADD MeetingMode NVARCHAR(20) DEFAULT 'Online';
        `;
        await sql.query(query);
        console.log("✅ Đã cập nhật DB thành công!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
updateBookingSchema();