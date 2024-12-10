const multer = require('multer');
const db = require('../db');





const listFiles = async (req, res) => {
    const userId = req.query.userId; // Ideally, get this from the authenticated user
    try {
        const [files] = await db.execute('SELECT * FROM Files WHERE user_id = ?', [userId]);
        res.json(files);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const uploadFile = async (req, res) => {
    const userId = req.body.userId; // This should come from the authenticated user
    const { filename, path, size } = req.file;

    try {
        const query = 'INSERT INTO Files (user_id, filename, path, size) VALUES (?, ?, ?, ?)';
        await db.execute(query, [userId, filename, path, size]);
        res.status(201).json({ message: 'File uploaded successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = { listFiles, uploadFile };