const express = require('express');
const {
  createProject, getProjects, getProject, updateProject, deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// كل روتات المشاريع محمية: لازم token
router.use(protect);

// الروتات المتاع التاسكات داخل مشروع: /api/projects/:projectId/tasks
router.use('/:projectId/tasks', require('./taskRoutes'));

router.route('/').post(createProject).get(getProjects);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

module.exports = router;
