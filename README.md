# API REST de Gestion de Projets et Tâches

DS1 - Mini-Projet - ISIDS (Express.js + MongoDB)

## Auteurs
- Roudaina MADDOURI

## Technologies
Node.js, Express.js, MongoDB (Mongoose), JWT (jsonwebtoken), bcryptjs, dotenv

## Installation
1. Installer les dépendances :
```bash
npm install
```
2. Copier `.env.example` en `.env` et renseigner les valeurs (le fichier `.env` n'est jamais envoyé sur GitHub) :
```bash
copy .env.example .env      # Windows
cp .env.example .env        # Linux / Mac
```
3. Créer le compte manager (une seule fois, avec `MANAGER_LOGIN` et `MANAGER_PASSWORD` du `.env`) :
```bash
npm run seed:manager
```
4. Lancer le serveur :
```bash
npm start
```
5. Lancer les tests automatiques (serveur démarré, dans un 2e terminal) :
```bash
npm test
```

## Rôles et sécurité
- `user` : crée des projets, gère ses propres projets et les tâches de ses projets.
- `manager` : voit tous les projets et toutes les tâches, peut affecter une tâche à un utilisateur.
- L'inscription publique (`/api/auth/register`) crée **toujours** un `user` : le champ `role` envoyé est ignoré.
- Le premier manager est créé par `npm run seed:manager`. Ensuite, un manager peut promouvoir un utilisateur avec `PATCH /api/users/:id/role`.
- Les mots de passe sont cryptés avec bcrypt. Les routes sont protégées par des middlewares (`protect` : JWT valide, `restrictTo('manager')` : rôle).

## Routes
Le token se passe dans le header : `Authorization: Bearer <token>`

### Authentification
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/auth/register | public | Créer un compte `user` (`nom`, `login`, `motDePasse`) |
| POST | /api/auth/login | public | Connexion, retourne un token JWT |
| GET | /api/auth/me | connecté | Profil courant |

### Utilisateurs (manager uniquement)
| Méthode | Route | Description |
|---|---|---|
| GET | /api/users | Lister les utilisateurs |
| PATCH | /api/users/:id/role | Changer le rôle (`{"role": "manager"}`) |

### Projets
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/projects | connecté | Créer un projet |
| GET | /api/projects | connecté | Manager : tous les projets. User : les siens |
| GET / PUT / DELETE | /api/projects/:id | propriétaire ou manager | Détail, modification, suppression (supprime aussi ses tâches) |

### Tâches
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /api/projects/:projectId/tasks | propriétaire du projet ou manager | Créer une tâche dans un projet |
| POST | /api/tasks | propriétaire du projet ou manager | Idem, avec `"projet": "<id>"` dans le body |
| GET | /api/projects/:projectId/tasks | connecté | Tâches d'un projet (un non-propriétaire ne voit que ses tâches affectées) |
| GET | /api/tasks | connecté | Manager : toutes. User : tâches de ses projets + tâches qui lui sont affectées |
| GET | /api/tasks/:id | manager, propriétaire, utilisateur affecté | Détail |
| PUT | /api/tasks/:id | manager, propriétaire (tous les champs) ; utilisateur affecté (statut seulement) | Modification |
| PATCH | /api/tasks/:id/assign | **manager** | Affecter (`{"utilisateur": "<id>"}`) ou désaffecter (`{"utilisateur": null}`) |
| DELETE | /api/tasks/:id | manager ou propriétaire du projet | Suppression |

Le statut d'une tâche est limité à `todo`, `doing`, `done`. Le statut d'un projet : `en cours`, `terminé`, `en pause`.

## Recherche et tri
- Projets : `?search=mot` (nom, description), `?statut=en cours`, `?sort=nom` ou `?sort=-createdAt` (tri : `nom`, `statut`, `createdAt`)
- Tâches : `?search=mot` (titre, description), `?statut=todo`, `?assigne=<userId>`, `?sort=deadline` ou `?sort=-titre` (tri : `titre`, `statut`, `deadline`, `createdAt`)

## Tests
- Automatiques : `npm test`
- Manuels : fichier `requests.http` (extension REST Client de VS Code)
