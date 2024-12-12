const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require("express-rate-limit")

dotenv.config();

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests
    message: 'Too many requests, please try again later.',
});



const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/', apiLimiter);

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to Cloud Storage API v.0.3.0");
})



const PORT = process.env.PORT || 3500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
