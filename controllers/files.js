const multer = require('multer');
const db = require('../db');
const path = require('path');
const fs = require('fs').promises;



const listFiles = async (req, res) => {
    const userId = req.user.id;
    try {
        const [files] = await db.execute('SELECT * FROM Files WHERE user_id = ?', [userId]);
        res.json(files);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const uploadFile = async (req, res) => {
    const userId = req.user.id;
    const { filename, path, size } = req.file;

    try {
        // Fetch user's current storage usage and max storage limit
        const [user] = await db.execute('SELECT used_storage, max_storage FROM Users WHERE id = ?', [userId]);

        if (!user[0]) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { used_storage, max_storage } = user[0];

        // Check if the new file exceeds the user's storage limit
        if (used_storage + size > max_storage) {
            return res.status(400).json({ message: 'Storage limit exceeded' });
        }

        // Insert the file record into the database
        const query = 'INSERT INTO Files (user_id, filename, path, size) VALUES (?, ?, ?, ?)';
        await db.execute(query, [userId, filename, path, size]);

        // Update the user's storage usage
        const updateStorage = 'UPDATE Users SET used_storage = used_storage + ? WHERE id = ?';
        await db.execute(updateStorage, [size, userId]);

        res.status(201).json({ message: 'File uploaded successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};



const downloadFile = async (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM Files WHERE id = ? AND user_id = ?', [fileId, userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'File not found or unauthorized' });
        }

        const file = rows[0];
        const filePath = path.resolve(file.path);
        res.download(filePath, file.filename);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
const deleteFile = async (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    try {
        // Fetch the file to delete
        const [rows] = await db.execute(
            'SELECT * FROM Files WHERE id = ? AND user_id = ?',
            [fileId, userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'File not found or unauthorized' });
        }

        const file = rows[0];

        // Delete the file from the filesystem
        await fs.promises.unlink(file.path);

        // Update the user's used storage
        await db.execute(
            'UPDATE Users SET used_storage = used_storage - ? WHERE id = ?',
            [file.size, userId]
        );

        // Delete the file record from the database
        await db.execute('DELETE FROM Files WHERE id = ?', [fileId]);

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};



module.exports = { listFiles, uploadFile, downloadFile, deleteFile };