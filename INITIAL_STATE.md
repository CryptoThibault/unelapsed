# UNELAPSED — Règles actuelles

## Départ et interface

- Une heure de vie, aucun maximum de réserve ; zéro termine la partie. Le timer devient rouge en dessous de cinq minutes. Au-delà de 24 heures, il affiche jours:heures:minutes:secondes sans unité.
- Zéro nourriture, 100 Energy, Homeless, métier Warehouse worker.
- Personnage provisoire : Alex Morgan. Un cadre au-dessus du timer contient son nom, la ligne Work avec son métier, la ligne Status, le temps total écoulé depuis le début (Total time), puis deux sous-cadres Food et Energy. Ce temps suit l’horloge du jeu, absences et accélération comprises, et se fige à la mort.
- Onglets Action / Inventory / Shop / Recruitment. Inventory montre uniquement les objets possédés, sans timer ; prochain repas dans le profil. La pénalité de repas n'est pas affichée pour le moment.
- Interface anglaise, peu de texte, thèmes sombre et clair mémorisés.
- Notifications en bas de l’écran : gains en vert, dépenses et pénalités en rouge, avec montant et motif. Elles disparaissent après 4,5 secondes réelles et peuvent être fermées ; quatre au maximum. Le décompte naturel et les salaires encore en attente restent silencieux. Un gain et une perte simultanés sont affichés séparément. La fin d’une formation affiche une notification verte Training complete avec le nom de la certification obtenue.

## Métiers et formation

Work est une activité continue, sans durée imposée ni barre de progression. Le salaire s’accumule au prorata du temps travaillé et reste en attente jusqu’à l’arrêt de la session. La croix arrête le travail et encaisse le salaire ; l’épuisement arrête aussi la session et paie avant de lancer Sleep. Aucun paiement intermédiaire. Le cadre Working affiche la durée écoulée et le salaire en attente.

| Métier | Salaire par minute travaillée | Formation pour l'atteindre | Coût | Durée active de formation |
| --- | --- | --- | --- | --- |
| Warehouse worker | 3 min | Accessible au départ | — | — |
| Machine operator | 4 min | Machine operation | 10 min | 30 min |
| Maintenance technician | 6 min | Technical maintenance | 1 h | 30 min |
| Production supervisor | 8 min | Production management | 4 h | 30 min |

- Aucune formation possédée au départ. Les trois s’achètent au Shop, sans prérequis de métier : on peut sauter des étapes. Un seul achat par formation.
- Une seule action Training avec un sélecteur des formations achetées et non terminées. Les formations possédées apparaissent aussi dans Inventory, marquées Qualified une fois terminées.
- Recruitment affiche les quatre métiers, leurs revenus et coûts d’énergie par minute et leurs prérequis de certification et d’équipement. Aucune mention From full rest. Le joueur choisit explicitement son métier ; acheter ou terminer une formation ne change jamais le poste automatiquement. Le poste initial reste accessible sans prérequis. Changer de métier est gratuit et interdit pendant une session Work.
- Safety gear : 10 minutes, pour Machine operator. Tool kit : 1 heure, pour Maintenance technician. Professional outfit : 4 heures, pour Production supervisor. Prix provisoires.
- Les achats uniques possédés (formations, équipements, logement) disparaissent du Shop, et réapparaissent après Restart. Food et Rent home restent renouvelables ; la location est masquée si le logement est possédé. Les équipements sont sans usure et visibles uniquement si possédés dans Inventory. Achat possible avant ou après la formation, y compris pendant une tâche ; un travail engagé conserve son salaire initial.
- Le paiement est fait uniquement à l’achat au Shop ; démarrer ou reprendre le suivi ne coûte rien de plus. La croix du cadre de formation met en pause et conserve la progression ; un nouveau clic sur la même action Training (marquée Resume) reprend le temps restant sans paiement supplémentaire, même après rechargement ou absence.
- Chaque formation conserve sa propre progression payée. Pendant une pause, il est possible de travailler, dormir ou suivre une autre formation. Aucune progression tant que la formation n’est pas reprise.
- À zéro énergie, une formation active conserve sa progression pendant le sommeil, puis reprend automatiquement sans nouveau paiement. Après un sommeil automatique, la formation reprend au réveil avec sa progression conservée.
- La croix sur une formation active conserve sa progression en pause. Sur Work, elle termine la session et verse le gain accumulé.
- Une seule tâche active : pas de file d'attente ni de routine au départ. Les achats restent possibles pendant les tâches.

