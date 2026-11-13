const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// فونكسيون تصنع الـ token JWT
const genererToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

// POST /api/auth/register : إنشاء حساب جديد
// أمان: الحساب العمومي يتعمل دايما بدور "user".
// الـ manager يتعمل بالسكريبت (npm run seed:manager) ولا manager آخر يرقّي مستخدم.
exports.register = asyncHandler(async (req, res) => {
  const { nom, login, motDePasse } = req.body;
  if ([nom, login, motDePasse].some((v) => typeof v !== 'string')) {
    return res.status(400).json({ message: 'nom, login et motDePasse sont requis (texte)' });
  }
  // حتى كان المستخدم يبعث role في الطلب، نتجاهلوه
  const user = await User.create({ nom, login, motDePasse, role: 'user' });
  res.status(201).json({
    token: genererToken(user._id),
    user: { id: user._id, nom: user.nom, login: user.login, role: user.role },
  });
});

// POST /api/auth/login : تسجيل الدخول
exports.login = asyncHandler(async (req, res) => {
  const { login, motDePasse } = req.body;
  if (typeof login !== 'string' || typeof motDePasse !== 'string' || !login || !motDePasse) {
    return res.status(400).json({ message: 'Login et mot de passe requis' });
  }
  // select('+motDePasse') لأنو مخبّي par défaut
  const user = await User.findOne({ login }).select('+motDePasse');
  if (!user || !(await user.comparePassword(motDePasse))) {
    return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
  }
  res.json({
    token: genererToken(user._id),
    user: { id: user._id, nom: user.nom, login: user.login, role: user.role },
  });
});

// GET /api/auth/me : معلومات المستخدم المتصل
exports.me = (req, res) => {
  res.json(req.user);
};
