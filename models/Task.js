const mongoose = require('mongoose');

// الـ schema متاع التاسك
const taskSchema = new mongoose.Schema({
  titre: { type: String, required: [true, 'Le titre est requis'], trim: true },
  description: { type: String, trim: true },
  // الـ statut لازم يكون واحد من الثلاثة هاذم برك
  statut: {
    type: String,
    enum: { values: ['todo', 'doing', 'done'], message: 'Statut invalide (todo, doing, done)' },
    default: 'todo',
  },
  deadline: { type: Date },
  // المشروع اللي التاسك تابعة ليه
  projet: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  // المستخدم اللي تعيّنت ليه التاسك (manager برك يعيّن)
  utilisateurAssigne: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