## Nourriture

- Buy food : deux minutes par repas. Quantité entière positive choisie dans le Shop (une par défaut) ; coût total et durée de couverture actualisés avant achat. Les stocks se cumulent et un repas est consommé toutes les quinze minutes. Le coût doit laisser un solde strictement positif.
- Si aucun repas n'est disponible à l'échéance, retrait immédiat de trente minutes. Aucun multiplicateur du compteur.
- Acheter ou recharger ne décale pas le prochain repas. Consommation pendant les tâches, le sommeil et les absences.

Food dispenser : objet unique à 3 jours du timer, actif dès l’achat et visible dans Inventory. Il disparaît du Shop une fois possédé. À chaque repas dû sans stock, il achète et consomme un repas à 2 minutes, y compris pendant le sommeil et les absences. Le stock existant est consommé en priorité. Si le paiement ne laisse pas de temps positif, la pénalité de repas manqué s’applique. Restart retire l’objet.

## Energy et sommeil

- Energy : 100 points maximum, affichés sur 100 sans symbole %. Les sauvegardes conservent leur énergie actuelle. Les taux choisis sont utilisés exactement dans les calculs et affichés par minute du timer.
- Consommation passive : 2,5 energy/min, soit 40 minutes du timer (16 heures du personnage) pour dépenser 100 points.
- Consommation totale pendant Work, passif inclus : Warehouse worker 2,9 ; Machine operator 2,8 ; Maintenance technician 2,7 ; Production supervisor 2,6 energy/min. Le passif n’est pas ajouté une seconde fois.
- Training consomme exactement 2,8 energy/min, passif inclus. Une formation de 30 minutes actives coûte donc 84 points et laisse 16 points si elle commence à 100.
- Le logement agit uniquement sur la récupération pendant Sleep. Le gain est affiché par minute du timer : +4 energy/min sans logement, +5 energy/min avec location ou propriété.
- Le profil affiche Energy sur 100, la consommation ou récupération en cours par minute du timer sans ligne Sleep recovery. Le temps nécessaire pour retrouver 100 d’énergie est visible dans l’action Sleep. Work, Training, Sleep et Recruitment indiquent directement leurs coûts ou gains d’énergie par minute du timer ; l’indication From full rest est retirée. Le profil affiche Exhausted in, un décompte basé sur l’énergie actuelle et la consommation de l’activité en cours, masqué pendant Sleep et après la mort.
- À zéro, sommeil automatique, puis reprise de Work ou Training si cette activité a été interrompue par l’épuisement. Sleep permet aussi de dormir volontairement hors tâche active, sans activité à reprendre.
- Échelle du personnage : une heure du timer correspond à une journée.
- Récupération continue : de 0 à 100 en 25 minutes sans logement, ou 20 minutes avec location ou propriété (8 heures pour le personnage). Durée proportionnelle au repos manquant, arrêt à 100 %. L’action Sleep affiche le temps nécessaire pour atteindre 100, mis à jour avec l’énergie et le logement ; à 100, il affiche 00:00.
- Wake up conserve l’énergie déjà récupérée et annule la reprise automatique prévue ; une formation reste disponible en pause. Le compteur de vie et les repas continuent.
- Un travail arrêté par épuisement verse le gain accumulé une seule fois avant le sommeil. Au réveil à 100 d’énergie, une nouvelle session Work démarre automatiquement. Le salaire de la session précédente n’est pas versé une seconde fois. Cette reprise reste active après rechargement et pendant les absences.
- Les taux horaires suivent l’horloge du jeu : à vitesse ×1, une heure correspond à une heure réelle ; les vitesses de test accélèrent tout ensemble.

