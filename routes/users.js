const express = require('express');
const authenticateJWT = require('../middlewares/auth');
const checkRole = require('../middlewares/user');
const { updateMaxStorage, getStorageInfo } = require('../controllers/users');

// Route to update max storage
router.put('/update-max-storage', authenticateJWT, checkRole('admin'), updateMaxStorage);


// Route to get storage info
router.get('/storage-info', authenticateJWT, getStorageInfo);


module.exports = router;
