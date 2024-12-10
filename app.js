const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to Cloud Storage API");
})

app.get("/dbtest", async (req, res) => {
    const db = require('./db');
    try {
        const [rows] = await db.execute('SELECT username FROM Users');
        res.json(rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));