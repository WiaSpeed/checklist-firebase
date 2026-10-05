# AISEGF’26 Checklist — GitHub Pages + Firebase

Projet statique très simple : HTML/CSS/JavaScript + Firebase Firestore.

## 1. Créer Firebase
1. Ouvrez https://console.firebase.google.com/
2. Créez un projet.
3. Build > Firestore Database > Create database.
4. Project settings > Your apps > Web > créez une application Web.
5. Copiez les valeurs `firebaseConfig` dans `firebase-config.js`.

## 2. Règles Firestore (version la plus simple)
Dans Firestore > Rules, copiez le contenu de `firestore.rules`, puis Publish.

⚠️ Ces règles autorisent toute personne ayant le lien à lire et modifier la checklist. C'est pratique pour une checklist partagée, mais ce n'est pas adapté à des données sensibles.

## 3. Publier sur GitHub Pages
1. Créez un nouveau repository GitHub.
2. Uploadez les fichiers de ce dossier à la racine du repository.
3. GitHub > Settings > Pages.
4. Source: Deploy from a branch.
5. Branch: `main` / `(root)` puis Save.
6. GitHub affichera l'URL publique du site.

## Fichiers
- `index.html` : interface
- `style.css` : design responsive
- `app.js` : tâches + logique Firebase
- `firebase-config.js` : votre configuration Firebase
- `firestore.rules` : règles simples de partage

## Sécurité — amélioration recommandée
Pour un usage public réel, ajoutez Firebase Authentication ou limitez l'écriture à des utilisateurs autorisés. Les clés Firebase Web ne sont pas des mots de passe : la sécurité repose surtout sur les règles Firestore.
