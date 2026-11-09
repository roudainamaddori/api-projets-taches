const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// الـ schema متاع المستخدم
const userSchema = new mongoose.Schema({
  nom: { type: String, required: [true, 'Le nom est requis'], trim: true },
  // login لازم يكون وحيد (unique)
  login: { type: String, required: [true, 'Le login est requis'], unique: true, trim: true },
  // select:false يعني ما يرجعش مع النتائج كان نطلبوه بالقوة
  motDePasse: { type: String, required: [true, 'Le mot de passe est requis'], minlength: 6, select: false },
  // الدور: user ولا manager برك
  role: { type: String, enum: { values: ['user', 'manager'], message: 'Rôle invalide (user ou manager)' }, default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

// قبل ما نسجلو المستخدم، نكريبتيو الـ mot de passe بـ bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
});

// فونكسيون تقارن الـ mot de passe المكتوب بالمكريبتي
userSchema.methods.comparePassword = function (motDePasseSaisi) {
  return bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

module.exports = mongoose.model('User', userSchema);
