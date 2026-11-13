const express = require('express');
const { getUsers, updateRole } = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// كل روتات المستخدمين: لازم token + دور manager
router.use(protect, restrictTo('manager'));

router.get('/', getUsers);
router.patch('/:id/role', updateRole);

module.exports = router;
