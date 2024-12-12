const bcrypt = require('bcryptjs'); // Updated to bcryptjs
const jwt = require('jsonwebtoken');
const db = require('../db');
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

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
        // Check if user exists
        const [rows] = await db.execute('SELECT * FROM Users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, used_storage: user.used_storage, max_storage: user.max_storage }, // Include role in token for easy access
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        // Send token and limited user info
        res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err.message); // Log errors for debugging
        res.status(500).json({ message: 'An error occurred while logging in' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the user exists
        const [rows] = await db.execute("SELECT * FROM Users WHERE email = ?", [email]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ message: "Email not found." });
        }

        // Generate reset token and expiration
        const resetToken = uuidv4();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token and expiry to the database
        await db.execute(
            "UPDATE Users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
            [resetToken, resetTokenExpiry, user.id]
        );

        // Send email
        const resetUrl = `https://arncloud.arinci.nl/reset-password/${resetToken}`;
        await sendResetEmail(user.email, user.username, resetUrl);

        res.status(200).json({ message: "Password reset email sent." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to process request." });
    }
};

// Helper to send email
const sendResetEmail = async (email, username, resetUrl) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // SMTP sunucusu
        port: 465, // SSL için standart SMTP portu
        secure: true, // 465 portu için true
        auth: {
            user: process.env.EMAIL_USER, // SMTP kullanıcı adı
            pass: process.env.EMAIL_PASS // SMTP şifresi
        },
        tls: {
            rejectUnauthorized: false, // Self-signed sertifika hatalarını devre dışı bırak
        },
    });

    const mailOptions = {
        from: "arnCloud <arncloud@arinci.nl>",
        to: email,
        subject: "arnCloud | Password Reset Request",
        html: `
           <div style="
    font-family: Arial, sans-serif;
    color: #ffffff;
    max-width: 600px;
    margin: auto;
    background: linear-gradient(to bottom, #111726, #1a202e);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
">
    <!-- Header Section with Logo -->
    <div style="padding: 10px; background: #4976ee; text-align: center;">
        <img src="https://arinci.nl/images/arncloud-logo-white.png" alt="arnCloud Logo"
            style="width: 250px; height: 100px; object-fit: cover;" />
    </div>

    <!-- Main Content -->
    <div style="padding: 30px; text-align: center;">
        <h2 style="color: #4976ee; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
            Hello <strong>${username}</strong>,<br><br>
            You requested to reset your password. Click the button below to reset it.
        </p>
        <a href="${resetUrl}" style="
                display: inline-block; 
                background-color: #4976ee; 
                color: #ffffff; 
                text-decoration: none; 
                padding: 12px 25px; 
                border-radius: 5px; 
                font-size: 16px; 
                font-weight: bold; 
                margin-bottom: 30px;
            ">
            Reset Password
        </a>
        <p style="font-size: 14px; color: #bbbbbb !important; margin-top: 30px; line-height: 1.5;">
            If you did not request this, you can safely ignore this email.<br>
            This link will expire in <strong>1 hour</strong>.
        </p>
    </div>

    <!-- Footer Section -->
    <div style="
        padding: 20px; 
        background: #1a202e; 
        text-align: center; 
        font-size: 12px; 
        color: #bbbbbb;
    ">
        <p style="margin: 0;">&copy; 2024 arnCloud. All rights reserved.</p>
        <p style="margin: 5px 0 0;">Need help? <a href="https://arncloud.com/support"
                style="color: #4976ee; text-decoration: none;">Contact Support</a></p>
    </div>
</div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Find the user by token
        const [rows] = await db.execute(
            "SELECT * FROM Users WHERE reset_token = ? AND reset_token_expiry > NOW()",
            [token]
        );
        const user = rows[0];
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear the reset token
        await db.execute(
            "UPDATE Users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: "Password reset successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to reset password." });
    }
};




module.exports = { register, login, forgotPassword, resetPassword };