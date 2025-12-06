# 🎓 BK Tutor System - Hệ thống Kết nối Gia sư & Sinh viên

**BK Tutor** là nền tảng web ứng dụng giúp kết nối Sinh viên và Giảng viên/Tutor tại Đại học Bách Khoa. Hệ thống hỗ trợ đặt lịch tư vấn (Online/Offline), quản lý thời khóa biểu rảnh theo tiết học, và kho tài liệu học tập.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

* **Frontend:** React.js (Vite), CSS3 (Custom Styles).
* **Backend:** Node.js, Express.js.
* **Database:** Microsoft SQL Server (chạy trên Docker).
* **Authentication:** JWT (JSON Web Token), BCrypt (Mã hóa mật khẩu).
* **File Storage:** Multer (Quản lý upload file cục bộ).

---

## 📂 Cấu Trúc Thư Mục (Project Structure)

```text
BK-Tutor-System/
│
├── database.sql                # Script SQL khởi tạo toàn bộ Database & Dữ liệu mẫu
│
├── server/                     # BACKEND (Node.js)
│   ├── uploads/                # Thư mục chứa tài liệu upload
│   ├── src/
│   │   ├── config/dbConfig.js  # Cấu hình kết nối SQL Server
│   │   └── controllers/        # Logic xử lý API
│   ├── .env                    # Biến môi trường (DB User/Pass)
│   ├── server.js               # File chạy chính (Chứa toàn bộ API)
│   ├── package.json            # Khai báo thư viện
│   ├── resetPassAll.js         # Script tiện ích: Reset mật khẩu
│   └── updateBookingSchema.js  # Script tiện ích: Cập nhật DB
│
└── client/                     # FRONTEND (React Vite)
    ├── src/
    │   ├── components/         # Navbar, BookingModal...
    │   ├── pages/              # Các màn hình chính (Login, Dashboard...)
    │   ├── App.jsx             # Định tuyến (Router)
    │   └── main.jsx            # Entry point
    ├── package.json
    └── vite.config.js
```

---

## 🛠 Hướng Dẫn Cài Đặt & Chạy (Setup Guide)

### **1. Chuẩn bị Môi trường**

* Cài đặt Node.js (v18 trở lên).
* Cài đặt Docker Desktop (để chạy SQL Server).

### **2. Khởi tạo Database (SQL Server)**

Mở Terminal và chạy lệnh Docker:

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=MatKhauManh123@" -p 1433:1433 --name sql_server_bktutor -d mcr.microsoft.com/mssql/server:2022-latest
```

Sau khi container chạy:

* Mở **database.sql** bằng SSMS hoặc Azure Data Studio.
* Kết nối: **localhost,1433** (User: `sa`, Pass: `MatKhauManh123@`).
* Chạy toàn bộ nội dung file.

### **3. Cài đặt & Chạy Backend**

Tại thư mục **server**:

```bash
npm install
```

Tạo file `.env`:

```
DB_USER=sa
DB_PASS=MatKhauManh123@
DB_SERVER=localhost
DB_NAME=BKTutorDB
PORT=5000
```

Chạy script reset mật khẩu để đồng bộ hash bcrypt:

```bash
node resetPassAll.js
```

Khởi động server:

```bash
npm start
```

Thông báo thành công:

```
🚀 Server đang chạy tại http://localhost:5000
✅ Đã kết nối SQL Server thành công!
```

### **4. Cài đặt & Chạy Frontend**

Tại thư mục **client**:

```bash
npm install
npm run dev
```

Truy cập: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Tài Khoản Demo Mặc Định

**Mật khẩu chung:** `123456`

| Vai Trò | Email                                               | Quyền Hạn                                         |
| ------- | --------------------------------------------------- | ------------------------------------------------- |
| Admin   | [admin@bktutor.com](mailto:admin@bktutor.com)       | Quản lý User, duyệt tài khoản, reset học kỳ       |
| Tutor   | [tutor@hcmut.edu.vn](mailto:tutor@hcmut.edu.vn)     | Đăng ký lịch rảnh, duyệt yêu cầu, upload tài liệu |
| Student | [student@hcmut.edu.vn](mailto:student@hcmut.edu.vn) | Đặt lịch, xem lịch rảnh, tải tài liệu             |

---

## ✨ Tính Năng Nổi Bật

### **1. Hệ thống Đặt Lịch (Booking System)**

* Grid View dạng Tiết (1–17) x Thứ (2–CN).
* Trạng thái real-time: Rảnh (Xanh) / Có người đặt (Vàng) / Của mình (Tím).
* Quy trình: SV đặt → Tutor duyệt/từ chối → Hệ thống thông báo.

### **2. Quản Lý Tài Liệu**

* Upload/Download file (PDF/Word/Ảnh).
* Tìm kiếm tài liệu theo môn.

### **3. Phân Quyền & Bảo Mật**

* Chặn người dùng chưa duyệt.
* Admin có quyền Reset Học Kỳ.
* Mã hóa mật khẩu bằng BCrypt.
