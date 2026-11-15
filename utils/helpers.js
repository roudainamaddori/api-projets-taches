
 // Houni wrapper ykhalI ay erreur fi async function
 // temchi directement lel middleware mta3 les erreurs
exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Houni nescapiw les caracteres speciaux
// bech el recherche bel regex ma tetkasserch

exports.escapeRegex = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Houni na9blou ken texte normal mel query
// bech nemn3ou injection kima ?statut[$ne]=x
exports.texte = (valeur) => (typeof valeur === 'string' && valeur.trim() ? valeur.trim() : undefined);

// Houni na3mlou tri lel resultats
// ?sort=titre ya3ni ordre croissant
// ?sort=-titre ya3ni ordre decroissant
// Na9blou ken les champs autorises bech el query teb9a securisee
exports.buildSort = (sortParam, champsAutorises, parDefaut = '-createdAt') => {
  if (typeof sortParam !== 'string' || !sortParam) return parDefaut;
  const champ = sortParam.startsWith('-') ? sortParam.slice(1) : sortParam;
  return champsAutorises.includes(champ) ? sortParam : parDefaut;
};

// Houni n9arnou zouz IDs, ObjectId walla string
exports.memeId = (a, b) => Boolean(a) && Boolean(b) && String(a) === String(b);
