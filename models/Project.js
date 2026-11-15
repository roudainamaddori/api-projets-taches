
const mongoose = require('mongoose');

// Houni ndefiniw el schema mta3 projet
const projectSchema = new mongoose.Schema({
  nom: { type: String, required: [true, 'Le nom du projet est requis'], trim: true },
  description: { type: String, trim: true },
  // Houni n7ottou ID mta3 el user elli houwa proprietaire mta3 projet
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  statut: {
    type: String,
    enum: { values: ['en cours', 'terminé', 'en pause'], message: 'Statut projet invalide (en cours, terminé, en pause)' },
    default: 'en cours',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
