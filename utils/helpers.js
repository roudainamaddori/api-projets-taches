// wrapper يخلي أي خطأ في async function يمشي للـ middleware متاع الأخطاء
exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// نهرّبو الحروف الخاصة باش البحث (regex) ما يخربش
exports.escapeRegex = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// نقبلو برك النص العادي من الـ query (نمنعو حقن مثل ?statut[$ne]=x)
exports.texte = (valeur) => (typeof valeur === 'string' && valeur.trim() ? valeur.trim() : undefined);

// نبنيو الترتيب: ?sort=titre (تصاعدي) ولا ?sort=-titre (تنازلي)
// نقبلو برك الحقول المسموحة باش حد ما يلعب بالـ query
exports.buildSort = (sortParam, champsAutorises, parDefaut = '-createdAt') => {
  if (typeof sortParam !== 'string' || !sortParam) return parDefaut;
  const champ = sortParam.startsWith('-') ? sortParam.slice(1) : sortParam;
  return champsAutorises.includes(champ) ? sortParam : parDefaut;
};

// نقارنو زوز IDs (ObjectId ولا string)
exports.memeId = (a, b) => Boolean(a) && Boolean(b) && String(a) === String(b);
