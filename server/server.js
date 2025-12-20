const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Lưu vào thư mục uploads
    },
    filename: (req, file, cb) => {
        // Đặt tên file = Thời gian + Tên gốc (để tránh trùng)
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const express = require('express');
const cors = require('cors');
const { connectDB, sql } = require('./src/config/dbConfig');
require('dotenv').config();

// --- QUAN TRỌNG: Import authController vào đây thì mới dùng được ---
const authController = require('./src/controllers/authController'); 

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Cho phép Frontend gọi vào
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// Kết nối CSDL
connectDB();

// --- CÁC API ---

// 1. API Chào mừng
app.get('/', (req, res) => {
    res.send('BK Tutor Backend is Running!');
});

// 2. API Auth (Đăng ký / Đăng nhập)
app.post('/api/register', authController.register); // Giờ dòng này sẽ chạy OK
app.post('/api/login', authController.login);

// 3. API Lấy danh sách Users (Test)
app.get('/api/users', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Users`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API ADMIN: Cập nhật vai trò (Role) ---
app.put('/api/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body; // Role mới (ví dụ: 'tutor')

    try {
        await sql.query`UPDATE Users SET Role = ${role} WHERE UserID = ${id}`;
        res.json({ message: "Cập nhật quyền thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const bcrypt = require('bcryptjs'); // Nhớ dòng này nếu chưa có ở đầu file

app.put('/api/users/:id/reset-pass', async (req, res) => {
    const { id } = req.params;
    try {
        // Tạo hash cho "123456"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        await sql.query`UPDATE Users SET PasswordHash = ${hashedPassword} WHERE UserID = ${id}`;
        
        res.json({ message: "Đã reset mật khẩu về 123456!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Lấy thông tin cá nhân (Profile) ---
const jwt = require('jsonwebtoken');

app.get('/api/profile', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        // Giải mã token để lấy ID user
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY'); // Nhớ khớp key lúc login
        const userId = decoded.id;

        const result = await sql.query`SELECT * FROM Users WHERE UserID = ${userId}`;
        const user = result.recordset[0];

        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Cập nhật thông tin cá nhân ---
app.put('/api/profile', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        // 1. Lấy ID người dùng từ Token
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        const userId = decoded.id;

        // 2. Lấy dữ liệu gửi lên từ Frontend
        const { fullName, phone, hometown, dob, citizenId } = req.body;

        // 3. Thực hiện lệnh Update vào SQL Server
        await sql.query`
            UPDATE Users 
            SET 
                FullName = ${fullName},
                Phone = ${phone},
                Hometown = ${hometown},
                Dob = ${dob},
                CitizenID = ${citizenId}
            WHERE UserID = ${userId}
        `;

        res.json({ message: "Cập nhật thành công!" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Đổi mật khẩu ---
app.put('/api/change-password', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    const { oldPassword, newPassword } = req.body;

    try {
        // 1. Lấy thông tin user từ token
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        const userId = decoded.id;

        // 2. Lấy mật khẩu hiện tại trong DB ra để so sánh
        const result = await sql.query`SELECT PasswordHash FROM Users WHERE UserID = ${userId}`;
        const user = result.recordset[0];

        if (!user) return res.status(404).json({ message: "User không tồn tại" });

        // 3. Kiểm tra mật khẩu cũ có đúng không
        const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
        }

        // 4. Mã hóa mật khẩu MỚI
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        // 5. Cập nhật vào DB
        await sql.query`
            UPDATE Users 
            SET PasswordHash = ${newHashedPassword} 
            WHERE UserID = ${userId}
        `;

        res.json({ message: "Đổi mật khẩu thành công!" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API ADMIN/USER: Xem thông tin người khác theo ID ---
app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        // Lấy thông tin user (bỏ mật khẩu hash đi cho bảo mật)
        const result = await sql.query`
            SELECT UserID, Username, Email, Role, FullName, Dob, Phone, Hometown, CitizenID, SchoolID 
            FROM Users 
            WHERE UserID = ${id}
        `;

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API ADMIN: Sửa thông tin (Đã thêm check trùng Mã số) ---
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization;
    
    // 1. Kiểm tra quyền Admin (Giữ nguyên)
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });
    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền Admin!" });
        }

        const { fullName, phone, hometown, dob, citizenId, schoolId } = req.body;

        // --- 2. [MỚI] KIỂM TRA TRÙNG MÃ SỐ ---
        // Chỉ kiểm tra nếu admin có nhập mã số
        if (schoolId) {
            // Tìm xem có ai KHÁC (không phải user đang sửa) mà đã dùng mã số này chưa
            const checkDuplicate = await sql.query`
                SELECT UserID, FullName FROM Users 
                WHERE SchoolID = ${schoolId} AND UserID != ${id}
            `;

            if (checkDuplicate.recordset.length > 0) {
                const existedUser = checkDuplicate.recordset[0];
                return res.status(400).json({ 
                    message: `Lỗi: Mã số ${schoolId} đã được dùng bởi "${existedUser.FullName}"!` 
                });
            }
        }
        // -------------------------------------

        // 3. Update (Giữ nguyên)
        await sql.query`
            UPDATE Users 
            SET 
                FullName = ${fullName},
                Phone = ${phone},
                Hometown = ${hometown},
                Dob = ${dob},
                CitizenID = ${citizenId},
                SchoolID = ${schoolId}
            WHERE UserID = ${id}
        `;

        res.json({ message: "Admin đã cập nhật thông tin thành công!" });

    } catch (err) {
        // Bắt lỗi từ Database (nếu cài UNIQUE constraint)
        if (err.message.includes('Violation of UNIQUE KEY constraint')) {
            return res.status(400).json({ message: "Lỗi hệ thống: Mã số bị trùng trong Database!" });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- API ADMIN: Xóa người dùng vĩnh viễn ---
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Chỉ Admin mới được xóa!" });
        }

        // --- DỌN DẸP DỮ LIỆU LIÊN QUAN TRƯỚC ---
        // 1. Xóa lịch sử tìm kiếm (nếu có)
        try { await sql.query`DELETE FROM SearchHistory WHERE UserID = ${id}`; } catch(e) {}
        
        // 2. Xóa các file tài liệu do người này upload
        try { await sql.query`DELETE FROM Documents WHERE UploaderID = ${id}`; } catch(e) {}

        // 3. Xóa các lịch hẹn/phỏng vấn
        // (Lưu ý: Nếu bảng Appointments chưa tạo thì bỏ qua try/catch này)
        try { 
            await sql.query`DELETE FROM Appointments WHERE TutorID = ${id} OR StudentID = ${id}`; 
        } catch(e) {}

        // --- XÓA USER CHÍNH ---
        await sql.query`DELETE FROM Users WHERE UserID = ${id}`;

        res.json({ message: "Đã xóa người dùng và toàn bộ dữ liệu liên quan!" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API TUTOR: Lấy danh sách lịch rảnh của chính mình ---
app.get('/api/tutor/schedules', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        // Lấy lịch của Tutor này, sắp xếp theo thời gian
        const result = await sql.query`
            SELECT * FROM TutorSchedules 
            WHERE TutorID = ${decoded.id} 
            ORDER BY StartTime ASC
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API TUTOR: Đăng ký lịch rảnh mới ---
app.post('/api/tutor/schedules', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    const { startTime, endTime } = req.body; // Gửi lên dạng '2025-12-06T08:00:00'

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        
        // Validation: Giờ kết thúc phải sau giờ bắt đầu
        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: "Giờ kết thúc phải sau giờ bắt đầu!" });
        }

        await sql.query`
            INSERT INTO TutorSchedules (TutorID, StartTime, EndTime)
            VALUES (${decoded.id}, ${startTime}, ${endTime})
        `;
        res.json({ message: "Đã thêm lịch thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API TUTOR: Xóa lịch rảnh ---
app.delete('/api/tutor/schedules/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM TutorSchedules WHERE ScheduleID = ${id}`;
        res.json({ message: "Đã xóa lịch!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DANH SÁCH TIẾT HỌC (Hardcode theo chuẩn Bách Khoa) ---
const SCHOOL_PERIODS = [
    { id: 1, start: '06:00', end: '06:50' },
    { id: 2, start: '07:00', end: '07:50' },
    { id: 3, start: '08:00', end: '08:50' },
    { id: 4, start: '09:00', end: '09:50' },
    { id: 5, start: '10:00', end: '10:50' },
    { id: 6, start: '11:00', end: '11:50' },
    { id: 7, start: '12:00', end: '12:50' },
    // Chiều
    { id: 8, start: '13:00', end: '13:50' },
    { id: 9, start: '14:00', end: '14:50' },
    { id: 10, start: '15:00', end: '15:50' },
    { id: 11, start: '16:00', end: '16:50' },
    { id: 12, start: '17:00', end: '17:50' },
    // Tối
    { id: 13, start: '18:00', end: '18:50' },
    { id: 14, start: '18:50', end: '19:40' },
    { id: 15, start: '19:40', end: '20:30' },
    { id: 16, start: '20:30', end: '21:20' },
    { id: 17, start: '21:20', end: '22:10' }
];

app.get('/api/periods', (req, res) => res.json(SCHOOL_PERIODS));

// --- API 1: TUTOR LƯU LỊCH RẢNH ---
app.post('/api/tutor/availability', async (req, res) => {
    const { week, day, startPeriod, endPeriod } = req.body;
    const token = req.headers.authorization;
    // ... (Code verify token như cũ) ...
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

    try {
        // Xóa lịch cũ nếu trùng đè lên
        await sql.query`
            DELETE FROM TutorAvailability 
            WHERE TutorID=${decoded.id} AND WeekNumber=${week} AND DayOfWeek=${day} 
            AND StartPeriod >= ${startPeriod} AND EndPeriod <= ${endPeriod}
        `;

        await sql.query`
            INSERT INTO TutorAvailability (TutorID, WeekNumber, DayOfWeek, StartPeriod, EndPeriod)
            VALUES (${decoded.id}, ${week}, ${day}, ${startPeriod}, ${endPeriod})
        `;
        res.json({ message: "Đã lưu lịch rảnh!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API 2: LẤY LỊCH RẢNH CỦA TUTOR (Cho SV xem) ---
app.get('/api/tutor/:id/availability', async (req, res) => {
    const { id } = req.params;
    const { week } = req.query;
    try {
        const result = await sql.query`
            SELECT * FROM TutorAvailability 
            WHERE TutorID = ${id} AND WeekNumber = ${week}
        `;
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API 3: SINH VIÊN ĐĂNG KÝ (BOOKING) ---
app.post('/api/booking', async (req, res) => {
    const { tutorId, week, day, startPeriod, endPeriod, topic, meetingMode } = req.body;
    const token = req.headers.authorization;
    
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

        // 1. Kiểm tra xem Tutor có rảnh không
        const checkFree = await sql.query`
            SELECT * FROM TutorAvailability
            WHERE TutorID=${tutorId} AND WeekNumber=${week} AND DayOfWeek=${day}
            AND StartPeriod <= ${startPeriod} AND EndPeriod >= ${endPeriod}
        `;
        if (checkFree.recordset.length === 0) {
            return res.status(400).json({ message: "Giảng viên không rảnh vào giờ này!" });
        }

        // 2. Kiểm tra xem đã có ai đặt chưa (trừ những vé đã bị hủy/từ chối)
        const checkBusy = await sql.query`
            SELECT * FROM AcademicBookings
            WHERE TutorID=${tutorId} AND WeekNumber=${week} AND DayOfWeek=${day}
            AND (
                (StartPeriod BETWEEN ${startPeriod} AND ${endPeriod}) OR 
                (EndPeriod BETWEEN ${startPeriod} AND ${endPeriod})
            )
            AND Status != 'rejected' AND Status != 'cancelled'
        `;
        if (checkBusy.recordset.length > 0) {
            return res.status(400).json({ message: "Giờ này vừa có người khác đặt mất rồi!" });
        }

        // 3. Tạo Booking (Thêm cột MeetingMode)
        await sql.query`
            INSERT INTO AcademicBookings (
                TutorID, StudentID, WeekNumber, DayOfWeek, StartPeriod, EndPeriod, 
                Status, Topic, MeetingMode
            )
            VALUES (
                ${tutorId}, ${decoded.id}, ${week}, ${day}, ${startPeriod}, ${endPeriod}, 
                'pending', ${topic}, ${meetingMode}
            )
        `;
        
        res.json({ message: "Đăng ký thành công!" });

    } catch (err) { 
        console.error("Lỗi Đặt Lịch:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// --- API 4: XEM LỊCH ĐÃ ĐĂNG KÝ (Cho cả Tutor và SV) ---
app.get('/api/my-bookings', async (req, res) => {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
    
    try {
        let query;
        if (decoded.role === 'student') {
            // SV xem lịch mình đã đặt với các Tutor
            query = `SELECT B.*, U.FullName as TutorName FROM AcademicBookings B 
                     JOIN Users U ON B.TutorID = U.UserID 
                     WHERE B.StudentID = ${decoded.id}`;
        } else {
            // Tutor xem lịch SV đặt mình
            query = `SELECT B.*, U.FullName as StudentName FROM AcademicBookings B 
                     JOIN Users U ON B.StudentID = U.UserID 
                     WHERE B.TutorID = ${decoded.id}`;
        }
        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API Lấy thông báo của User ---
app.get('/api/notifications', async (req, res) => {
    const token = req.headers.authorization;
    if(!token) return res.sendStatus(401);
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

    const result = await sql.query`
        SELECT TOP 10 * FROM Notifications 
        WHERE UserID = ${decoded.id} 
        ORDER BY CreatedAt DESC
    `;
    res.json(result.recordset);
});

// --- API Đánh dấu đã đọc ---
app.put('/api/notifications/read', async (req, res) => {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
    await sql.query`UPDATE Notifications SET IsRead = 1 WHERE UserID = ${decoded.id}`;
    res.json({ success: true });
});

// --- API TUTOR XỬ LÝ BOOKING (Duyệt / Từ chối / Đổi lịch) ---
app.put('/api/booking/:id/status', async (req, res) => {
    const { id } = req.params; // BookingID
    const { status, newWeek, newDay, newPeriod } = req.body; // status: 'confirmed', 'rejected', 'rescheduled'
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

    try {
        // 1. Lấy thông tin Booking cũ để biết ai là Sinh viên
        const booking = await sql.query`SELECT * FROM AcademicBookings WHERE BookingID = ${id}`;
        const studentId = booking.recordset[0].StudentID;

        // 2. Xử lý Logic
        let notiMsg = "";
        
        if (status === 'rescheduled') {
            // Nếu đổi lịch -> Update cả thời gian
            await sql.query`
                UPDATE AcademicBookings 
                SET Status = 'rescheduled', WeekNumber=${newWeek}, DayOfWeek=${newDay}, StartPeriod=${newPeriod}, EndPeriod=${newPeriod}
                WHERE BookingID = ${id}
            `;
            notiMsg = `📅 Giảng viên đã đổi lịch hẹn của bạn sang: Tuần ${newWeek}, Thứ ${newDay}, Tiết ${newPeriod}.`;
        } else {
            // Nếu Duyệt hoặc Từ chối
            await sql.query`UPDATE AcademicBookings SET Status = ${status} WHERE BookingID = ${id}`;
            notiMsg = status === 'confirmed' 
                ? `✅ Giảng viên đã CHẤP NHẬN lịch hẹn của bạn!` 
                : `❌ Giảng viên đã TỪ CHỐI lịch hẹn của bạn.`;
        }

        // 3. BẮN THÔNG BÁO CHO SINH VIÊN
        await sql.query`
            INSERT INTO Notifications (UserID, Message) VALUES (${studentId}, ${notiMsg})
        `;

        res.json({ message: "Đã xử lý và gửi thông báo!" });

    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API PUBLIC: Lấy danh sách các slot ĐÃ BỊ ĐẶT của một Tutor (theo tuần) ---
app.get('/api/tutor/:id/booked-slots', async (req, res) => {
    const { id } = req.params; // TutorID
    const { week } = req.query;
    try {
        // Chỉ lấy những lịch đã confirmed hoặc đang pending (chưa bị hủy)
        const result = await sql.query`
            SELECT DayOfWeek, StartPeriod, EndPeriod FROM AcademicBookings 
            WHERE TutorID = ${id} AND WeekNumber = ${week} AND Status != 'rejected'
        `;
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API TUTOR: XÓA Lịch Rảnh (Khi bấm lại vào ô màu xanh) ---
app.delete('/api/tutor/availability', async (req, res) => {
    const { week, day, startPeriod, endPeriod } = req.body;
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

    try {
        await sql.query`
            DELETE FROM TutorAvailability 
            WHERE TutorID=${decoded.id} AND WeekNumber=${week} AND DayOfWeek=${day} 
            AND StartPeriod=${startPeriod} AND EndPeriod=${endPeriod}
        `;
        res.json({ message: "Đã xóa lịch rảnh!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API TUTOR: TẠO BUỔI TƯ VẤN (Hỗ trợ nhiều sinh viên) ---
app.post('/api/tutor/interview', async (req, res) => {
    const { studentEmails, week, day, startPeriod, endPeriod, topic, location, meetingMode } = req.body;
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

    try {
        // 1. Tách chuỗi email thành mảng và lọc khoảng trắng
        const emails = studentEmails.split(',').map(e => e.trim()).filter(e => e);
        
        if (emails.length === 0) return res.status(400).json({ message: "Vui lòng nhập ít nhất 1 email!" });

        // 2. Tìm danh sách UserID từ danh sách Email
        // Dùng mệnh đề IN trong SQL (hoặc loop đơn giản nếu lười viết query phức tạp)
        // Ở đây mình loop cho dễ hiểu và an toàn
        const students = [];
        const notFoundEmails = [];

        for (const email of emails) {
            const userRes = await sql.query`SELECT UserID, FullName FROM Users WHERE Email = ${email}`;
            if (userRes.recordset.length > 0) {
                students.push(userRes.recordset[0]);
            } else {
                notFoundEmails.push(email);
            }
        }

        if (notFoundEmails.length > 0) {
            return res.status(400).json({ 
                message: `Không tìm thấy các email sau: ${notFoundEmails.join(', ')}` 
            });
        }

        // 3. Tạo Booking cho từng sinh viên
        // Lưu ý: Với tư vấn nhóm, ta cho phép Tutor trùng lịch với chính mình trong giờ này
        // (Tức là 1 giờ này Tutor tiếp 5 bạn -> Tạo 5 dòng booking)
        
        for (const student of students) {
            await sql.query`
                INSERT INTO AcademicBookings (TutorID, StudentID, WeekNumber, DayOfWeek, StartPeriod, EndPeriod, Status, Topic, Location, MeetingMode)
                VALUES (${decoded.id}, ${student.UserID}, ${week}, ${day}, ${startPeriod}, ${endPeriod}, 'confirmed', ${topic}, ${location}, ${meetingMode})
            `;

            // Bắn thông báo
            const notiMsg = `📅 Giảng viên đã mời bạn tham gia Buổi tư vấn nhóm: Tuần ${week}, Thứ ${day}, Tiết ${startPeriod}. Chủ đề: ${topic}`;
            await sql.query`INSERT INTO Notifications (UserID, Message) VALUES (${student.UserID}, ${notiMsg})`;
        }

        res.json({ message: `Đã tạo lịch tư vấn thành công cho ${students.length} sinh viên!` });

    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API: Hủy Lịch (Dùng chung cho cả Tutor và Student) ---
app.put('/api/booking/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

    try {
        // 1. Lấy thông tin để thông báo cho người kia
        const booking = await sql.query`SELECT * FROM AcademicBookings WHERE BookingID = ${id}`;
        const b = booking.recordset[0];

        // 2. Xác định ai là người hủy để báo cho người còn lại
        let receiverId, msgPrefix;
        if (decoded.role === 'tutor') {
            receiverId = b.StudentID;
            msgPrefix = "👨‍🏫 Giảng viên";
        } else {
            receiverId = b.TutorID;
            msgPrefix = "🎓 Sinh viên";
        }

        // 3. Update trạng thái
        await sql.query`UPDATE AcademicBookings SET Status = 'cancelled' WHERE BookingID = ${id}`;

        // 4. Bắn thông báo
        const msg = `❌ ${msgPrefix} đã HỦY lịch hẹn (Tuần ${b.WeekNumber}, Thứ ${b.DayOfWeek}). Lý do: ${reason}`;
        await sql.query`INSERT INTO Notifications (UserID, Message) VALUES (${receiverId}, ${msg})`;

        res.json({ message: "Đã hủy lịch thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API: Cập nhật địa điểm / link meeting (QUAN TRỌNG: Thiếu cái này là lỗi 404) ---
app.put('/api/booking/:id/location', async (req, res) => {
    const { location } = req.body;
    const token = req.headers.authorization;
    
    // Kiểm tra đăng nhập
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        // Cập nhật vào DB
        await sql.query`UPDATE AcademicBookings SET Location = ${location} WHERE BookingID = ${req.params.id}`;
        
        // (Tùy chọn) Bắn thông báo cho sinh viên biết là địa điểm đã đổi
        // Lấy thông tin booking để biết StudentID
        const booking = await sql.query`SELECT * FROM AcademicBookings WHERE BookingID = ${req.params.id}`;
        if (booking.recordset.length > 0) {
            const b = booking.recordset[0];
            const msg = `📍 Giảng viên đã cập nhật địa điểm cho lịch hẹn (Tuần ${b.WeekNumber}, Thứ ${b.DayOfWeek}): ${location}`;
            await sql.query`INSERT INTO Notifications (UserID, Message) VALUES (${b.StudentID}, ${msg})`;
        }

        res.json({ message: "Đã cập nhật địa điểm!" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- API 1: UPLOAD TÀI LIỆU (Tutor) ---
// 'file' là tên của field trong FormData gửi từ Frontend
app.post('/api/documents', upload.single('file'), async (req, res) => {
    const { title, subject, description } = req.body;
    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        const filePath = req.file ? req.file.path : ''; // Đường dẫn file (vd: uploads/123-de-thi.pdf)

        // Lưu vào DB (Đường dẫn dùng dấu / để chuẩn web)
        const webPath = filePath.replace(/\\/g, "/"); 
        
        await sql.query`
            INSERT INTO Documents (Title, Url, UploaderID, IsPublic, Subject, Description)
            VALUES (${title}, ${webPath}, ${decoded.id}, 1, ${subject}, ${description})
        `;
        res.json({ message: "Upload thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API 2: TÌM KIẾM TÀI LIỆU (Student + Tutor) ---
app.get('/api/documents', async (req, res) => {
    const { search } = req.query; // Từ khóa tìm kiếm
    try {
        let query = `
            SELECT D.*, U.FullName as UploaderName 
            FROM Documents D 
            JOIN Users U ON D.UploaderID = U.UserID
        `;
        
        // Nếu có từ khóa -> Thêm điều kiện lọc
        if (search) {
            query += ` WHERE D.Title LIKE N'%${search}%' OR D.Subject LIKE N'%${search}%'`;
        }
        
        query += ` ORDER BY D.DocID DESC`; // Mới nhất lên đầu

        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API 3: XÓA TÀI LIỆU (Chỉ xóa của chính mình) ---
app.delete('/api/documents/:id', async (req, res) => {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
    
    try {
        // Chỉ xóa nếu UploaderID trùng với người đang đăng nhập
        await sql.query`DELETE FROM Documents WHERE DocID = ${req.params.id} AND UploaderID = ${decoded.id}`;
        res.json({ message: "Đã xóa tài liệu" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API: Ép trình duyệt tải file về (Force Download) ---
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    // Đường dẫn thực tới file trong thư mục uploads
    const filePath = path.join(__dirname, 'uploads', filename);
    
    // Hàm này sẽ tự động set header để trình duyệt tải file về thay vì mở ra
    res.download(filePath, (err) => {
        if (err) {
            console.error("Lỗi download:", err);
            res.status(404).send("Không tìm thấy file!");
        }
    });
});

// --- API ADMIN: RESET HỌC KỲ (Xóa trắng lịch rảnh & booking) ---
app.delete('/api/admin/reset-semester', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Chỉ Admin mới có quyền này!" });
        }

        console.log(`⚠️ ADMIN ${decoded.username} ĐANG RESET HỌC KỲ...`);

        // 1️⃣ Xóa sinh viên đã đăng ký buổi tư vấn
        await sql.query`DELETE FROM SessionParticipants`;

        // 2️⃣ Xóa toàn bộ buổi tư vấn (Academic Sessions)
        await sql.query`DELETE FROM AcademicSessions`;
        
        // 1. Xóa tất cả các buổi hẹn/phỏng vấn
        await sql.query`DELETE FROM AcademicBookings`;

        // 2. Xóa tất cả lịch rảnh của giảng viên
        await sql.query`DELETE FROM TutorAvailability`;

        // 3. (Tùy chọn) Xóa luôn thông báo cũ cho sạch sẽ
        await sql.query`DELETE FROM Notifications`;

        res.json({ message: "Đã reset hệ thống! Sẵn sàng cho học kỳ mới." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

//Student gửi đánh giá sau buổi học
app.post('/api/reviews', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        const studentId = decoded.id;

        const { bookingId, rating, comment } = req.body;

        // 1. Kiểm tra booking có tồn tại và thuộc student này không
        const bookingData = await sql.query`
            SELECT * FROM AcademicBookings 
            WHERE BookingID = ${bookingId} AND StudentID = ${studentId}
        `;

        if (bookingData.recordset.length === 0) {
            return res.status(400).json({ message: "Bạn không có quyền đánh giá booking này!" });
        }

        const booking = bookingData.recordset[0];
        const tutorId = booking.TutorID;

        // 2. Tạo review
        await sql.query`
            INSERT INTO Reviews (BookingID, TutorID, StudentID, Rating, Comment)
            VALUES (${bookingId}, ${tutorId}, ${studentId}, ${rating}, ${comment})
        `;

        res.json({ message: "Gửi đánh giá thành công!" });

    } catch (err) {
        if (err.message.includes("UQ_Review_Once")) {
            return res.status(400).json({ message: "Bạn đã đánh giá buổi học này rồi!" });
        }
        res.status(500).json({ error: err.message });
    }
});

//Lấy tất cả review của 1 Tutor
app.get('/api/tutors/:id/reviews', async (req, res) => {
    const tutorId = req.params.id;

    try {
        const reviews = await sql.query`
            SELECT R.*, U.FullName AS StudentName
            FROM Reviews R
            JOIN Users U ON R.StudentID = U.UserID
            WHERE R.TutorID = ${tutorId}
            ORDER BY R.CreatedAt DESC
        `;

        const avgRating = await sql.query`
            SELECT AVG(CAST(Rating AS FLOAT)) AS AvgRating
            FROM Reviews
            WHERE TutorID = ${tutorId}
        `;

        res.json({
            tutorId,
            averageRating: avgRating.recordset[0].AvgRating || 0,
            reviews: reviews.recordset
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Student xem lại tất cả đánh giá mình đã gửi
app.get('/api/my-reviews', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        const studentId = decoded.id;

        const result = await sql.query`
            SELECT R.*, U.FullName AS TutorName
            FROM Reviews R
            JOIN Users U ON R.TutorID = U.UserID
            WHERE StudentID = ${studentId}
            ORDER BY CreatedAt DESC
        `;

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Admin xem tất cả review hệ thống
app.get('/api/admin/reviews', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

        // Check Admin
        const roleCheck = await sql.query`
            SELECT Role FROM Users WHERE UserID = ${decoded.id}
        `;
        if (roleCheck.recordset[0].Role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
        }

        const result = await sql.query`
            SELECT R.*, 
                   Stu.FullName AS StudentName,
                   Tu.FullName AS TutorName
            FROM Reviews R
            JOIN Users Stu ON R.StudentID = Stu.UserID
            JOIN Users Tu  ON R.TutorID =  Tu.UserID
            ORDER BY CreatedAt DESC
        `;

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student xem review theo BookingID
app.get('/api/reviews/:bookingId', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');
        const studentId = decoded.id;
        const bookingId = req.params.bookingId;

        // Kiểm tra booking có thuộc student này không
        const bookingData = await sql.query`
            SELECT * FROM AcademicBookings 
            WHERE BookingID = ${bookingId} AND StudentID = ${studentId}
        `;
        if (bookingData.recordset.length === 0) {
            return res.status(403).json({ message: "Bạn không có quyền xem đánh giá này!" });
        }

        const reviewData = await sql.query`
            SELECT R.*, U.FullName AS TutorName
            FROM Reviews R
            JOIN Users U ON R.TutorID = U.UserID
            WHERE R.BookingID = ${bookingId}
        `;

        if (reviewData.recordset.length === 0) {
            return res.status(404).json({ message: "Chưa có đánh giá cho booking này" });
        }

        res.json(reviewData.recordset[0]); // Trả về review đầu tiên
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tutors/:id/reviews-with-booking', async (req, res) => {
    const tutorId = req.params.id;

    try {
        const result = await sql.query`
            SELECT 
                R.ReviewID, R.BookingID, R.Rating, R.Comment, R.CreatedAt,
                U.FullName AS StudentName,
                B.WeekNumber, B.DayOfWeek, B.StartPeriod, B.EndPeriod, B.Topic
            FROM Reviews R
            JOIN Users U ON R.StudentID = U.UserID
            JOIN AcademicBookings B ON R.BookingID = B.BookingID
            WHERE R.TutorID = ${tutorId}
            ORDER BY R.CreatedAt DESC
        `;

        const avg = await sql.query`
            SELECT AVG(CAST(Rating AS FLOAT)) AS AvgRating
            FROM Reviews WHERE TutorID = ${tutorId}
        `;

        res.json({
            averageRating: avg.recordset[0].AvgRating || 0,
            reviews: result.recordset
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- API TUTOR: TẠO BUỔI TƯ VẤN (AcademicSessions) ---
app.post('/api/tutor/academic-session', async (req, res) => {
    const {
        week,
        day,
        startPeriod,
        topic,
        location,
        meetingMode,
        maxStudents,
        description = null
    } = req.body;

    try {
        /* ===== 0️⃣ AUTH ===== */
        const token = req.headers.authorization;
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

        if (decoded.role !== 'tutor') {
            return res.status(403).json({ message: 'Chỉ Tutor mới được tạo buổi tư vấn!' });
        }

        if (!maxStudents || maxStudents <= 0) {
            return res.status(400).json({ message: 'Số lượng sinh viên không hợp lệ!' });
        }

        const endPeriod = startPeriod; // cố định 1 tiết

        /* ===== 1️⃣ CHECK TRÙNG AcademicSessions ===== */
        const sessionClash = await sql.query`
            SELECT 1
            FROM AcademicSessions
            WHERE TutorID = ${decoded.id}
              AND WeekNumber = ${week}
              AND DayOfWeek = ${day}
              AND StartPeriod = ${startPeriod}
              AND Status IN ('open', 'full')
        `;

        if (sessionClash.recordset.length > 0) {
            return res.status(400).json({
                message: 'Bạn đã có buổi tư vấn khác ở thời điểm này!'
            });
        }

        /* ===== 2️⃣ CHECK TRÙNG AcademicBookings ===== */
        const bookingClash = await sql.query`
            SELECT 1
            FROM AcademicBookings
            WHERE TutorID = ${decoded.id}
              AND WeekNumber = ${week}
              AND DayOfWeek = ${day}
              AND ${startPeriod} BETWEEN StartPeriod AND EndPeriod
              AND Status NOT IN ('cancelled', 'rejected')
        `;

        if (bookingClash.recordset.length > 0) {
            return res.status(400).json({
                message: 'Thời gian này đã có lịch tư vấn cá nhân!'
            });
        }

        /* ===== 3️⃣ INSERT SESSION ===== */
        const result = await sql.query`
            INSERT INTO AcademicSessions (
                TutorID,
                WeekNumber, DayOfWeek,
                StartPeriod, EndPeriod,
                Topic, Description,
                Location, MeetingMode,
                MaxStudents, Status
            )
            OUTPUT INSERTED.SessionID
            VALUES (
                ${decoded.id},
                ${week}, ${day},
                ${startPeriod}, ${endPeriod},
                ${topic}, ${description},
                ${location}, ${meetingMode},
                ${maxStudents}, 'open'
            )
        `;

        res.json({
            message: 'Đã tạo buổi tư vấn thành công!',
            sessionId: result.recordset[0].SessionID
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// --- API STUDENT: ĐĂNG KÝ BUỔI TƯ VẤN ---
app.post('/api/student/sessions/:sessionId/register', async (req, res) => {
    const { sessionId } = req.params;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

    if (decoded.role !== 'student') {
        return res.status(403).json({ message: 'Chỉ sinh viên mới được đăng ký!' });
    }

    const transaction = new sql.Transaction();

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);

        /* 1️⃣ Lock session */
        const sessionRes = await request.query(`
            SELECT * FROM AcademicSessions WITH (UPDLOCK, ROWLOCK)
            WHERE SessionID = ${sessionId}
        `);

        if (sessionRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Buổi tư vấn không tồn tại!' });
        }

        const session = sessionRes.recordset[0];

        if (session.Status !== 'open') {
            await transaction.rollback();
            return res.status(400).json({ message: 'Buổi tư vấn đã đủ người hoặc bị hủy!' });
        }

        /* 2️⃣ Check sinh viên đã đăng ký chưa */
        const existRes = await request.query(`
            SELECT 1 FROM SessionParticipants
            WHERE SessionID = ${sessionId}
              AND StudentID = ${decoded.id}
        `);

        if (existRes.recordset.length > 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Bạn đã đăng ký buổi này rồi!' });
        }

        /* 3️⃣ Check trùng lịch sinh viên */
        const clash = await request.query(`
            SELECT 1
            FROM SessionParticipants sp
            JOIN AcademicSessions s ON sp.SessionID = s.SessionID
            WHERE sp.StudentID = ${decoded.id}
              AND s.WeekNumber = ${session.WeekNumber}
              AND s.DayOfWeek = ${session.DayOfWeek}
              AND s.StartPeriod = ${session.StartPeriod}
              AND s.Status IN ('open', 'full')
        `);

        if (clash.recordset.length > 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Bạn đã có lịch khác vào thời điểm này!' });
        }

        /* 4️⃣ Đếm slot */
        const countRes = await request.query(`
            SELECT COUNT(*) AS cnt
            FROM SessionParticipants
            WHERE SessionID = ${sessionId}
        `);

        if (countRes.recordset[0].cnt >= session.MaxStudents) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Buổi tư vấn đã đủ số lượng!' });
        }

        /* 5️⃣ Insert participant */
        await request.query(`
            INSERT INTO SessionParticipants (SessionID, StudentID, Status)
            VALUES (${sessionId}, ${decoded.id}, 'registered')
        `);

        /* 6️⃣ Nếu full → update session */
        if (countRes.recordset[0].cnt + 1 >= session.MaxStudents) {
            await request.query(`
                UPDATE AcademicSessions SET Status = 'full'
                WHERE SessionID = ${sessionId}
            `);
        }

        /* 7️⃣ Thông báo */
        await request.query(`
            INSERT INTO Notifications (UserID, Message)
            VALUES 
            (${session.TutorID}, N'🎓 Có sinh viên đăng ký buổi tư vấn "${session.Topic}"'),
            (${decoded.id}, N'✅ Bạn đã đăng ký thành công buổi tư vấn "${session.Topic}"')
        `);

        await transaction.commit();
        res.json({ message: 'Đăng ký buổi tư vấn thành công!' });

    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
});

// --- API TUTOR: LẤY DANH SÁCH BUỔI TƯ VẤN ---
app.get('/api/tutor/academic-sessions', async (req, res) => {
    try {
        const { week } = req.query;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Missing token' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

        if (decoded.role !== 'tutor') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const weekNumber = parseInt(week, 10);
        if (isNaN(weekNumber)) {
            return res.status(400).json({ message: 'Invalid week number' });
        }

        const result = await sql.query`
            SELECT 
                s.SessionID,
                s.TutorID,
                s.WeekNumber,
                s.DayOfWeek,
                s.StartPeriod,
                s.EndPeriod,
                s.Topic,
                s.Description,
                s.Location,
                s.MeetingMode,
                s.MaxStudents,
                s.Status,
                COUNT(p.StudentID) AS CurrentStudents
            FROM AcademicSessions s
            LEFT JOIN SessionParticipants p 
                ON s.SessionID = p.SessionID
            WHERE s.TutorID = ${decoded.id}
              AND s.WeekNumber = ${weekNumber}
              AND s.Status != 'cancelled'
            GROUP BY 
                s.SessionID,
                s.TutorID,
                s.WeekNumber,
                s.DayOfWeek,
                s.StartPeriod,
                s.EndPeriod,
                s.Topic,
                s.Description,
                s.Location,
                s.MeetingMode,
                s.MaxStudents,
                s.Status
        `;

        res.json(result.recordset);
    } catch (err) {
        console.error('Academic Sessions API error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- API STUDENT: LẤY BUỔI TƯ VẤN THEO TUTOR ---
app.get('/api/tutor/:tutorId/academic-sessions', async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { week } = req.query;

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Missing token' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Chỉ sinh viên mới được xem lịch tutor' });
        }

        const weekNumber = parseInt(week, 10);
        if (isNaN(weekNumber)) {
            return res.status(400).json({ message: 'Invalid week number' });
        }

        const result = await sql.query`
            SELECT 
                s.SessionID,
                s.TutorID,
                s.WeekNumber,
                s.DayOfWeek,
                s.StartPeriod,
                s.EndPeriod,
                s.Topic,
                s.Description,
                s.Location,
                s.MeetingMode,
                s.MaxStudents,
                s.Status,
                COUNT(p.StudentID) AS CurrentStudents
            FROM AcademicSessions s
            LEFT JOIN SessionParticipants p 
                ON s.SessionID = p.SessionID
            WHERE s.TutorID = ${tutorId}
              AND s.WeekNumber = ${weekNumber}
              AND s.Status IN ('open', 'full')
            GROUP BY 
                s.SessionID,
                s.TutorID,
                s.WeekNumber,
                s.DayOfWeek,
                s.StartPeriod,
                s.EndPeriod,
                s.Topic,
                s.Description,
                s.Location,
                s.MeetingMode,
                s.MaxStudents,
                s.Status
            ORDER BY s.DayOfWeek, s.StartPeriod
        `;

        res.json(result.recordset);

    } catch (err) {
        console.error('Student Academic Sessions API error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- API STUDENT: LẤY DANH SÁCH BUỔI TƯ VẤN ---
app.get('/api/student/academic-sessions', async (req, res) => {
    try {
        const { tutorId, week } = req.query;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Missing token' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'BKTUTOR_SECRET_KEY');

        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const result = await sql.query`
            SELECT 
                s.SessionID,
                s.TutorID,
                s.WeekNumber,
                s.DayOfWeek,
                s.StartPeriod,
                s.EndPeriod,
                s.Topic,
                s.Location,
                s.MeetingMode,
                s.MaxStudents,
                s.Status,
                COUNT(p.StudentID) AS CurrentStudents,
                MAX(
                    CASE 
                        WHEN sp.StudentID IS NOT NULL THEN 1 
                        ELSE 0 
                    END
                ) AS IsRegistered
            FROM AcademicSessions s
            LEFT JOIN SessionParticipants p 
                ON s.SessionID = p.SessionID
            LEFT JOIN SessionParticipants sp 
                ON s.SessionID = sp.SessionID
                AND sp.StudentID = ${decoded.id}
            WHERE s.TutorID = ${tutorId}
              AND s.WeekNumber = ${week}
              AND s.Status != 'cancelled'
            GROUP BY 
                s.SessionID,
                s.TutorID,
                s.WeekNumber,
                s.DayOfWeek,
                s.StartPeriod,
                s.EndPeriod,
                s.Topic,
                s.Location,
                s.MeetingMode,
                s.MaxStudents,
                s.Status
        `;

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// Chạy Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});