
const express = require('express');
const {
  createTask, getTasks, getTask, updateTask, assignTask, deleteTask,
} = require('../controllers/taskController');
const { protect, restrictTo } = require('../middlewares/auth');

// Houni nesta3mlou mergeParams bech najmou na9raw projectId mel router parent
const router = express.Router({ mergeParams: true });

// Houni les routes mta3 tasks el kol lezemhom token JWT
router.use(protect);

// Houni najmou na3mlou task jdida wala njibou liste mta3 les tasks
router.route('/').post(createTask).get(getTasks);

// Houni njibou task bel ID, nbaddlouha wala nafs5ouha
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

// Houni ken el manager ynajem ya3mel assignation mta3 task lel user
router.patch('/:id/assign', restrictTo('manager'), assignTask);

module.exports = router;
