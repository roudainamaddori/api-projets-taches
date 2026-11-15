
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// Houni na3mlou fonction bech ngeneriw token JWT
const genererToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

// POST /api/auth/register : Houni na3mlou compte jdid
// El compte elli yetcrea bel register dima role mta3ou user
// El manager yetcrea bel script npm run seed:manager
// Wala manager ekher ynajem yra99i user lel role manager
exports.register = asyncHandler(async (req, res) => {
  const { nom, login, motDePasse } = req.body;
  if ([nom, login, motDePasse].some((v) => typeof v !== 'string')) {
    return res.status(400).json({ message: 'nom, login et motDePasse sont requis (texte)' });
  }

  // 7atta ken el user yab3ath role fel request, netjahلوه
  const user = await User.create({ nom, login, motDePasse, role: 'user' });
  res.status(201).json({
    token: genererToken(user._id),
    user: { id: user._id, nom: user.nom, login: user.login, role: user.role },
  });
});

// POST /api/auth/login : Houni el user ya3mel login
exports.login = asyncHandler(async (req, res) => {
  const { login, motDePasse } = req.body;
  if (typeof login !== 'string' || typeof motDePasse !== 'string' || !login || !motDePasse) {
    return res.status(400).json({ message: 'Login et mot de passe requis' });
  }

  // Houni nesta3mlou select bech njibou motDePasse khater makhbi par defaut
  const user = await User.findOne({ login }).select('+motDePasse');
  if (!user || !(await user.comparePassword(motDePasse))) {
    return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
  }
  res.json({
    token: genererToken(user._id),
    user: { id: user._id, nom: user.nom, login: user.login, role: user.role },
  });
});

// GET /api/auth/me : Houni njibou les informations mta3 el user elli connecté
exports.me = (req, res) => {
  res.json(req.user);
};
