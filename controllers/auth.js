const bcrypt = require('bcryptjs'); // Updated to bcryptjs
const jwt = require('jsonwebtoken');
const db = require('../db');
require("dotenv").config();

const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {

        if (username.length < 3 || username.length > 30) { res.status(400).json({ error: "Username must be between 3 and 30 characters" }); return; }

        if (password.length < 6 || password.length > 30) { res.status(400).json({ error: "Password must be between 6 and 30 characters" }); return; }

        const hashedPassword = await bcrypt.hash(password, 10); // bcryptjs works similarly
        const query = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
        await db.execute(query, [username, email, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username or email already in use.' });
            return;
        }
        res.status(400).json({ error: err.message });
    }
}

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM Users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password); // bcryptjs works similarly
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(400).json({ error: err.message, message: 'Error logging in' });
    }
}

module.exports = { register, login };