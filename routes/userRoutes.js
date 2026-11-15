
const express = require('express');
const { getUsers, updateRole } = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// Houni les routes mta3 les utilisateurs el kol lezemhom token JWT
// W ken el manager 3andou el droit bech yesta3melhom
router.use(protect, restrictTo('manager'));

// Houni el manager ynajem ychouf liste mta3 les utilisateurs
router.get('/', getUsers);

// Houni el manager ynajem ybaddel role mta3 user
router.patch('/:id/role', updateRole);

module.exports = router;
