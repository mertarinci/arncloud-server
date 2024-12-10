const express = require('express');
const multer = require('multer');
const { listFiles, uploadFile } = require('../controllers/files');
const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });

// File Upload
router.post('/upload', upload.single('file'), uploadFile);

// List Files
router.get('/list', listFiles);

module.exports = router;