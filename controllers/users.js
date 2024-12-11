const db = require('../db');

const getStorageInfo = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT used_storage, max_storage FROM Users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateMaxStorage = async (req, res) => {
    const { userId, maxStorage } = req.body; // Admin specifies user ID and new max storage

    try {
        const query = 'UPDATE Users SET max_storage = ? WHERE id = ?';
        await db.execute(query, [maxStorage, userId]);
        res.status(200).json({ message: 'Max storage updated successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


module.exports = { getStorageInfo, updateMaxStorage };