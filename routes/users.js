const express = require('express');
const authenticateJWT = require('../middlewares/auth');

// Route to update max storage
router.put('/update-max-storage', authenticateJWT, isAdmin, updateMaxStorage);


// Route to get storage info
router.get('/storage-info', authenticateJWT, getStorageInfo);


module.exports = router;
