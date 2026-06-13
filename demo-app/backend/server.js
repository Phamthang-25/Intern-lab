const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Cấu hình kết nối PostgreSQL từ biến môi trường
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  database: process.env.DB_NAME || 'demodb',
  port: process.env.DB_PORT || 5432,
});

// Hàm kết nối và khởi tạo Database với cơ chế Retry
async function initDatabase() {
  let retries = 5;
  while (retries) {
    try {
      console.log('Đang kết nối tới PostgreSQL...');
      await pool.query('SELECT NOW()');
      console.log('Kết nối Database thành công!');
      
      // Tạo bảng mẫu nếu chưa tồn tại
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id SERIAL PRIMARY KEY,
          event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          message TEXT,
          source_ip TEXT
        );
      `);
      console.log("Bảng 'system_logs' đã được khởi tạo/kiểm tra.");

      // Thêm một dòng log mặc định khi khởi chạy ứng dụng
      await pool.query(
        'INSERT INTO system_logs (message, source_ip) VALUES ($1, $2)',
        ['Ứng dụng khởi động hệ thống', '127.0.0.1']
      );
      break;
    } catch (err) {
      console.error(`Kết nối Database thất bại. Số lượt thử lại còn lại: ${retries - 1}. Chi tiết:`, err.message);
      retries -= 1;
      // Đợi 5 giây trước khi kết nối lại
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

initDatabase();

// API Endpoint 1: Healthcheck
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', database: err.message });
  }
});

// API Endpoint 2: Lấy dữ liệu và ghi log visit
app.get('/api/data', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
  try {
    // Ghi nhận một lượt truy cập mới từ IP người dùng
    await pool.query(
      'INSERT INTO system_logs (message, source_ip) VALUES ($1, $2)',
      [`Truy cập API từ Client`, ip]
    );

    // Lấy 10 dòng log mới nhất
    const result = await pool.query('SELECT * FROM system_logs ORDER BY event_time DESC LIMIT 10');
    
    res.json({
      success: true,
      message: "Dữ liệu được lấy thành công từ Database!",
      db_host: process.env.DB_HOST || 'postgres-service',
      logs: result.rows
    });
  } catch (err) {
    console.error('Lỗi khi truy vấn database:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Khởi chạy server
app.listen(port, () => {
  console.log(`Backend server đang chạy trên port ${port}`);
});
