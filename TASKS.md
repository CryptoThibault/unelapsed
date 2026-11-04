# UNELAPSED — Orientations et pistes

Les règles jouables sont dans [INITIAL_STATE.md](INITIAL_STATE.md) ; le code et les tests décrivent leur implémentation. Ce fichier conserve les principes et les idées à venir.

## Principes

- RPG de survie économique inspiré de Time Out, avec son propre univers.
- Le temps est la vie et la monnaie : départ à une heure, mort à zéro, réserve sans maximum.
- La simulation continue pendant les absences, à partir des timestamps.
- Peu d’options et d’objets, chacun avec une fonction distincte. Éviter les quiz et mini-jeux génériques.
- Le joueur découvre ses investissements : coûts, durées et effets explicites, sans ordre d’achat imposé.
- La progression ouvre des revenus plus rentables ; le départ doit rester exigeant.
- Une seule tâche active au départ. Les achats restent indépendants des tâches.
- Interface anglaise, sobre, peu de texte, timer dominant, couleurs discrètes et thèmes sombre/clair.

## À développer

- [ ] Débloquer les files d’attente et routines au cours de la progression ; définir leur coût et leurs conditions.

## Pistes à valider

- Fabriquer le Tool kit comme alternative à l’achat : recette et durée à définir.
- Ajouter des métiers ou outils seulement s’ils apportent des choix distincts ; éviter les bonus équivalents et l’usure sans intérêt.
- Introduire des quartiers aux prix et opportunités différents.
- Proposer des personnages et quêtes offrant des alternatives économiques.
- Permettre de survivre à une longue absence : logement, refuge ou réserve à étudier.
- Ajouter des contraintes prévisibles et évitables, sans multiplier les jauges et pénalités.
- Évaluer l’intérêt de l’exploration et du combat pour la boucle économique.
- Décider du maintien des contrôles DEV : Restart, +1h et vitesses ×1 à ×512.

## Contraintes techniques

- Sauvegarde locale liée au navigateur et à l’adresse du jeu ; aucun compte ni serveur.
- Horloge de l’appareil utilisée ; étudier une horloge serveur pour une éventuelle économie partagée.
- Préserver la progression lors des migrations de sauvegardes.
- Restart réinitialise la partie, sans progression permanente.
- Nom UNELAPSED : recherche de jeu homonyme déjà effectuée ; marque et domaine non vérifiés.
