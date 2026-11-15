
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Houni ndefiniw el schema mta3 el user
const userSchema = new mongoose.Schema({
  nom: { type: String, required: [true, 'Le nom est requis'], trim: true },

  // El login lezem ykoun unique, ma ynajmouch zouz users 3andhom nafs el login
  login: { type: String, required: [true, 'Le login est requis'], unique: true, trim: true },

  // select:false ya3ni motDePasse ma yerja3ch fel resultat ken ki notlbouh explicitement
  motDePasse: { type: String, required: [true, 'Le mot de passe est requis'], minlength: 6, select: false },

  // El role mta3 el user ynajem ykoun user wala manager bark
  role: { type: String, enum: { values: ['user', 'manager'], message: 'Rôle invalide (user ou manager)' }, default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

// 9bal ma nsajlou el user fel database, na3mlou hash lel mot de passe bel bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
});

// Houni na3mlou fonction t9aren mot de passe elli da5lou el user bel mot de passe crypté
userSchema.methods.comparePassword = function (motDePasseSaisi) {
  return bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

module.exports = mongoose.model('User', userSchema);
