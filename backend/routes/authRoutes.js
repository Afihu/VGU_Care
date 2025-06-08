const express = require('express');
const router = express.Router();
const { loginUser, signup } = require('../controllers/authController');

// Login and signup routes using controller
router.post('/login', loginUser);
router.post('/signup', signup);

module.exports = router;