const mysql = require('mysql2');
require("dotenv").config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Export a promise-based query method
const promisePool = pool.promise();

module.exports = promisePool;
