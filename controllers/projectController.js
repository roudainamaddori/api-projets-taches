const Project = require('../models/Project');
const Task = require('../models/Task');
const { asyncHandler, escapeRegex, buildSort, texte, memeId } = require('../utils/helpers');

// POST /api/projects : أي مستخدم مسجل يجم يعمل مشروع
exports.createProject = asyncHandler(async (req, res) => {
  const { nom, description, statut } = req.body;
  // صاحب المشروع هو المستخدم المتصل (مش من body)
  const project = await Project.create({ nom, description, statut, proprietaire: req.user._id });
  res.status(201).json(project);
});

// GET /api/projects : manager يشوف الكل، user يشوف مشاريعو برك
// بحث: ?search=mot  | فلتر: ?statut=en cours  | ترتيب: ?sort=nom ولا ?sort=-createdAt
exports.getProjects = asyncHandler(async (req, res) => {
  const filtre = {};

  // user عادي: برك مشاريعو
  if (req.user.role !== 'manager') {
    filtre.proprietaire = req.user._id;
  } else if (texte(req.query.proprietaire)) {
    // manager يجم يفلتر على مستخدم معين
    filtre.proprietaire = texte(req.query.proprietaire);
  }

  if (texte(req.query.statut)) filtre.statut = texte(req.query.statut);

  // البحث في الاسم والوصف
  if (texte(req.query.search)) {
    const regex = new RegExp(escapeRegex(texte(req.query.search)), 'i');
    filtre.$or = [{ nom: regex }, { description: regex }];
  }

  const sort = buildSort(req.query.sort, ['nom', 'statut', 'createdAt']);
  const projects = await Project.find(filtre).sort(sort).populate('proprietaire', 'nom login');
  res.json(projects);
});

// نجيبو مشروع ونتأكدو إلي المستخدم عندو الحق يوصلو (صاحبو ولا manager)
const trouverProjetAutorise = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404).json({ message: 'Projet introuvable' });
    return null;
  }
  if (!memeId(project.proprietaire, req.user._id) && req.user.role !== 'manager') {
    res.status(403).json({ message: 'Accès interdit à ce projet' });
    return null;
  }
  return project;
};

// GET /api/projects/:id
exports.getProject = asyncHandler(async (req, res) => {
  const project = await trouverProjetAutorise(req, res);
  if (!project) return;
  res.json(project);
});

// PUT /api/projects/:id
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await trouverProjetAutorise(req, res);
  if (!project) return;
  // نبدلو برك الحقول المسموحة
  ['nom', 'description', 'statut'].forEach((champ) => {
    if (req.body[champ] !== undefined) project[champ] = req.body[champ];
  });
  await project.save();
  res.json(project);
});

// DELETE /api/projects/:id (يفسخ حتى التاسكات متاعو)
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await trouverProjetAutorise(req, res);
  if (!project) return;
  await Task.deleteMany({ projet: project._id });
  await project.deleteOne();
  res.json({ message: 'Projet et tâches associées supprimés' });
});
