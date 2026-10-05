# AISEGF’26 Checklist — version tableau

Cette version affiche toute la checklist dans un tableau partagé, plus facile à remplir et à lire.

## Fichiers
- `index.html` : interface du tableau
- `style.css` : design
- `app.js` : données + Firestore + sauvegarde automatique
- `firebase-config.js` : configuration Firebase déjà renseignée
- `firestore.rules` : exemple de règles Firestore

## Publication GitHub Pages
1. Créez un dépôt GitHub.
2. Importez tous les fichiers de ce dossier à la racine du dépôt.
3. Ouvrez `Settings > Pages`.
4. Choisissez `Deploy from a branch`.
5. Sélectionnez `main` puis `/root` et cliquez sur Save.

## Firestore
La collection utilisée est `conferenceChecklist`.
Chaque ligne est enregistrée dans un document séparé.

La page effectue une sauvegarde automatique après modification et possède aussi un bouton `Enregistrer tout`.
