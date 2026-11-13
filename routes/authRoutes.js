const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me); // محمية بالـ token

module.exports = router;
