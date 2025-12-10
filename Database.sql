USE master;
GO

-- 1. TẠO DATABASE (Nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BKTutorDB')
BEGIN
    CREATE DATABASE BKTutorDB;
END
GO

USE BKTutorDB;
GO

-- 2. XÓA BẢNG CŨ (Để làm sạch dữ liệu, theo thứ tự ngược lại của quan hệ)
-- Nếu bạn muốn giữ dữ liệu cũ thì comment đoạn này lại
IF OBJECT_ID('Notifications', 'U') IS NOT NULL DROP TABLE Notifications;
IF OBJECT_ID('AcademicBookings', 'U') IS NOT NULL DROP TABLE AcademicBookings;
IF OBJECT_ID('TutorAvailability', 'U') IS NOT NULL DROP TABLE TutorAvailability;
IF OBJECT_ID('Documents', 'U') IS NOT NULL DROP TABLE Documents;
IF OBJECT_ID('SearchHistory', 'U') IS NOT NULL DROP TABLE SearchHistory;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

-- 3. TẠO BẢNG USERS (Người dùng)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Thông tin đăng nhập
    Username NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) DEFAULT 'pending', -- student, tutor, admin, pending
    
    -- Thông tin cá nhân (Profile)
    FullName NVARCHAR(100),
    Dob DATE, -- Ngày sinh
    Phone VARCHAR(15),
    Hometown NVARCHAR(100),
    CitizenID VARCHAR(20), -- CCCD
    SchoolID VARCHAR(20),  -- Mã số SV/GV (Quan trọng)
    Bio NVARCHAR(MAX),     -- Giới thiệu (cho Tutor)
    
    CreatedAt DATETIME DEFAULT GETDATE(),

    -- Ràng buộc Role hợp lệ
    CONSTRAINT CK_Users_Role CHECK (Role IN ('student', 'tutor', 'admin', 'pending'))
);
GO

-- Tạo chỉ mục duy nhất cho SchoolID (Bỏ qua nếu NULL)
CREATE UNIQUE INDEX UQ_SchoolID ON Users(SchoolID) WHERE SchoolID IS NOT NULL;
GO

-- 4. TẠO BẢNG DOCUMENTS (Tài liệu)
CREATE TABLE Documents (
    DocID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Url VARCHAR(500) NOT NULL,
    Subject NVARCHAR(100),      -- Môn học (VD: Giải tích 1)
    Description NVARCHAR(500),  -- Mô tả chi tiết
    UploaderID INT,
    IsPublic BIT DEFAULT 1,
    UploadDate DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (UploaderID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- 5. TẠO BẢNG TUTOR AVAILABILITY (Lịch rảnh của GV)
CREATE TABLE TutorAvailability (
    AvailID INT IDENTITY(1,1) PRIMARY KEY,
    TutorID INT NOT NULL,
    WeekNumber INT NOT NULL,
    DayOfWeek INT NOT NULL,   -- 2->8 (CN)
    StartPeriod INT NOT NULL, -- Tiết bắt đầu (1-17)
    EndPeriod INT NOT NULL,   -- Tiết kết thúc
    
    FOREIGN KEY (TutorID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- 6. TẠO BẢNG ACADEMIC BOOKINGS (Lịch hẹn / Phỏng vấn)
CREATE TABLE AcademicBookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    TutorID INT NOT NULL,
    StudentID INT NOT NULL,
    
    -- Thời gian
    WeekNumber INT NOT NULL,
    DayOfWeek INT NOT NULL,
    StartPeriod INT NOT NULL,
    EndPeriod INT NOT NULL,
    
    -- Chi tiết
    Status NVARCHAR(20) DEFAULT 'pending', -- pending, confirmed, rejected, cancelled, rescheduled
    Topic NVARCHAR(200),                   -- Nội dung tư vấn
    Location NVARCHAR(100),                -- Địa điểm / Link Meet
    MeetingMode NVARCHAR(20) DEFAULT 'Online', -- Online / Offline
    
    CreatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (TutorID) REFERENCES Users(UserID), -- Không để Cascade để tránh lỗi cycle
    FOREIGN KEY (StudentID) REFERENCES Users(UserID)
);
GO

-- 7. TẠO BẢNG NOTIFICATIONS (Thông báo)
CREATE TABLE Notifications (
    NotiID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Message NVARCHAR(500),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- 8. THÊM DỮ LIỆU MẪU (SEEDING)
-- Mật khẩu mặc định là: 123456
-- Hash của '123456' là: $2a$10$Xk.Cj.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3 (Ví dụ giả lập, cần chạy node resetPassAll.js để chuẩn)

-- Lưu ý: Ở đây mình dùng một chuỗi Hash mẫu chuẩn của bcrypt cho số '123456'
-- Hash: $2b$10$wY.d.j.z.x.y.A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U
-- Tuy nhiên, tốt nhất sau khi chạy SQL này, bạn nên chạy lại file 'resetPassAll.js' ở server để đảm bảo mật khẩu hoạt động.

INSERT INTO Users (Username, FullName, Email, PasswordHash, Role, SchoolID) VALUES 
(N'Admin System', N'Quản Trị Viên', 'admin@bktutor.com', '$2b$10$wY.d.j.z.x.y.A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U', 'admin', '0000001'),
(N'Thay Nguyen Van A', N'TS. Nguyễn Văn A', 'tutor@hcmut.edu.vn', '$2b$10$wY.d.j.z.x.y.A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U', 'tutor', '0112233'),
(N'Sinh Vien K20', N'Trần Văn Sinh Viên', 'student@hcmut.edu.vn', '$2b$10$wY.d.j.z.x.y.A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U', 'student', '2110001');
GO

PRINT '✅ DATABASE SETUP COMPLETED SUCCESSFULLY!';

-- 9. TẠO BẢNG REVIEWS (Phản hồi & Đánh giá Tutor)
IF OBJECT_ID('Reviews', 'U') IS NOT NULL DROP TABLE Reviews;
GO

CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,                     -- Đánh giá buổi học nào
    TutorID INT NOT NULL,                       -- Tutor được đánh giá
    StudentID INT NOT NULL,                     -- Người đánh giá
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(1000),                     -- Nội dung phản hồi
    CreatedAt DATETIME DEFAULT GETDATE(),

    -- Không cho mỗi student đánh giá 1 booking nhiều lần
    CONSTRAINT UQ_Review_Once UNIQUE (BookingID, StudentID),

    FOREIGN KEY (BookingID) REFERENCES AcademicBookings(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (TutorID) REFERENCES Users(UserID),
    FOREIGN KEY (StudentID) REFERENCES Users(UserID)
);
GO