## Logement

- Rent home : quatre heures pour 24 heures de location. Renouveler prolonge la durée restante. La récupération complète prend 20 minutes pendant la validité au lieu de 25 ; l'expiration modifie le taux même en plein sommeil et hors ligne.
- Buy home : douze jours du timer, achat unique ; récupération complète en 20 minutes sans paiement récurrent. Les achats de location ou propriété sont alors désactivés.
- Status affiche Homeless / Renting / Homeowner ; la durée restante de location est dans le profil, jamais Inventory.
- Acheter un logement ou une location pendant le sommeil recalcule immédiatement sa durée restante, sans perdre le repos récupéré.

## Temps, sauvegarde et tests

- Les calculs reposent sur les timestamps ; les événements hors ligne sont traités chronologiquement. La mort l'emporte sur un salaire ou une qualification simultanés.
- Les achats doivent laisser un solde strictement positif. Le taux d’un travail commencé reste celui annoncé à son lancement. Le salaire en attente ne protège pas d’une mort avant la fin de session : zéro termine la partie avant tout paiement.
- Restart remet la partie à son état initial, métiers et formation compris.
- Les sauvegardes précédentes conservent leur métier, leurs formations actives ou en pause et leur solde. Les équipements correspondant aux métiers déjà acquis sont accordés pour préserver la progression. Les formations déjà payées restent possédées ; leur pourcentage de progression est conservé lors du passage à 30 minutes. Le passage aux taux d’énergie entiers conserve le pourcentage de repos actuel, sans changer la réserve de vie. Les anciennes sessions fixes sont converties en travail continu avec le temps déjà travaillé et le taux actuel du métier.
- Barre Test speed DEV au-dessus du profil : ×1 / ×2 / ×4 / ×8 / ×16 / ×32 / ×64 / ×128 / ×256 / ×512. Une horloge commune accélère vie, tâches, fatigue, sommeil, repas et location, sans modifier les prix ou salaires.
- La vitesse reste active après rechargement, hors ligne et après Restart ; elle est synchronisée entre onglets. Le passage d'une vitesse à une autre ne recalcule pas le passé.
- À ×8, 7,5 secondes réelles comptent pour une minute travaillée ; une formation demande 225 secondes de suivi actif hors sommeil. La barre est provisoire.
- Boutons DEV Restart et +1h disponibles pour les essais.

## Conversions de temps du personnage

Une heure du timer = une journée de 24 heures pour le personnage. Une minute du timer = 24 minutes du personnage.

| Activité | Énergie / minute du timer affichée | Durée pour 100 points (timer) | Équivalent personnage |
| --- | ---: | --- | --- |
| Passif | −2,5 | 40 min | 16 h |
| Warehouse worker | −2,9 | ≈ 34 min 29 s | ≈ 13 h 48 |
| Machine operator | −2,8 | ≈ 35 min 43 s | ≈ 14 h 17 |
| Maintenance technician | −2,7 | ≈ 37 min 02 s | ≈ 14 h 49 |
| Production supervisor | −2,6 | ≈ 38 min 28 s | ≈ 15 h 23 |
| Training | −2,8 | ≈ 35 min 43 s | ≈ 14 h 17 |
| Sleep sans logement | +4 | 25 min | 10 h |
| Sleep avec logement | +5 | 20 min | 8 h |

Les taux d’énergie sont exacts ; les durées de conversion du tableau sont arrondies. Une formation de 30 minutes actives représente 12 heures du personnage et coûte 84 d’énergie : elle se termine sans pause si elle commence à 100. Un repas toutes les 15 minutes du timer équivaut à un repas toutes les six heures du personnage, soit quatre par journée.
