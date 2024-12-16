const express = require('express');
// const multer = require('multer');
const { listFiles, uploadFile, downloadFile, deleteFile } = require('../controllers/files');
const authenticateJWT = require('../middlewares/auth');
const ftpMiddleware = require("../middlewares/ftpMiddleware");
const router = express.Router();



// // Configure Multer
// const storage = multer.diskStorage({
//     destination: './uploads',
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     },
// });

// const upload = multer({ storage });

// File Upload
// router.post('/upload', authenticateJWT, upload.single('file'), uploadFile);

//File Upload
router.post("/upload", authenticateJWT, ftpMiddleware, uploadFile);

//Chunks Upload
router.post("/upload-chunk", authenticateJWT, ftpMiddleware, uploadFile);
// List Files
router.get('/list', authenticateJWT, listFiles);

// Download File
router.get("/download/:id", authenticateJWT, downloadFile);

// Delete File
router.delete('/delete/:id', authenticateJWT, deleteFile);


module.exports = router;