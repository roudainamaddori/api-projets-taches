const express = require('express');
const {
  createTask, getTasks, getTask, updateTask, assignTask, deleteTask,
} = require('../controllers/taskController');
const { protect, restrictTo } = require('../middlewares/auth');

// mergeParams باش نقراو :projectId من الـ router الأب
const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/').post(createTask).get(getTasks);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

// التعيين: manager برك
router.patch('/:id/assign', restrictTo('manager'), assignTask);

module.exports = router;
