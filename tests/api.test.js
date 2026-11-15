
 // Houni 3anna des tests automatiques lel API
 // Nchaghlou el serveur bel npm start, ba3d fi terminal ekher na3mlou npm test
 // Lezem compte manager ykoun mawjoud bel npm run seed:manager
 // W fichier .env fih MANAGER_LOGIN w MANAGER_PASSWORD
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const BASE = `http://localhost:${process.env.PORT || 3000}/api`;
const suffixe = Date.now().toString().slice(-6);

// Houni na7sbou 9addech men test naj7ou w 9addech men test fchlou
let ok = 0;
let ko = 0;

// Houni fonction tab3ath requete HTTP lel API
// Ken fama token, nab3thouh m3a el requete
// W trajja3lna status w data
async function appel(methode, chemin, token, corps) {
  const res = await fetch(BASE + chemin, {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* Houni el reponse ma fihech JSON */ }
  return { status: res.status, data };
}

// Houni fonction tverifi condition
// Ken s7i7a taffichi OK, sinon taffichi ECHEC
function verifier(nom, condition, detail = '') {
  if (condition) { ok++; console.log(`  OK   ${nom}`); }
  else { ko++; console.log(`  ECHEC ${nom} ${detail}`); }
}

(async () => {
  console.log(`Tests sur ${BASE}\n`);

  // Houni ntestiw el authentification JWT w les roles mta3 les utilisateurs
  console.log('Authentification et roles');
  const a = await appel('POST', '/auth/register', null, { nom: 'Test A', login: `test_a_${suffixe}`, motDePasse: '123456', role: 'manager' });
  verifier('register cree un compte (201)', a.status === 201, a.status);
  verifier('register ignore role=manager (securite)', a.data?.user?.role === 'user', JSON.stringify(a.data?.user));
  const b = await appel('POST', '/auth/register', null, { nom: 'Test B', login: `test_b_${suffixe}`, motDePasse: '123456' });
  const doublon = await appel('POST', '/auth/register', null, { nom: 'Test A', login: `test_a_${suffixe}`, motDePasse: '123456' });
  verifier('login deja utilise -> 409', doublon.status === 409, doublon.status);
  const courtMdp = await appel('POST', '/auth/register', null, { nom: 'X', login: `test_c_${suffixe}`, motDePasse: '1' });
  verifier('mot de passe trop court -> 400', courtMdp.status === 400, courtMdp.status);
  const mauvais = await appel('POST', '/auth/login', null, { login: `test_a_${suffixe}`, motDePasse: 'faux' });
  verifier('mauvais mot de passe -> 401', mauvais.status === 401, mauvais.status);
  const injection = await appel('POST', '/auth/login', null, { login: { $ne: null }, motDePasse: { $ne: null } });
  verifier('injection NoSQL sur login refusee (400)', injection.status === 400, injection.status);
  const sansToken = await appel('GET', '/projects');
  verifier('route protegee sans token -> 401', sansToken.status === 401, sansToken.status);
  const tokenFaux = await appel('GET', '/projects', 'abc.def.ghi');
  verifier('token invalide -> 401', tokenFaux.status === 401, tokenFaux.status);

  const tA = a.data.token;
  const tB = b.data.token;
  const idB = b.data.user.id;
  const m = await appel('POST', '/auth/login', null, { login: process.env.MANAGER_LOGIN, motDePasse: process.env.MANAGER_PASSWORD });
  verifier('login du manager (npm run seed:manager fait ?)', m.status === 200 && m.data.user.role === 'manager', m.status);
  const tM = m.data?.token;
  if (!tM) { console.log('\nArret : manager introuvable.'); process.exit(1); }

  const usersParUser = await appel('GET', '/users', tA);
  verifier('user ne peut pas lister les utilisateurs (403)', usersParUser.status === 403, usersParUser.status);
  const usersParManager = await appel('GET', '/users', tM);
  verifier('manager liste les utilisateurs (200)', usersParManager.status === 200 && Array.isArray(usersParManager.data));
  const promo = await appel('PATCH', `/users/${idB}/role`, tA, { role: 'manager' });
  verifier('user ne peut pas se faire promouvoir (403)', promo.status === 403, promo.status);

  // Houni ntestiw creation des projets, les autorisations, recherche w tri
  console.log('\nProjets');
  const pA = await appel('POST', '/projects', tA, { nom: `Site web ${suffixe}`, description: 'Refonte', statut: 'en cours' });
  verifier('user cree un projet (201)', pA.status === 201 && pA.data.proprietaire === a.data.user.id, pA.status);
  const pB = await appel('POST', '/projects', tB, { nom: `Application ${suffixe}`, description: 'Mobile' });
  const sansNom = await appel('POST', '/projects', tA, { description: 'x' });
  verifier('projet sans nom -> 400', sansNom.status === 400, sansNom.status);
  const statutPFaux = await appel('POST', '/projects', tA, { nom: 'x', statut: 'nimporte' });
  verifier('statut projet invalide -> 400', statutPFaux.status === 400, statutPFaux.status);
  const listeA = await appel('GET', '/projects', tA);
  verifier('user voit seulement ses projets', listeA.data.length === 1 && listeA.data[0]._id === pA.data._id, listeA.data?.length);
  const listeM = await appel('GET', '/projects', tM);
  const idsM = listeM.data.map((p) => p._id);
  verifier('manager voit tous les projets', idsM.includes(pA.data._id) && idsM.includes(pB.data._id));
  const autreProjet = await appel('GET', `/projects/${pB.data._id}`, tA);
  verifier("user ne voit pas le projet d'un autre (403)", autreProjet.status === 403, autreProjet.status);
  const rech = await appel('GET', `/projects?search=refonte`, tA);
  verifier('recherche de projets', rech.data.length === 1);
  const rechMaj = await appel('GET', `/projects?search=${encodeURIComponent('.*')}`, tA);
  verifier('recherche avec caracteres speciaux sans erreur', rechMaj.status === 200, rechMaj.status);
  const triProj = await appel('GET', '/projects?sort=-nom', tM);
  const noms = triProj.data.map((p) => p.nom);
  verifier('tri des projets (nom decroissant)', JSON.stringify(noms) === JSON.stringify([...noms].sort().reverse()));
  const idInvalide = await appel('GET', '/projects/123', tA);
  verifier('id invalide -> 400', idInvalide.status === 400, idInvalide.status);

  // Houni ntestiw creation des tasks, statut w assignation
  console.log('\nTaches');
  const t1 = await appel('POST', `/projects/${pA.data._id}/tasks`, tA, { titre: 'Maquette', description: 'Faire la maquette', deadline: '2026-12-01' });
  verifier('creation de tache dans un projet (201)', t1.status === 201 && t1.data.statut === 'todo', t1.status);
  const t2 = await appel('POST', '/tasks', tA, { titre: 'Base de donnees', projet: pA.data._id, deadline: '2026-11-20' });
  verifier('POST /api/tasks avec "projet" dans le body (201)', t2.status === 201, t2.status);
  const sansProjet = await appel('POST', '/tasks', tA, { titre: 'Orpheline' });
  verifier('POST /api/tasks sans projet -> 400', sansProjet.status === 400, sansProjet.status);
  const statutFaux = await appel('POST', `/projects/${pA.data._id}/tasks`, tA, { titre: 'Test', statut: 'fini' });
  verifier('statut de tache invalide -> 400', statutFaux.status === 400, statutFaux.status);
  const sansTitre = await appel('POST', `/projects/${pA.data._id}/tasks`, tA, { description: 'x' });
  verifier('tache sans titre -> 400', sansTitre.status === 400, sansTitre.status);
  const chezAutre = await appel('POST', `/projects/${pB.data._id}/tasks`, tA, { titre: 'Intrus' });
  verifier("user ne cree pas de tache dans le projet d'un autre (403)", chezAutre.status === 403, chezAutre.status);
  const parManager = await appel('POST', `/projects/${pB.data._id}/tasks`, tM, { titre: 'Tache du manager' });
  verifier('manager cree une tache dans un projet quelconque (201)', parManager.status === 201, parManager.status);
  const projetInconnu = await appel('POST', '/projects/aaaaaaaaaaaaaaaaaaaaaaaa/tasks', tA, { titre: 'x' });
  verifier('projet inexistant -> 404', projetInconnu.status === 404, projetInconnu.status);

  console.log('\nAffectation (manager uniquement)');
  const creeAvecAssign = await appel('POST', `/projects/${pA.data._id}/tasks`, tA, { titre: 'Triche', utilisateurAssigne: idB });
  verifier("user ne peut pas affecter a la creation (403)", creeAvecAssign.status === 403, creeAvecAssign.status);
  const assignUser = await appel('PATCH', `/tasks/${t1.data._id}/assign`, tA, { utilisateur: idB });
  verifier('user ne peut pas affecter (403)', assignUser.status === 403, assignUser.status);
  const putAssign = await appel('PUT', `/tasks/${t1.data._id}`, tA, { utilisateurAssigne: idB });
  verifier('user ne peut pas affecter via PUT (403)', putAssign.status === 403, putAssign.status);
  const assignManager = await appel('PATCH', `/tasks/${t1.data._id}/assign`, tM, { utilisateur: idB });
  verifier('manager affecte la tache (200)', assignManager.status === 200 && assignManager.data.utilisateurAssigne === idB, assignManager.status);
  const assignFaux = await appel('PATCH', `/tasks/${t1.data._id}/assign`, tM, { utilisateur: 'aaaaaaaaaaaaaaaaaaaaaaaa' });
  verifier('affecter a un utilisateur inexistant -> 404', assignFaux.status === 404, assignFaux.status);

  console.log('\nAutorisations sur les taches');
  const bVoit = await appel('GET', `/tasks/${t1.data._id}`, tB);
  verifier("l'utilisateur affecte voit sa tache (200)", bVoit.status === 200, bVoit.status);
  const bStatut = await appel('PUT', `/tasks/${t1.data._id}`, tB, { statut: 'doing' });
  verifier("l'utilisateur affecte change le statut (200)", bStatut.status === 200 && bStatut.data.statut === 'doing', bStatut.status);
  const bTitre = await appel('PUT', `/tasks/${t1.data._id}`, tB, { titre: 'Pirate' });
  verifier("l'utilisateur affecte ne change pas le titre (403)", bTitre.status === 403, bTitre.status);
  const bSuppr = await appel('DELETE', `/tasks/${t1.data._id}`, tB);
  verifier("l'utilisateur affecte ne supprime pas la tache (403)", bSuppr.status === 403, bSuppr.status);
  const bAutre = await appel('GET', `/tasks/${t2.data._id}`, tB);
  verifier("un user sans lien avec la tache est refuse (403)", bAutre.status === 403, bAutre.status);
  const bListeProjet = await appel('GET', `/projects/${pA.data._id}/tasks`, tB);
  verifier("liste d'un projet d'autrui : seulement ses taches affectees", bListeProjet.status === 200 && bListeProjet.data.length === 1, bListeProjet.data?.length);
  const aStatutFaux = await appel('PUT', `/tasks/${t1.data._id}`, tA, { statut: 'termine' });
  verifier('PUT avec statut invalide -> 400', aStatutFaux.status === 400, aStatutFaux.status);
  const aTitre = await appel('PUT', `/tasks/${t1.data._id}`, tA, { titre: 'Maquette V2' });
  verifier('proprietaire modifie sa tache (200)', aTitre.status === 200 && aTitre.data.titre === 'Maquette V2', aTitre.status);

  console.log('\nListes, recherche et tri des taches');
  const globalA = await appel('GET', '/tasks', tA);
  verifier('GET /api/tasks : user voit les taches de ses projets', globalA.status === 200 && globalA.data.length === 2, globalA.data?.length);
  const globalB = await appel('GET', '/tasks', tB);
  const idsB = globalB.data.map((t) => t._id);
  verifier("GET /api/tasks : user voit les taches qui lui sont affectees", idsB.includes(t1.data._id) && !idsB.includes(t2.data._id));
  const globalM = await appel('GET', '/tasks', tM);
  verifier('GET /api/tasks : manager voit toutes les taches', globalM.data.length >= 3, globalM.data?.length);
  const tri = await appel('GET', `/projects/${pA.data._id}/tasks?sort=deadline`, tA);
  verifier('tri par deadline croissante', tri.data[0].titre === 'Base de donnees', tri.data[0]?.titre);
  const triDesc = await appel('GET', `/projects/${pA.data._id}/tasks?sort=-titre`, tA);
  verifier('tri par titre decroissant', triDesc.data[0].titre === 'Maquette V2', triDesc.data[0]?.titre);
  const filtreStatut = await appel('GET', `/projects/${pA.data._id}/tasks?statut=doing`, tA);
  verifier('filtre par statut', filtreStatut.data.length === 1 && filtreStatut.data[0].statut === 'doing');
  const rechTache = await appel('GET', `/tasks?search=${encodeURIComponent('base de')}`, tA);
  verifier('recherche de taches', rechTache.data.length === 1 && rechTache.data[0].titre === 'Base de donnees', rechTache.data?.length);
  const injectionStatut = await appel('GET', '/tasks?statut[$ne]=x', tA);
  verifier("injection NoSQL dans la query ignoree", injectionStatut.status === 200 && injectionStatut.data.length === 2, injectionStatut.status);

  console.log('\nRoles : promotion par un manager');
  const promoM = await appel('PATCH', `/users/${idB}/role`, tM, { role: 'manager' });
  verifier('manager promeut un utilisateur (200)', promoM.status === 200 && promoM.data.role === 'manager', promoM.status);
  const promoFaux = await appel('PATCH', `/users/${idB}/role`, tM, { role: 'admin' });
  verifier('role invalide -> 400', promoFaux.status === 400, promoFaux.status);

  console.log('\nSuppression');
  const supprProj = await appel('DELETE', `/projects/${pA.data._id}`, tA);
  verifier('proprietaire supprime son projet et ses taches (200)', supprProj.status === 200, supprProj.status);
  const tacheApres = await appel('GET', `/tasks/${t1.data._id}`, tM);
  verifier('les taches du projet sont supprimees (404)', tacheApres.status === 404, tacheApres.status);
  await appel('DELETE', `/projects/${pB.data._id}`, tM);

  // Houni nafs5ou les comptes mta3 tests mel database bech ma yab9awch
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({ login: /^test_/ });
  await mongoose.disconnect();

  console.log(`\nResultat : ${ok} reussis, ${ko} echecs`);
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error('Erreur pendant les tests :', e.message); process.exit(1); });
