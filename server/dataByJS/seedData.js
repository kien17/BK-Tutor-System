const { sql, connectDB } = require('../src/config/dbConfig');
const bcrypt = require('bcryptjs');

async function seedData() {
    try {
        console.log("⏳ Đang kết nối Database...");
        await connectDB();

        // 1. Dọn dẹp dữ liệu cũ (Xóa bảng con trước, bảng cha sau để tránh lỗi khóa ngoại)
        console.log("🧹 Đang xóa dữ liệu cũ...");
        await sql.query`DELETE FROM Appointments`;
        await sql.query`DELETE FROM DocumentShares`;
        await sql.query`DELETE FROM SearchHistory`;
        await sql.query`DELETE FROM Documents`;
        await sql.query`DELETE FROM Users`;
        
        // Reset ID về 1 cho đẹp
        await sql.query`DBCC CHECKIDENT ('Users', RESEED, 0)`;
        await sql.query`DBCC CHECKIDENT ('Documents', RESEED, 0)`;

        // 2. Tạo User (Mật khẩu chung là 123456)
        console.log("👤 Đang tạo User mẫu...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Tạo Admin
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role, Bio)
            VALUES (N'Admin Bách Khoa', 'admin@bktutor.com', ${hashedPassword}, 'admin', N'Quản trị viên hệ thống')
        `;

        // Tạo Tutor (Thầy giáo)
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role, Bio)
            VALUES (N'Thầy Nguyễn Văn A', 'tutor@hcmut.edu.vn', ${hashedPassword}, 'tutor', N'Giảng viên khoa KH&KT Máy tính, chuyên dạy Giải tích và Lập trình.')
        `;

        // Tạo Student (Sinh viên)
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, Role)
            VALUES (N'Sinh viên K20', 'student@hcmut.edu.vn', ${hashedPassword}, 'student')
        `;

        // 3. Tạo Tài liệu mẫu (Lấy ID của Tutor vừa tạo để gán người upload)
        console.log("📚 Đang tạo Tài liệu mẫu...");
        
        // Lấy ID của Tutor (người vừa được tạo ở trên, thường là ID = 2)
        const tutorResult = await sql.query`SELECT UserID FROM Users WHERE Role = 'tutor'`;
        const tutorID = tutorResult.recordset[0].UserID;

        await sql.query`
            INSERT INTO Documents (Title, Url, UploaderID, IsPublic) VALUES 
            (N'Đề thi cuối kỳ Giải tích 1 - HK231', 'https://example.com/de-thi-gt1.pdf', ${tutorID}, 1),
            (N'Slide bài giảng Kỹ thuật Lập trình', 'https://example.com/slide-ktlt.pptx', ${tutorID}, 1),
            (N'Tổng hợp công thức Vật lý đại cương 1', 'https://example.com/vat-ly-1.pdf', ${tutorID}, 1),
            (N'Giáo trình Đại số tuyến tính (Bản nháp)', 'https://example.com/dai-so-linear.pdf', ${tutorID}, 0), -- Tài liệu riêng tư
            (N'Ngân hàng câu hỏi trắc nghiệm Tư tưởng HCM', 'https://example.com/tu-tuong-hcm.docx', ${tutorID}, 1)
        `;

        console.log("✅ Gieo dữ liệu thành công! (Seeding Completed)");
        process.exit();

    } catch (err) {
        console.error("❌ Lỗi khi tạo dữ liệu:", err);
        process.exit(1);
    }
}

seedData();