
const express = require('express');
const {
  createProject, getProjects, getProject, updateProject, deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Houni les routes mta3 les projets el kol mahmiyin bel token JWT
router.use(protect);

// Houni nربطou les routes mta3 tasks b projet mo3ayen
// Exemple : /api/projects/:projectId/tasks
router.use('/:projectId/tasks', require('./taskRoutes'));

// Houni na3mlou projet jdid wala njibou liste mta3 les projets
router.route('/').post(createProject).get(getProjects);

// Houni njibou projet bel ID, nbaddlouh wala nafs5ouh
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

module.exports = router;
