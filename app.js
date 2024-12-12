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

const corsOptions = {
    origin: "https://cloud.arinci.nl", // Allow this specific origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow credentials (e.g., cookies, authorization headers)
};

app.use(cors(corsOptions));



const app = express();
app.use(express.json({ limit: "10gb" }));

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
