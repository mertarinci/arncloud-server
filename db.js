const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'cloud_storage',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Export a promise-based query method
const promisePool = pool.promise();

module.exports = promisePool;
