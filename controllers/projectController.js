
const Project = require('../models/Project');
const Task = require('../models/Task');
const { asyncHandler, escapeRegex, buildSort, texte, memeId } = require('../utils/helpers');

// POST /api/projects : Houni ay user connecté ynajem ya3mel projet jdid
exports.createProject = asyncHandler(async (req, res) => {
  const { nom, description, statut } = req.body;
  // El proprietaire mta3 projet houwa el user connecté, moch elli fel body
  const project = await Project.create({ nom, description, statut, proprietaire: req.user._id });
  res.status(201).json(project);
});

// GET /api/projects : El manager ychouf les projets el kol, ama el user ychouf ken mta3ou
// Bech nlawejou nesta3mlou search, bech nfiltriw statut, w bech nrattbou nesta3mlou sort
// Exemples : ?search=mot | ?statut=en cours | ?sort=nom | ?sort=-createdAt
exports.getProjects = asyncHandler(async (req, res) => {
  const filtre = {};

  // Ken user 3adi, nwarriwh ken les projets mta3ou
  if (req.user.role !== 'manager') {
    filtre.proprietaire = req.user._id;
  } else if (texte(req.query.proprietaire)) {
    // Ken manager, ynajem yfiltri les projets 7asb el proprietaire
    filtre.proprietaire = texte(req.query.proprietaire);
  }

  if (texte(req.query.statut)) filtre.statut = texte(req.query.statut);

  // Houni nlawejou fel nom w description mta3 projet
  if (texte(req.query.search)) {
    const regex = new RegExp(escapeRegex(texte(req.query.search)), 'i');
    filtre.$or = [{ nom: regex }, { description: regex }];
  }

  const sort = buildSort(req.query.sort, ['nom', 'statut', 'createdAt']);
  const projects = await Project.find(filtre).sort(sort).populate('proprietaire', 'nom login');
  res.json(projects);
});

// Houni njibou projet w net2akdou elli el user 3andou el droit bech ychoufou
// Lezem ykoun proprietaire mta3ou wala manager
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

// GET /api/projects/:id : Houni njibou projet wa7ed bel ID mta3ou
exports.getProject = asyncHandler(async (req, res) => {
  const project = await trouverProjetAutorise(req, res);
  if (!project) return;
  res.json(project);
});

// PUT /api/projects/:id : Houni nbaddlou les informations mta3 projet
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await trouverProjetAutorise(req, res);
  if (!project) return;
  // Houni nbaddlou ken les champs elli masmou7 bihom
  ['nom', 'description', 'statut'].forEach((champ) => {
    if (req.body[champ] !== undefined) project[champ] = req.body[champ];
  });
  await project.save();
  res.json(project);
});

// DELETE /api/projects/:id : Houni nafs5ou projet w les taches elli tab3inou
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await trouverProjetAutorise(req, res);
  if (!project) return;
  await Task.deleteMany({ projet: project._id });
  await project.deleteOne();
  res.json({ message: 'Projet et tâches associées supprimés' });
});
