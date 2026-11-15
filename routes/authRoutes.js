
const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Houni na3mlou route bech el user ynajem ya3mel compte jdid
router.post('/register', register);

// Houni na3mlou route bech el user ya3mel login
router.post('/login', login);

// Houni njibou les informations mta3 el user connecté
// Nesta3mlou protect bech net2akdou elli 3andou token s7i7
router.get('/me', protect, me); 

module.exports = router;
