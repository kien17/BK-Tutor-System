const { sql } = require('../config/dbConfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    // 1. Nhận thêm schoolId từ Frontend
    const { fullName, email, password, schoolId } = req.body;

    try {
        // 2. Kiểm tra Email trùng
        const checkEmail = await sql.query`SELECT * FROM Users WHERE Email = ${email}`;
        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({ message: "Email này đã được sử dụng!" });
        }

        // 3. [MỚI] Kiểm tra Mã số trùng (Nếu có nhập)
        if (schoolId) {
            const checkID = await sql.query`SELECT * FROM Users WHERE SchoolID = ${schoolId}`;
            if (checkID.recordset.length > 0) {
                return res.status(400).json({ message: `Mã số ${schoolId} đã tồn tại trong hệ thống!` });
            }
        }

        // 4. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Insert vào DB (Có thêm cột SchoolID)
        await sql.query`
            INSERT INTO Users (Username, FullName, Email, PasswordHash, Role, SchoolID)
            VALUES (${fullName}, ${fullName}, ${email}, ${hashedPassword}, 'pending', ${schoolId})
        `;

        res.status(201).json({ message: "Đăng ký thành công! Vui lòng chờ Admin duyệt." });

    } catch (err) {
        // Bắt lỗi từ SQL nếu lỡ có 2 request cùng lúc
        if (err.message.includes('UQ_SchoolID')) {
             return res.status(400).json({ message: "Mã số này vừa có người khác đăng ký!" });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Tìm user theo email
        const result = await sql.query`SELECT * FROM Users WHERE Email = ${email}`;
        const user = result.recordset[0];

        if (!user) return res.status(400).json({ message: "Email không tồn tại!" });

        // 2. So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu!" });

        // --- [MỚI] BƯỚC 3: CHẶN NGƯỜI DÙNG CHƯA ĐƯỢC DUYỆT ---
        if (user.Role === 'pending') {
            return res.status(403).json({ 
                message: "⛔ Tài khoản đang chờ duyệt! Vui lòng liên hệ Admin." 
            });
        }
        // -----------------------------------------------------

        // 4. Nếu qua được hết các cửa ải trên thì mới Tạo Token
        const token = jwt.sign(
            { id: user.UserID, role: user.Role }, 
            'BKTUTOR_SECRET_KEY', 
            { expiresIn: '1d' }
        );

        res.json({ 
            token, 
            user: { id: user.UserID, username: user.Username, fullName: user.FullName, role: user.Role } 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};