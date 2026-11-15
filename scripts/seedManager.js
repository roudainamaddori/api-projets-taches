
// Houni 3anna script bech na3mlou awel compte manager
// Bech nchaghlouh nesta3mlou commande : npm run seed:manager
// Les informations mta3 el manager njibouhom mel fichier .env
// MANAGER_NOM, MANAGER_LOGIN w MANAGER_PASSWORD
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const { MONGO_URI, MANAGER_NOM, MANAGER_LOGIN, MANAGER_PASSWORD } = process.env;
  if (!MONGO_URI || !MANAGER_LOGIN || !MANAGER_PASSWORD) {
    console.error('Definissez MONGO_URI, MANAGER_LOGIN et MANAGER_PASSWORD dans .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI);
    const existant = await User.findOne({ login: MANAGER_LOGIN });
    if (existant) {
      if (existant.role !== 'manager') {
        existant.role = 'manager';
        await existant.save();
        console.log(`"${MANAGER_LOGIN}" existait : promu manager`);
      } else {
        console.log(`Le manager "${MANAGER_LOGIN}" existe deja`);
      }
    } else {
      await User.create({ nom: MANAGER_NOM || 'Manager', login: MANAGER_LOGIN, motDePasse: MANAGER_PASSWORD, role: 'manager' });
      console.log(`Manager "${MANAGER_LOGIN}" cree`);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Erreur :', err.message);
    process.exit(1);
  }
})();
