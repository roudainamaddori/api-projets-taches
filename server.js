// نجيبو المتغيرات متاع .env (الـ port، رابط الداتابيز، السر متاع JWT)
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();

// باش السيرفر يفهم الـ JSON اللي يجي في body متاع الطلب
app.use(express.json());

// الروتات الرئيسية متاع التطبيق
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// إذا الروت ما موجودش نرجعو 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// middleware متاع الأخطاء: كل خطأ يوصل هنا ونرجعو رد مرتب
app.use((err, req, res, next) => {
  // خطأ validation متاع mongoose (مثلا status غالط أو champ مطلوب ناقص)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Données invalides', details: messages });
  }
  // ID غالط (ما يشبهش ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Valeur invalide pour ${err.path}` });
  }
  // login مكرر (unique)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Ce login existe déjà' });
  }
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;

// نتصلو بالداتابيز الأول، وبعدها نحلو السيرفر
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
});
