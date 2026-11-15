
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware 1 : Houni net2akdou elli el user connecté w 3andou token s7i7
exports.protect = async (req, res, next) => {
  try {
    // El token yji fel header haka : Authorization: Bearer xxxxx
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant, veuillez vous connecter' });
    }
    const token = header.split(' ')[1];

    // Houni nverifiw el token ken s7i7 w mazelt validité mta3ou
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Houni nlawejou 3al user fel database
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    // Houni n7ottou el user fi req bech nesta3mlouh fel reste mta3 el code
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// Middleware 2 : Houni n5alliw ken les roles elli 3andhom el droit
// Exemple : restrictTo('manager')
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Accès interdit : vous n'avez pas le droit" });
  }
  next();
};
