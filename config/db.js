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

// La librería mysql2/promise no es estrictamente necesaria aquí,
// pero el pool ya gestiona las conexiones de forma asíncrona.
// El pool emite un evento 'connection' que puedes usar para logging si es necesario,
// pero no necesitas un .connect() explícito. Las conexiones se obtienen
// y liberan automáticamente cuando usas pool.query() o pool.execute().

console.log('Pool de conexiones a MySQL creado exitosamente.');

module.exports = pool.promise();
