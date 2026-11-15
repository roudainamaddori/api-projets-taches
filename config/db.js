
const mongoose = require('mongoose');

// Houni na3mlou connexion m3a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');
  } catch (err) {
    // Ken el connexion ma naj7etch, naffichiw el erreur w nwa9fou el programme
    console.error('Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
