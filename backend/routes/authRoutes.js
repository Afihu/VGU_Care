const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');

// Login route using controller
router.post('/login', loginUser);

module.exports = router;