
 // Houni njibou les variables mta3 fichier .env
// Kima el PORT, lien mta3 MongoDB w secret mta3 JWT
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

// Houni net2akdou elli MONGO_URI w JWT_SECRET mawjoudin
// Ken fama variable na9sa, nwa9fou el serveur w naffichiw erreur
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Erreur : MONGO_URI et JWT_SECRET doivent etre definis dans le fichier .env');
  process.exit(1);
}

const app = express();

// Houni nkhalliw el serveur yefhem les donnees JSON elli yjiw fel body mta3 request
app.use(express.json());

// Ki n7ellou el adresse principale, el API trajja3 message
app.get('/', (req, res) => {
  res.json({ message: 'API de gestion de projets et taches' });
});

// Houni nrabtou les routes principales mta3 el application
// Kol route twasselna lel fichier elli mas2oul 3liha
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Ken el route elli talabha el user moch mawjoud, narj3ou erreur 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// Houni middleware elli yetkafal bel erreurs mta3 el application
app.use((err, req, res, next) => {

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON invalide' });
  }

  // Ken fama erreur validation fel Mongoose
  // Kima statut ghalet wala champ obligatoire na9es
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Données invalides', details: messages });
  }

  // Ken el ID ghalet w moch compatible m3a ObjectId, narj3ou 400
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Valeur invalide pour ${err.path}` });
  }

  // Ken el login deja mawjoud fel base de donnees, narj3ou 409
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Ce login existe déjà' });
  }

  // Ken fama erreur okhra, naffichiwha fel terminal w narj3ou 500
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur' });
});

// Houni n7adddou el PORT mta3 serveur
// Ken ma fama ch PORT fel .env, nesta3mlou 3000
const PORT = process.env.PORT || 3000;

// Houni netasslou bel MongoDB 9bal ma n7ellou el serveur
// Ki el connexion tenja7, el serveur yabda yekhdem
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
});
