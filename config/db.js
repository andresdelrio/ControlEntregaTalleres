// config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'toor',
  database: process.env.DB_NAME || 'sistema_talleres',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Pool de conexiones a MySQL creado exitosamente.');

// Exportamos tanto el pool con promesas (para async/await) como el pool original (para librerías como express-mysql-session)
module.exports = {
  promisePool: pool.promise(),
  pool: pool
};
