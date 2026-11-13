const User = require('../models/User');
const { asyncHandler, memeId } = require('../utils/helpers');

// GET /api/users : manager برك يشوف قائمة المستخدمين (باش يعرف الـ IDs للتعيين)
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('nom');
  res.json(users);
});

// PATCH /api/users/:id/role : manager برك يبدّل دور مستخدم (user ↔ manager)
exports.updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide (user ou manager)' });
  }
  // نمنعو الـ manager يبدّل دور روحو (باش ما يبقاوش بلا manager)
  if (memeId(req.params.id, req.user._id)) {
    return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  user.role = role;
  await user.save();
  res.json({ id: user._id, nom: user.nom, login: user.login, role: user.role });
});
