const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');
const authService = require('../services/authService');

// Login route using controller
router.post('/login', loginUser);

// Alternative: Login route using service (more advanced with JWT)
router.post('/login-jwt', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticate(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

module.exports = router;