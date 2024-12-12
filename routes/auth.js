const express = require('express');
const { login, register, forgotPassword, resetPassword } = require('../controllers/auth');


const router = express.Router();

// User Registration
router.post('/register', register);

// User Login
router.post('/login', login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
