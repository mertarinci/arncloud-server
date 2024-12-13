const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require("express-rate-limit")
const fileUpload = require("express-fileupload");

dotenv.config();
const app = express();

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // Limit each IP to 300 requests
    message: 'Too many requests, please try again later.',
});

app.use(
    fileUpload({
        useTempFiles: false, // Disable temporary files to keep data in memory
        limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB file size limit
    })
);



app.use(express.json({ limit: "10gb" }));
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
    res.send("Welcome to Cloud Storage API v.0.4.0");
})



const PORT = process.env.PORT || 3500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
