const jwt = require('jsonwebtoken');
const User = require('../models/User');

// middleware 1: يتأكد إلي المستخدم مسجل دخول (عندو token صحيح)
exports.protect = async (req, res, next) => {
  try {
    // الـ token يجي في header هكا: Authorization: Bearer xxxxx
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant, veuillez vous connecter' });
    }
    const token = header.split(' ')[1];

    // نفكو الـ token ونتأكدو إلي صحيح وما فاتش وقتو
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // نلوجو على المستخدم في الداتابيز
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    // نحطو المستخدم في req باش البقية متاع الكود تستعملو
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// middleware 2: يسمح برك للأدوار المحددة (مثلا restrictTo('manager'))
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Accès interdit : vous n'avez pas le droit" });
  }
  next();
};
