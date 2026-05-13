# ChimioPro - CHNCAK

Application web restructurée à partir de `INDEX.html`, sans modification volontaire de l'interface ni du contenu.

## Structure

- `index.html` : structure HTML et contenu de l'application.
- `css/styles.css` : styles globaux extraits du fichier original.
- `js/auth.js` : authentification et gestion de session.
- `js/main.js` : logique principale de ChimioPro.
- `js/dashboard.js` : tableau de bord opérationnel.
- `js/rdv.js` : gestion des rendez-vous.
- `js/enhancements.js` : améliorations d'interface et contrôles additionnels.
- `js/clinical-modules.js` : modules de suivi, biologie et indicateurs cliniques.
- `js/data-tools.js` : recherche globale, sauvegarde/restauration JSON et état des données locales.
- `js/protocol-editor.js` : ajout et gestion des protocoles personnalisés.
- `js/app-polish.js` : finitions visuelles et rapports.
- `js/requested-improvements.js` : corrections métier demandées, emails via client mail, unicité du code gratuité, étiquettes flacons, statistiques enrichies et conversion créatinine.

## Lancement

Ouvrir `index.html` dans un navigateur, ou servir le dossier avec votre serveur local habituel.

## Outils ajoutés

- `Recherche` ou `Ctrl+K` : retrouve rapidement un patient, un rendez-vous, un protocole ou une trace d'historique.
- `Sauvegarder` : exporte les données locales dans un fichier JSON.
- `Restaurer` : réimporte une sauvegarde JSON.
- `Etat` : affiche un résumé local des patients, rendez-vous, historiques et blocs stockés.

## Notes importantes

- Les données restent stockées dans le navigateur (`localStorage`) avec les mêmes clés `chncak_*`; cette version ne les efface pas.
- Avant toute mise en ligne ou changement de navigateur, utiliser le bouton `Sauvegarder` pour garder une copie JSON des données, puis `Restaurer` si besoin.
- Une publication GitHub remplace seulement les fichiers de l'application. Elle ne supprime pas automatiquement les données déjà enregistrées dans le navigateur local.
- Les emails sont préparés avec `mailto:` car l'application est statique. Un envoi automatique réel nécessitera un petit backend ou un service email sécurisé.
- L'import du modèle Excel du programme sera ajusté quand le fichier modèle sera fourni.
- L'onglet Aperçu permet de retrouver un protocole sauvegardé par patient/code gratuité.
- L'onglet Pharmacie Centrale contient une commande mensuelle/trimestrielle/semestrielle/annuelle basée sur les consommations majorées de 5%.
