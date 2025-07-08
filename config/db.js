// config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'toor',
  database: 'sistema_talleres',
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