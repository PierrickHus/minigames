# Cléopâtre : Le Village du Nil

## Guide du Joueur

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Objectif et Conditions de Victoire](#2-objectif-et-conditions-de-victoire)
3. [Interface du Jeu](#3-interface-du-jeu)
4. [Système de Ressources](#4-système-de-ressources)
5. [Système de Construction](#5-système-de-construction)
6. [Paysans et Main-d'œuvre](#6-paysans-et-main-dœuvre)
7. [Production et Consommation](#7-production-et-consommation)
8. [Croissance de la Population](#8-croissance-de-la-population)
9. [Système de Tâches de Cléopâtre](#9-système-de-tâches-de-cléopâtre)
10. [Phases de Jeu](#10-phases-de-jeu)
11. [Conseils Stratégiques](#11-conseils-stratégiques)
12. [Statistiques et Analyse](#12-statistiques-et-analyse)
13. [Sauvegarde et Chargement](#13-sauvegarde-et-chargement)

---

## 1. Présentation

**Cléopâtre : Le Village du Nil** est un jeu de gestion et de construction de cité situé dans l'Égypte antique. Vous incarnez le chef d'un petit village sous l'autorité exigeante de Cléopâtre.

### Contexte
- **Époque :** Égypte antique durant l'ère romaine
- **Rôle du joueur :** Chef de village responsable de son expansion
- **Type de jeu :** Simulation de gestion en temps réel

### Ressources de départ
| Ressource | Quantité |
|-----------|----------|
| 💰 Or | 1 000 |
| 👥 Habitants | 100 |
| 🧑‍🌾 Paysans | 10 |

---

## 2. Objectif et Conditions de Victoire

### Objectif principal
**Atteindre 10 000 habitants** dans votre village.

### Condition de défaite
Échouer à compléter une tâche de Cléopâtre dans le temps imparti entraîne une **exécution immédiate** et la fin de la partie.

---

## 3. Interface du Jeu

### Barre supérieure (Ressources)

Affichage en temps réel de vos ressources :

| Icône | Ressource | Description |
|-------|-----------|-------------|
| 💰 | Or | Monnaie pour les achats et salaires |
| 🍞 | Nourriture | Consommée par les paysans à intervalles réguliers |
| 💧 | Eau | Consommée par les paysans à intervalles réguliers |
| 👥 | Population | Total des habitants du village |
| 🧑‍🌾 | Paysans | Travailleurs disponibles (affichés : disponibles/total) |
| 🍽️ | Ration | Compte à rebours avant la prochaine consommation |

**Info-bulles :** Survolez une ressource pour voir son taux de production et sa prévision d'épuisement.

### Panneau de Cléopâtre (Gauche)

Affiche le portrait de Cléopâtre (👑) avec :
- Message/dialogue actuel
- Barre d'humeur (0-100%)
- Tâches en cours et délais
- Option d'envoi automatique des récompenses

### Panneau d'Actions (Droite)

Quatre onglets principaux :

1. **Bâtiments** - Voir et construire des bâtiments
2. **Tâches** - Ordres actuels de Cléopâtre
3. **Ressources** - Gérer et collecter des ressources
4. **Stats** - Voir les taux de production et alertes

### Canvas Principal

Zone centrale montrant votre village avec :
- Bâtiments placés (cliquables pour plus d'informations)
- Visualisation de l'agencement du village
- Grille de placement des bâtiments

### Panneau Latéral

Apparaît quand vous cliquez sur un bâtiment pour afficher ses informations détaillées.

---

## 4. Système de Ressources

### Ressources de Construction

| Ressource | Icône | Temps | Quantité | Coût | Utilisations |
|-----------|-------|-------|----------|------|--------------|
| Bois | 🪵 | 10 sec | 5 | 10💰 | Bâtiments en bois |
| Pierre | 🪨 | 15 sec | 3 | 15💰 | Bâtiments durables, monuments |
| Sable | 🏜️ | 8 sec | 8 | 5💰 | Grands monuments, pyramides |
| Terre | 🟤 | 6 sec | 10 | 5💰 | Fondations, champs |
| Argile | 🧱 | 12 sec | 4 | 12💰 | Briques, poterie |

### Collecte de Ressources

1. Cliquez sur une ressource dans l'onglet Ressources
2. Sélectionnez le multiplicateur (1x, 5x, 10x, Max)
3. Le coût est proportionnel au multiplicateur
4. Un paysan revient avec les ressources après le temps de collecte
5. Le paysan redevient disponible ensuite

### Ressources Consommables

| Ressource | Icône | Consommation | Sources |
|-----------|-------|--------------|---------|
| Nourriture | 🍞 | 1 par paysan/ration | Champs, Fermes, Boulangeries |
| Eau | 💧 | 0.5 par paysan/ration | Puits, Citernes |

**Important :** Un manque de nourriture ou d'eau provoque l'arrêt du travail !

---

## 5. Système de Construction

### Niveaux de Bâtiments

Le jeu comporte **3 niveaux** de bâtiments, débloqués progressivement :

| Niveau | Icône | Débloqué à | Nom |
|--------|-------|------------|-----|
| 1 | 🌱 | 0:00 | Début de partie |
| 2 | 🏗️ | 5:00 | Milieu de partie |
| 3 | 👑 | 15:00 | Fin de partie |

### Bâtiments de Niveau 1 (Début de partie)

#### Résidentiels
| Bâtiment | Habitants | Paysans | Temps | Coût | Max |
|----------|-----------|---------|-------|------|-----|
| 🛖 Hutte | 10 | 1 | 15s | 40💰, 5🪵, 10🟤 | 100 |
| 🏠 Maison | 20 | 2 | 30s | 100💰, 10🪵, 5🧱 | 50 |

#### Production de Nourriture
| Bâtiment | Production | Temps | Coût | Max |
|----------|------------|-------|------|-----|
| 🌾 Champ | +5/min | 25s | 50💰, 20🟤, 10💧 | 20 |
| 🏡 Ferme | +10/min (+15 hab, +1 paysan) | 35s | 120💰, 15🪵, 20🟤, 5💧 | 30 |
| 🥖 Boulangerie | +15/min | 45s | 200💰, 25🪵, 15🧱, 10🪨 | 5 |

#### Production d'Eau
| Bâtiment | Production | Temps | Coût | Max |
|----------|------------|-------|------|-----|
| 🪣 Puits | +10/min | 20s | 80💰, 15🪨, 10🟤 | 10 |
| 🏺 Citerne | +20/min | 30s | 100💰, 20🪨, 15🧱 | 15 |

#### Stockage et Transformation
| Bâtiment | Effet | Temps | Coût | Max |
|----------|-------|-------|------|-----|
| 🏪 Grenier | +500 stockage nourriture | 40s | 150💰, 20🪵, 10🧱 | 5 |
| 🔨 Atelier | +2 bois/min, +2 pierre/min | 40s | 180💰, 20🪵, 15🪨 | 10 |

#### Spécial
| Bâtiment | Effet | Temps | Coût | Max |
|----------|-------|-------|------|-----|
| 🕊️ Volière | Permet d'envoyer des messages à César | 35s | 150💰, 20🪵, 10🧱 | 1 |

### Bâtiments de Niveau 2 (Milieu de partie - débloqué à 5:00)

#### Résidentiels
| Bâtiment | Habitants | Bonus | Temps | Coût | Max |
|----------|-----------|-------|-------|------|-----|
| 🍺 Auberge | 20 | Bonus croissance | 35s | 150💰, 25🪵, 10🧱 | 20 |
| 🏘️ Villa | 60 | +3 paysans | 75s | 500💰, 40🪵, 35🪨, 25🧱 | 30 |
| 🛁 Thermes | 45 | Bonus croissance | 65s | 400💰, 50🪨, 30🧱, 20💧 | 10 |

#### Production
| Bâtiment | Effet | Temps | Coût | Max |
|----------|-------|-------|------|-----|
| ⛏️ Carrière | +3 pierre/min | 50s | 250💰, 15🪵, 30🟤 | 3 |
| 🪚 Scierie | +3 bois/min | 45s | 200💰, 20🪨, 10🪵 | 3 |
| 💰 Marché | +20 or/min, +10 hab | 60s | 300💰, 30🪵, 20🪨, 15🧱 | 5 |
| ⚓ Port | +80 hab, +30 or/min | 90s | 600💰, 60🪵, 40🪨, 30🏜️ | 5 |
| 🌳 Jardins | +50 hab, bonus croissance, +5 nourriture/min | 70s | 450💰, 20🪵, 50🟤, 30💧 | 10 |

#### Culturels
| Bâtiment | Effet | Temps | Coût | Max |
|----------|-------|-------|------|-----|
| 🏛️ Temple | +50 hab (Cléopâtre adore) | 90s | 500💰, 50🪨, 30🏜️, 20🧱 | 3 |
| 🗿 Obélisque | +30 hab | 70s | 400💰, 80🪨, 40🏜️ | 4 |
| 📚 Bibliothèque | +35 hab (Cléopâtre adore) | 55s | 350💰, 30🪵, 25🪨, 15🏜️ | 5 |
| ⚔️ Caserne | +25 hab, protection du village | 55s | 350💰, 40🪵, 30🪨 | 2 |

### Bâtiments de Niveau 3 (Fin de partie - débloqué à 15:00)

#### Monuments
| Bâtiment | Habitants | Temps | Coût | Récompense | Max |
|----------|-----------|-------|------|------------|-----|
| 🔺 Pyramide | +200 | 300s | 2000💰, 200🪨, 150🏜️, 100🧱 | 3000💰 | 1 |
| 🦁 Sphinx | +400 | 280s | 4000💰, 250🪨, 200🏜️ | 6000💰 | 1 |
| 🏟️ Colisée | +350, +25 or/min | 240s | 3500💰, 180🪨, 120🏜️, 80🧱 | 5000💰 | 2 |

#### Résidentiels/Gouvernementaux
| Bâtiment | Habitants | Paysans | Temps | Coût | Récompense | Max |
|----------|-----------|---------|-------|------|------------|-----|
| 👑 Palais Royal | +500 | +10 | 300s | 5000💰, 100🪵, 200🪨, 150🏜️, 100🧱 | 8000💰 | 3 |
| 🎓 Académie | +250 | +5 | 180s | 2500💰, 80🪵, 100🪨, 60🧱 | 4000💰 | 3 |
| ⛩️ Grand Temple | +300 | - | 200s | 3000💰, 150🪨, 100🏜️, 70🧱 | 5500💰 | 2 |

### Processus de Construction

1. **Initiation** - Cliquez sur le bâtiment, payez les coûts, un paysan est assigné
2. **Progression** - Barre de progression visible, paysan indisponible
3. **Achèvement** - Paysan libéré, bâtiment opérationnel, récompense reçue

**Multiplicateur de Construction :** Sélectionnez 1x, 5x, 10x ou Max pour construire plusieurs bâtiments instantanément.

---

## 6. Paysans et Main-d'œuvre

### Source des Paysans

| Bâtiment | Paysans fournis |
|----------|-----------------|
| Hutte | +1 |
| Maison | +2 |
| Ferme | +1 |
| Villa | +3 |
| Palais | +10 |
| Académie | +5 |

### Affectation des Paysans

Les paysans sont assignés à :
1. **Construction** - 1 paysan par bâtiment en construction
2. **Collecte de ressources** - 1 paysan par tâche de collecte
3. **Inactifs** - Disponibles pour la prochaine affectation

**Mécanique de famine :** Si la nourriture ET l'eau tombent à 0, tous les paysans deviennent indisponibles.

---

## 7. Production et Consommation

### Taux de Production

#### Producteurs de Nourriture
| Bâtiment | Production |
|----------|------------|
| Champ | 5/min |
| Ferme | 10/min |
| Boulangerie | 15/min |
| Jardins | 5/min |

#### Producteurs d'Eau
| Bâtiment | Production |
|----------|------------|
| Puits | 10/min |
| Citerne | 20/min |

#### Producteurs d'Or
| Bâtiment | Production |
|----------|------------|
| Marché | 20/min |
| Port | 30/min |
| Colisée | 25/min |

#### Producteurs de Ressources
| Bâtiment | Production |
|----------|------------|
| Carrière | 3 pierre/min |
| Scierie | 3 bois/min |
| Atelier | 2 bois/min + 2 pierre/min |

### Système de Consommation

**Distribution des rations (toutes les 60 secondes) :**
- Total paysans × 1 nourriture = nourriture requise
- Total paysans × 0.5 eau = eau requise

**Exemple :** 100 paysans nécessitent 100 nourriture + 50 eau par ration.

**Notifications :**
- **Vert** : Ressources suffisantes
- **Jaune** : Avertissement (15 secondes avant la prochaine ration)
- **Rouge** : Ressources insuffisantes (les paysans cessent de travailler)

---

## 8. Croissance de la Population

### Système de Croissance Naturelle

- **Mécanisme :** La population augmente automatiquement toutes les 30 secondes
- **Taux de base :** 0.5 habitant par minute

### Conditions Requises
- Réserve de nourriture > 10 unités
- Réserve d'eau > 5 unités

### Multiplicateurs de Bonus de Logement

| Bâtiment | Bonus |
|----------|-------|
| Maison | +10% |
| Villa | +20% |
| Auberge | +5% |
| Thermes | +15% |
| Jardins | +25% |

**Coût de la croissance :** Chaque nouvel habitant coûte 2 nourriture + 1 eau.

**Croissance maximum par cycle :** 50 habitants.

---

## 9. Système de Tâches de Cléopâtre

### Vue d'ensemble

- **Tâches simultanées maximum :** 3 tâches actives
- **Délai entre les tâches :** 45 secondes entre chaque nouvelle assignation
- **Fréquence :** Augmente au fil de la partie

### Types de Tâches

#### 1. Tâches de Construction (type: "build")
Construire un nombre spécifique de bâtiments.
- **Limite de temps :** 60-500 secondes selon le niveau
- **Récompenses :** 100-8500 or
- **Pénalité :** FIN DE PARTIE si échouée

#### 2. Tâches de Collecte (type: "gather")
Collecter une quantité spécifique de ressources.
- **Limite de temps :** 90-160 secondes
- **Auto-consommation :** Cléopâtre prend les ressources en "taxe"
- **Multiplicateur :** La difficulté augmente avec le temps de jeu (+3% par minute, max 2.5x)

#### 3. Tâches d'Alimentation (type: "feed")
Maintenir un stock minimum de nourriture.
- **Limite de temps :** 80-140 secondes
- **Objectif :** Avoir la nourriture requise en réserve à la fin du timer

#### 4. Tâches de Message (type: "message")
Envoyer un message à César via la Volière.
- **Limite de temps :** 50 secondes
- **Prérequis :** Avoir construit une Volière
- **Coût :** 50 or par message

### Système de Niveaux de Difficulté

| Niveau | Temps de jeu | Types de bâtiments | Difficulté |
|--------|-------------|-------------------|------------|
| 1 | 0:00-2:00 | Niveau 1 uniquement | Facile |
| 2 | 2:00-5:00 | Niveau 1 + début Niveau 2 | Moyen |
| 3 | 5:00-10:00 | Niveaux 1 & 2 | Difficile |
| 4 | 10:00-20:00 | Niveaux 2 & début Niveau 3 | Très difficile |
| 5 | 20:00+ | Focus Niveau 3 | Extrême |

### Échec d'une Tâche

**Déclencheur :** Limite de temps atteinte sans complétion.

**Conséquence :** FIN DE PARTIE IMMÉDIATE - "Vous m'avez déçue..."

---

## 10. Phases de Jeu

### Phase 1 : Début de partie (0:00-5:00)

**Bâtiments disponibles :** Niveau 1

**Stratégie recommandée :**
1. Construisez 3-5 maisons immédiatement
2. Créez 2-3 champs et 1 puits
3. Construisez un grenier pour le stockage
4. Commencez la construction d'une boulangerie
5. Complétez les tâches initiales de Cléopâtre
6. **Objectif :** 500-1000 habitants à 5:00

**Critique :** Maintenez la production de nourriture/eau au-dessus de la consommation.

### Phase 2 : Milieu de partie (5:00-15:00)

**Bâtiments disponibles :** Niveaux 1 & 2

**Stratégie recommandée :**
1. Construisez 5-10 villas (60 habitants chacune)
2. Construisez 1-2 marchés (+20 or/min)
3. Construisez 1 scierie et 1 carrière pour l'automatisation
4. Construisez 1-2 ports pour un boost important de population
5. Commencez à construire des temples (+50 habitants)
6. **Objectif :** 3000-5000 habitants à 15:00

**Ressource clé :** Pierre et bois deviennent critiques - automatisez la production.

### Phase 3 : Fin de partie (15:00-Fin)

**Bâtiments disponibles :** Niveaux 1, 2 & 3

**Stratégie recommandée :**
1. Construisez 1-2 palais immédiatement (+500 habitants chacun)
2. Construisez 1 pyramide (+200 habitants)
3. Construisez 1 sphinx (+400 habitants)
4. Construisez plusieurs académies/grands temples
5. Maximisez le nombre de bâtiments de production
6. **Objectif final :** 10 000 habitants

**Priorité des ressources :** Sable, pierre, argile pour les monuments.

---

## 11. Conseils Stratégiques

### Début de partie (5 premières minutes)

1. **Construisez des maisons en premier** (pas des huttes) - plus efficaces
2. **La production de nourriture est critique** - construisez champs/fermes immédiatement
3. **N'accumulez pas l'or** - dépensez-le en bâtiments de production
4. **Planifiez les tâches de Cléopâtre** - commencez la construction avant le timer
5. **La Volière est optionnelle au début** - nécessaire uniquement pour les tâches de message

### Milieu de partie (5-15 minutes)

1. **Automatisez la collecte de ressources** - carrières + scieries économisent les paysans
2. **Marchés avant temples** - or régulier > pics de population
3. **Les villas sont excellentes** - 60 habitants pour 500 de coût
4. **Ne construisez pas trop de thermes** - les bonus de croissance se chevauchent

### Fin de partie (15+ minutes)

1. **Les monuments sont la poussée finale** - pyramide (200), palais (500), sphinx (400)
2. **Focus sur la production Niveau 3** - maximisez or/nourriture/eau
3. **La croissance de population est automatique** - ne gaspillez pas de ressources sur les petits bâtiments
4. **Utilisez les multiplicateurs agressivement** - construisez 10x bâtiments à la fois

### Gestion des Ressources

1. **Maintenez un tampon de nourriture** - gardez toujours 20+ nourriture en réserve
2. **Collectez du sable tôt** - forte demande pour les monuments
3. **Ne gaspillez pas l'argent** - chaque pièce doit se multiplier via la production
4. **Construisez ce que Cléopâtre demande** - les récompenses financent la stratégie
5. **Timer de ration** - l'indicateur jaune donne un préavis de 15 secondes

### Erreurs Courantes à Éviter

1. ❌ Ignorer les tâches de Cléopâtre - risque de FIN DE PARTIE
2. ❌ Manquer de nourriture - les paysans cessent de travailler
3. ❌ Sur-construire le niveau 1 - atteint rapidement le maximum
4. ❌ Ne pas automatiser les ressources - gaspille la main-d'œuvre
5. ❌ Accumuler l'or - devrait être dépensé en production
6. ❌ Construire des pyramides trop tôt - coût massif, moins efficace que les villas

---

## 12. Statistiques et Analyse

### Suivi en Temps Réel

- Taux de production actuels (nourriture, eau, or, ressources)
- Production théorique (bâtiments uniquement, sans collecte)
- Alertes (prévisions d'épuisement des ressources)
- Statistiques générales (bâtiments construits, temps de jeu)

### Menu de Statistiques Avancées (📊)

- Graphiques d'historique des ressources (fenêtres de 1, 5, 10, 30, 60 minutes)
- Graphique de distribution des bâtiments
- Statistiques de production
- Système d'alertes
- Statistiques générales

### Informations des Info-bulles

Survoler les ressources affiche :
- Taux actuel (par seconde ou par minute)
- Prévision d'épuisement (si négatif)
- Statut d'alerte (critique/avertissement/normal)

---

## 13. Sauvegarde et Chargement

### Sauvegarde Automatique

- Activable dans la barre supérieure
- Sauvegarde toutes les 2 minutes si activée
- Notification à la fin de la sauvegarde

### Sauvegarde Manuelle

- Bouton dans la barre supérieure
- Sauvegarde l'état actuel du jeu
- Active le bouton de chargement dans le menu

### Données Persistées

- État du jeu : Population, ressources, bâtiments
- Disposition du village : Placement exact et progression
- Tâches de Cléopâtre : Tâches actives avec temps restant
- Statistiques : Historique de production pour les graphiques
- Multiplicateurs : Paramètres de l'interface utilisateur

---

## Conclusion

**Cléopâtre : Le Village du Nil** est un jeu de stratégie/gestion profond qui récompense la planification, l'allocation efficace des ressources et la complétion ponctuelle des tâches.

Le succès nécessite d'équilibrer :
- **Court terme :** Compléter les tâches exigeantes de Cléopâtre
- **Moyen terme :** Construire une infrastructure de production pour un revenu stable
- **Long terme :** Accumuler la population vers l'objectif de 10 000

Maîtrisez le début de partie pour sécuriser les ressources, optimisez la production en milieu de partie, et exécutez votre stratégie monumentale en fin de partie.

---

*"Que les dieux d'Égypte vous protègent... et que Cléopâtre soit satisfaite."*
