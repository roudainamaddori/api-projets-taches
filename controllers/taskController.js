
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { asyncHandler, escapeRegex, buildSort, texte, memeId } = require('../utils/helpers');

// Houni net2akdou elli el user elli bech nassigniwlou task mawjoud fel database
const utilisateurExiste = async (id) => Boolean(await User.findById(id));

// POST /api/projects/:projectId/tasks wala POST /api/tasks (avec projet fel body)
// Ay user connecté ynajem ya3mel task fi projet mta3ou, wel manager fi ay projet
exports.createTask = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId || req.body.projet;
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ message: 'Le projet est requis (champ "projet")' });
  }
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Projet introuvable' });

  const estManager = req.user.role === 'manager';
  if (!estManager && !memeId(project.proprietaire, req.user._id)) {
    return res.status(403).json({ message: 'Vous ne pouvez créer des tâches que dans vos projets' });
  }

  const { titre, description, statut, deadline, utilisateurAssigne } = req.body;

  // Ken el manager ynajem ya3mel assignation mta3 task lel user
  if (utilisateurAssigne) {
    if (!estManager) {
      return res.status(403).json({ message: 'Seul le manager peut affecter une tâche' });
    }
    if (!(await utilisateurExiste(utilisateurAssigne))) {
      return res.status(404).json({ message: 'Utilisateur à affecter introuvable' });
    }
  }

  const task = await Task.create({
    titre, description, statut, deadline,
    projet: project._id,
    utilisateurAssigne: utilisateurAssigne || null,
  });
  res.status(201).json(task);
});

// GET /api/projects/:projectId/tasks wala GET /api/tasks
// Bech nlawejou nesta3mlou search, bech nfiltriw statut, w bech nrattbou nesta3mlou sort
// Exemples : ?search=mot | ?statut=todo | ?sort=deadline | ?sort=-titre
exports.getTasks = asyncHandler(async (req, res) => {
  const conditions = [];
  const estManager = req.user.role === 'manager';

  if (req.params.projectId) {
    // Houni njibou les tasks mta3 projet mo3ayen
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    conditions.push({ projet: project._id });
    // Ken el user moch proprietaire, ychouf ken les tasks elli assigned lih
    if (!estManager && !memeId(project.proprietaire, req.user._id)) {
      conditions.push({ utilisateurAssigne: req.user._id });
    }
  } else if (!estManager) {
    // El user el 3adi ychouf tasks mta3 projets mta3ou w tasks elli assigned lih
    const mesProjets = await Project.find({ proprietaire: req.user._id }).distinct('_id');
    conditions.push({ $or: [{ projet: { $in: mesProjets } }, { utilisateurAssigne: req.user._id }] });
  }

  if (texte(req.query.statut)) conditions.push({ statut: texte(req.query.statut) });
  if (texte(req.query.assigne)) conditions.push({ utilisateurAssigne: texte(req.query.assigne) });
  if (texte(req.query.projet) && !req.params.projectId) conditions.push({ projet: texte(req.query.projet) });

  // Houni nlawejou fel titre w description mta3 task
  if (texte(req.query.search)) {
    const regex = new RegExp(escapeRegex(texte(req.query.search)), 'i');
    conditions.push({ $or: [{ titre: regex }, { description: regex }] });
  }

  const filtre = conditions.length ? { $and: conditions } : {};
  const sort = buildSort(req.query.sort, ['titre', 'statut', 'deadline', 'createdAt']);

 
  const tasks = await Task.find(filtre)
    .sort(sort)
    .populate('projet', 'nom')
    .populate('utilisateurAssigne', 'nom login');
  res.json(tasks);
});


// Houni njibou task w net2akdou chkoun 3andou el droit bech yaccessiha
// Ynajem ykoun manager, proprietaire mta3 projet, wala user elli assigned lih
const trouverTache = async (req, res) => {
  const task = await Task.findById(req.params.id).populate('projet', 'proprietaire');
  if (!task) {
    res.status(404).json({ message: 'Tâche introuvable' });
    return null;
  }
  const estManager = req.user.role === 'manager';
  const estProprietaire = Boolean(task.projet) && memeId(task.projet.proprietaire, req.user._id);
  const estAssigne = memeId(task.utilisateurAssigne, req.user._id);

  if (!estManager && !estProprietaire && !estAssigne) {
    res.status(403).json({ message: 'Accès interdit à cette tâche' });
    return null;
  }
  return { task, estManager, estProprietaire, estAssigne };
};

// GET /api/tasks/:id : Houni njibou task wa7da bel ID mta3ha
exports.getTask = asyncHandler(async (req, res) => {
  const resultat = await trouverTache(req, res);
  if (!resultat) return;
  res.json(resultat.task);
});

// PUT /api/tasks/:id : Houni nbaddlou les informations mta3 task
exports.updateTask = asyncHandler(async (req, res) => {
  const resultat = await trouverTache(req, res);
  if (!resultat) return;
  const { task, estManager, estProprietaire } = resultat;

  // El assignation mta3 task ynajem ya3melha ken el manager
  if (req.body.utilisateurAssigne !== undefined) {
    if (!estManager) {
      return res.status(403).json({ message: 'Seul le manager peut affecter une tâche' });
    }
    if (req.body.utilisateurAssigne && !(await utilisateurExiste(req.body.utilisateurAssigne))) {
      return res.status(404).json({ message: 'Utilisateur à affecter introuvable' });
    }
  }

  // Ken el user assigned lel task w moch manager wala proprietaire, ynajem ybaddel ken statut
  let champs = ['titre', 'description', 'statut', 'deadline', 'utilisateurAssigne'];
  if (!estManager && !estProprietaire) {
    const interdits = Object.keys(req.body).filter((c) => c !== 'statut');
    if (interdits.length) {
      return res.status(403).json({ message: 'Vous pouvez seulement modifier le statut de cette tâche' });
    }
    champs = ['statut'];
  }

  champs.forEach((champ) => {
    if (req.body[champ] !== undefined) task[champ] = req.body[champ] === '' ? undefined : req.body[champ];
  });
  await task.save(); // Houni na3mlou validation mta3 statut (todo/doing/done)
  res.json(task);
});

// PATCH /api/tasks/:id/assign : Ken el manager ynajem ya3mel assignation
// El route mahmiya bel restrictTo
// body: { "utilisateur": "<id>" } wala { "utilisateur": null } bech nna77iw el assignation
exports.assignTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

  const { utilisateur } = req.body;
  if (utilisateur === undefined) {
    return res.status(400).json({ message: 'Le champ "utilisateur" est requis' });
  }
  if (utilisateur === null) {
    task.utilisateurAssigne = null;
  } else {
    if (typeof utilisateur !== 'string') {
      return res.status(400).json({ message: 'Identifiant utilisateur invalide' });
    }
    const user = await User.findById(utilisateur);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    task.utilisateurAssigne = user._id;
  }
  await task.save();
  res.json(task);
});

// DELETE /api/tasks/:id : Ken el manager wala proprietaire mta3 projet ynajem yfasakh task
exports.deleteTask = asyncHandler(async (req, res) => {
  const resultat = await trouverTache(req, res);
  if (!resultat) return;
  if (!resultat.estManager && !resultat.estProprietaire) {
    return res.status(403).json({ message: 'Seul le propriétaire du projet ou le manager peut supprimer' });
  }
  await resultat.task.deleteOne();
  res.json({ message: 'Tâche supprimée' });
});
