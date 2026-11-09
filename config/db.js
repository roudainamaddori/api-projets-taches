const mongoose = require('mongoose');

// فونكسيون تعمل الاتصال بـ MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');
  } catch (err) {
    // إذا ما نجمش يتصل، نوقفو البرنامج ونطبعو السبب
    console.error('Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
