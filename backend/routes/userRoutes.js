const router = require('express').Router();
const { signup, login, getProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');


router.post('/signup',  signup);
router.post('/login',   login);
router.get('/me', authMiddleware, getProfile);


module.exports = router;
