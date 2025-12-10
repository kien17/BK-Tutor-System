const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false, // Set false nếu chạy local
        trustServerCertificate: true // Bỏ qua check SSL local
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log("✅ Đã kết nối SQL Server thành công!");
    } catch (err) {
        console.error("❌ Lỗi kết nối SQL Server:", err);
    }
};

module.exports = { connectDB, sql };