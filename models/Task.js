
const mongoose = require('mongoose');

// Houni ndefiniw el schema mta3 task
const taskSchema = new mongoose.Schema({
  titre: { type: String, required: [true, 'Le titre est requis'], trim: true },
  description: { type: String, trim: true },

  // El statut mta3 task lezem ykoun todo wala doing wala done
  statut: {
    type: String,
    enum: { values: ['todo', 'doing', 'done'], message: 'Statut invalide (todo, doing, done)' },
    default: 'todo',
  },
  deadline: { type: Date },

  // Houni n7ottou ID mta3 projet elli task tab3a lih
  projet: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },

  // Houni n7ottou ID mta3 el user elli task assigned lih
  // Ken el manager ynajem ya3mel assignation
  utilisateurAssigne: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);

