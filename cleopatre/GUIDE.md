# Cléopâtre : Le Village du Nil

## Guide du Joueur

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Modes de Jeu et Scénarios](#2-modes-de-jeu-et-scénarios)
3. [Objectif et Conditions de Victoire](#3-objectif-et-conditions-de-victoire)
4. [Interface du Jeu](#4-interface-du-jeu)
5. [Système de Ressources](#5-système-de-ressources)
6. [Système de Construction](#6-système-de-construction)
7. [Paysans et Main-d'œuvre](#7-paysans-et-main-dœuvre)
8. [Production et Consommation](#8-production-et-consommation)
9. [Croissance de la Population](#9-croissance-de-la-population)
10. [Système de Tâches de Cléopâtre](#10-système-de-tâches-de-cléopâtre)
11. [Système d'Humeur de Cléopâtre](#11-système-dhumeur-de-cléopâtre)
12. [Niveaux de Difficulté (Tiers)](#12-niveaux-de-difficulté-tiers)
13. [Phases de Jeu](#13-phases-de-jeu)
14. [Conseils Stratégiques](#14-conseils-stratégiques)
15. [Statistiques et Analyse](#15-statistiques-et-analyse)
16. [Sauvegarde et Chargement](#16-sauvegarde-et-chargement)
17. [Options et Paramètres](#17-options-et-paramètres)

---

## 1. Présentation

**Cléopâtre : Le Village du Nil** est un jeu de gestion et de construction de cité situé dans l'Égypte antique. Vous incarnez le chef d'un petit village sous l'autorité exigeante de Cléopâtre VII.

### Contexte
- **Époque :** Égypte antique durant l'ère romaine (-30 av. J.-C.)
- **Rôle du joueur :** Chef de village (homme ou femme) responsable de son expansion
- **Type de jeu :** Simulation de gestion en temps réel avec système de tâches
- **Personnage principal :** Cléopâtre VII, dernière reine d'Égypte, vous assigne des missions

### Choix du personnage
Au début du jeu, vous choisissez votre avatar :
- **Homme** : Représenté par un gouverneur égyptien
- **Femme** : Représentée par une gouverneure égyptienne

Ce choix est purement esthétique et n'affecte pas le gameplay.

---

## 2. Modes de Jeu et Scénarios

Le jeu propose plusieurs scénarios avec des configurations et objectifs différents.

### Mode Partie Libre (Freeplay)

**Configuration :**
- **Ressources de départ :** 1000 or, 100 habitants, 10 paysans
- **Objectif :** Atteindre 10 000 habitants
- **Difficulté :** Mode difficile avec humeur de Cléopâtre à 15% au départ
- **Tâches automatiques :** Activées (nouvelle tâche toutes les 45 secondes)
- **Progression des tiers :** Automatique selon le temps de jeu
- **Défaite :** Humeur de Cléopâtre à 0%

### Mode Tutoriel

**Configuration :**
- **Ressources de départ :** 2000 or (double du mode libre)
- **Ressources bonus :** Bois, pierre, sable, terre et argile en quantité
- **Objectif :** Atteindre 500 habitants (20 fois moins que le mode libre)
- **Difficulté :** Mode facile avec humeur initiale plus élevée
- **Guidage :** Étapes tutoriels progressives avec surbrillance d'éléments
- **Déblocage progressif :** Les bâtiments se débloquent au fur et à mesure
- **Systèmes en pause :** Consommation, croissance et tâches de message désactivés pendant le tuto
- **Tâches automatiques :** Cooldown réduit à 20 secondes

**Types d'étapes du tutoriel :**
1. **INTRO :** Message d'introduction avec bouton pour continuer
2. **HIGHLIGHT :** Mise en surbrillance d'un élément avec attente d'action
3. **EXPLAIN :** Explication avec bouton pour continuer
4. **WAIT :** Attente d'une condition sans mise en surbrillance
5. **FREE :** Mode libre avec vérification de conditions

Le tutoriel guide le joueur à travers :
- La construction du premier bâtiment
- La collecte de ressources
- La gestion des tâches de Cléopâtre
- La compréhension des mécaniques de base

---

## 3. Objectif et Conditions de Victoire

### Objectif principal

| Mode | Objectif de population |
|------|------------------------|
| Partie Libre | 10 000 habitants |
| Tutoriel | 500 habitants |

### Condition de défaite

**Humeur de Cléopâtre à 0%** entraîne la fin de la partie.

- L'humeur diminue de **-10%** à chaque échec de tâche
- L'humeur augmente de **+5%** à chaque succès de tâche
- L'humeur commence à **15%** en mode libre (seulement 1 échec toléré au début !)
- Pas de game over immédiat dans le tutoriel (mode d'apprentissage)

**Important :** Contrairement aux versions précédentes, échouer une tâche ne cause PAS de game over immédiat. C'est la barre d'humeur qui détermine votre survie.

---

## 4. Interface du Jeu

### Barre supérieure (Ressources)

Affichage en temps réel de vos ressources principales :

| Icône | Ressource | Description |
|-------|-----------|-------------|
| 💰 | Or | Monnaie pour les achats, salaires et collectes |
| 🍞 | Nourriture | Consommée toutes les 60 secondes lors des rations |
| 💧 | Eau | Consommée toutes les 60 secondes lors des rations |
| 👥 | Population | Total des habitants du village |
| 🧑‍🌾 | Paysans | Travailleurs (affichés : disponibles / total) |
| 🍽️ | Ration | Compte à rebours avant la prochaine consommation (60s) |

**Info-bulles :** Survolez une ressource pour voir :
- Son taux de production/consommation actuel
- Sa prévision d'épuisement (si applicable)
- Son statut (normal, avertissement, critique)

**Boutons de la barre :**
- 💾 **Sauvegarder** : Sauvegarde manuelle du jeu
- ⏸️ **Pause** : Met le jeu en pause
- 📊 **Statistiques** : Ouvre le menu des statistiques détaillées
- ⚙️ **Options** : Paramètres du jeu (volume, etc.)

### Panneau de Cléopâtre (Gauche)

Portrait animé de Cléopâtre avec :
- **Sprite animé** : Visage de Cléopâtre avec expressions faciales (idle, heureuse, en colère, déçue, pensive, parlant)
- **Effets visuels** : Aura dorée si humeur > 50%, éclairs rouges si humeur < 20%
- **Message/dialogue** : Ce que Cléopâtre dit actuellement
- **Barre d'humeur** : Jauge de 0 à 100% avec code couleur
  - Rouge (0-20%) : En colère, risque critique
  - Jaune (20-50%) : Neutre
  - Vert (50-100%) : Heureuse
- **Tâches actives** : Liste des missions en cours avec timer et progression
- **Compteur de prochaine tâche** : Affiche le temps avant la prochaine mission (si activé)

**Animation du sprite :**
- 12 images d'animation pour la synchronisation labiale
- Palette de couleurs égyptiennes authentiques (or, lapis-lazuli, cornaline, khôl)
- États d'animation : idle1-4, speaking, happy, angry, thinking, disappointed
- Effets visuels dynamiques selon l'humeur (particules d'étoiles, éclairs)

### Panneau d'Actions (Droite)

Quatre onglets principaux :

1. **🏗️ Bâtiments**
   - Liste des bâtiments constructibles (filtrés par tier débloqué)
   - Affichage du coût, temps de construction, effets
   - Multiplicateur de construction (x1, x5, x10, Max)
   - Indicateur de limite atteinte (si max construit)

2. **📜 Tâches**
   - Liste des ordres actuels de Cléopâtre
   - Temps restant et conditions de complétion
   - Progression en pourcentage
   - Bouton "Envoyer à César" pour les tâches de message

3. **📦 Stats**
   - Vue d'ensemble des taux de production
   - Alertes et avertissements
   - Statistiques rapides

### Canvas Principal (Village)

Zone centrale montrant votre village avec :
- **Grille 48×28** : Terrain de placement des bâtiments (taille de tuile : 26px)
- **Bâtiments placés** : Visuels avec sprites et animations
- **Rivière du Nil** : En bas de la grille
- **Bâtiments en construction** : Barre de progression visible
- **Bâtiments terminés** : Animation de complétion (flash doré)
- **Pan et zoom** : Navigation dans le village

**Stratégies de placement :**
- `center` : Bâtiments placés au centre du village
- `periphery` : Bâtiments placés en périphérie
- `near_well` : Proche des puits
- `near_farm` : Proche des fermes
- `near_market` : Proche des marchés
- `anywhere` : Placement libre

### Barre de ressources collectables (Bas)

Affiche les 5 ressources de construction avec :
- **Stock actuel** : Quantité en possession
- **Bouton de collecte** : Envoie un paysan collecter
- **Coût de collecte** : Or nécessaire
- **Temps de collecte** : Durée avant retour du paysan
- **Multiplicateur de travail** : x1, x5, x10, Max
- **Compteur de paysans en collecte** : Nombre de paysans actuellement occupés
- **Compteur d'oiseaux (messages)** : Nombre de messages envoyés à César

---

## 5. Système de Ressources

### Ressources de Construction

Ces ressources sont collectées manuellement en envoyant des paysans.

| Ressource | Icône | Temps | Quantité | Coût | Utilisations principales |
|-----------|-------|-------|----------|------|--------------------------|
| Bois | 🪵 | 10 sec | 5 | 10💰 | Huttes, maisons, bâtiments en bois |
| Pierre | 🪨 | 15 sec | 3 | 15💰 | Puits, bâtiments durables, monuments |
| Sable | 🏜️ | 8 sec | 8 | 5💰 | Pyramides, sphinx, grands monuments |
| Terre | 🟤 | 6 sec | 10 | 5💰 | Fondations, champs, fermes |
| Argile | 🧱 | 12 sec | 4 | 12💰 | Briques, citernes, bâtiments avancés |

### Production Automatique de Ressources

Certains bâtiments produisent automatiquement des ressources de construction :

| Bâtiment | Production |
|----------|------------|
| 🔨 Atelier (Tier 1) | +2 bois/min, +2 pierre/min |
| 🪚 Scierie (Tier 2) | +3 bois/min |
| ⛏️ Carrière (Tier 2) | +3 pierre/min |

### Collecte de Ressources

**Processus :**
1. Cliquez sur une ressource dans la barre du bas
2. Sélectionnez le multiplicateur (x1, x5, x10, Max)
3. Le coût total s'affiche (multiplicateur × coût unitaire)
4. Un paysan par ressource est envoyé
5. Après le temps de collecte, le paysan revient avec les ressources
6. Le paysan redevient disponible

**Exemple :** Collecter 5× bois coûte 50 or (5 × 10), nécessite 5 paysans disponibles, et prend 10 secondes.

**Multiplicateur Max :** Calcule automatiquement le maximum de collectes possibles selon :
- L'or disponible
- Les paysans disponibles
- Le stock maximal de la ressource

### Ressources Consommables

Ces ressources sont consommées automatiquement lors des rations et produites par les bâtiments.

| Ressource | Icône | Consommation | Production |
|-----------|-------|--------------|------------|
| Nourriture | 🍞 | 1 par paysan toutes les 60s | Champs, Fermes, Boulangeries, Jardins |
| Eau | 💧 | 0.5 par paysan toutes les 60s | Puits, Citernes |

**Système de ration :**
- **Intervalle :** 60 secondes entre chaque ration
- **Avertissement :** 15 secondes avant (indicateur jaune)
- **Consommation :** Total paysans × 1 nourriture + Total paysans × 0.5 eau
- **Pénalité :** Si insuffisant, la population diminue

**Exemple :** 100 paysans nécessitent 100 nourriture + 50 eau par ration.

---

## 6. Système de Construction

### Système de Tiers de Bâtiments

Le jeu utilise un système de **5 tiers** qui se débloquent progressivement selon le temps de jeu.

| Tier | Temps de jeu | Description |
|------|-------------|-------------|
| 1 | 0:00 (départ) | Bâtiments de base (huttes, champs, puits) |
| 2 | 2:00 | Bâtiments intermédiaires (villas, auberges, marchés) |
| 3 | 5:00 | Bâtiments avancés (temples, obélisques, ports) |
| 4 | 10:00 | Bâtiments de prestige (palais, académies, grands temples) |
| 5 | 20:00 | Monuments majeurs (pyramides, sphinx, colisées) |

**Important :** Les tiers de bâtiments ET les tiers de tâches sont synchronisés sur le même système de temps.

### Bâtiments par Tier

#### Tier 1 : Bâtiments de Base (0:00)

**Résidentiels :**
| Bâtiment | Habitants | Paysans | Temps | Coût | Max |
|----------|-----------|---------|-------|------|-----|
| 🛖 Hutte | 10 | 1 | 15s | 40💰, 5🪵, 10🟤 | 100 |
| 🏠 Maison | 20 | 2 | 30s | 100💰, 10🪵, 5🧱 | 50 |

**Production de Nourriture :**
| Bâtiment | Production | Habitants | Paysans | Temps | Coût | Max |
|----------|------------|-----------|---------|-------|------|-----|
| 🌾 Champ | +5 nourriture/min | - | - | 25s | 50💰, 20🟤, 10💧 | 20 |
| 🏡 Ferme | +10 nourriture/min | +15 | +1 | 35s | 120💰, 15🪵, 20🟤, 5💧 | 30 |

**Production d'Eau :**
| Bâtiment | Production | Temps | Coût | Max |
|----------|------------|-------|------|-----|
| 🪣 Puits | +10 eau/min | 20s | 80💰, 15🪨, 10🟤 | 10 |
| 🏺 Citerne | +20 eau/min | 30s | 100💰, 20🪨, 15🧱 | 15 |

**Stockage et Transformation :**
| Bâtiment | Effet | Temps | Coût | Max |
|----------|-------|-------|------|-----|
| 🏪 Grenier | +500 stockage nourriture | 40s | 150💰, 20🪵, 10🧱 | 5 |
| 🔨 Atelier | +2 bois/min, +2 pierre/min | 40s | 180💰, 20🪵, 15🪨 | 10 |

**Spécial :**
| Bâtiment | Effet | Temps | Coût | Max |
|----------|-------|-------|------|-----|
| 🕊️ Volière | Permet d'envoyer des messages à César (50💰/message) | 35s | 150💰, 20🪵, 10🧱 | 1 |

#### Tier 2 : Bâtiments Intermédiaires (2:00)

**Résidentiels :**
| Bâtiment | Habitants | Paysans | Bonus | Temps | Coût | Max |
|----------|-----------|---------|-------|-------|------|-----|
| 🍺 Auberge | 20 | - | +5% croissance | 35s | 150💰, 25🪵, 10🧱 | 20 |
| 🏘️ Villa | 60 | +3 | - | 75s | 500💰, 40🪵, 35🪨, 25🧱 | 30 |
| 🛁 Thermes | 45 | - | +15% croissance | 65s | 400💰, 50🪨, 30🧱, 20💧 | 10 |

**Production :**
| Bâtiment | Effet | Habitants | Temps | Coût | Max |
|----------|-------|-----------|-------|------|-----|
| ⛏️ Carrière | +3 pierre/min | - | 50s | 250💰, 15🪵, 30🟤 | 3 |
| 🪚 Scierie | +3 bois/min | - | 45s | 200💰, 20🪨, 10🪵 | 3 |
| 💰 Marché | +20 or/min | +10 | 60s | 300💰, 30🪵, 20🪨, 15🧱 | 5 |
| 🥖 Boulangerie | +15 nourriture/min | - | 45s | 200💰, 25🪵, 15🧱, 10🪨 | 5 |

#### Tier 3 : Bâtiments Avancés (5:00)

**Grands Bâtiments :**
| Bâtiment | Effet | Habitants | Bonus | Temps | Coût | Max |
|----------|-------|-----------|-------|-------|------|-----|
| ⚓ Port | +30 or/min | +80 | - | 90s | 600💰, 60🪵, 40🪨, 30🏜️ | 5 |
| 🌳 Jardins | +5 nourriture/min | +50 | +25% croissance | 70s | 450💰, 20🪵, 50🟤, 30💧 | 10 |

**Culturels :**
| Bâtiment | Effet | Habitants | Temps | Coût | Max |
|----------|-------|-----------|-------|------|-----|
| 🏛️ Temple | Cléopâtre adore | +50 | 90s | 500💰, 50🪨, 30🏜️, 20🧱 | 3 |
| 🗿 Obélisque | Monument | +30 | 70s | 400💰, 80🪨, 40🏜️ | 4 |
| 📚 Bibliothèque | Cléopâtre adore | +35 | 55s | 350💰, 30🪵, 25🪨, 15🏜️ | 5 |
| ⚔️ Caserne | Protection | +25 | 55s | 350💰, 40🪵, 30🪨 | 2 |

#### Tier 4 : Bâtiments de Prestige (10:00)

| Bâtiment | Habitants | Paysans | Temps | Coût | Récompense | Max |
|----------|-----------|---------|-------|------|------------|-----|
| 👑 Palais Royal | +500 | +10 | 300s | 5000💰, 100🪵, 200🪨, 150🏜️, 100🧱 | 8000💰 | 3 |
| 🎓 Académie | +250 | +5 | 180s | 2500💰, 80🪵, 100🪨, 60🧱 | 4000💰 | 3 |
| ⛩️ Grand Temple | +300 | - | 200s | 3000💰, 150🪨, 100🏜️, 70🧱 | 5500💰 | 2 |

#### Tier 5 : Monuments Majeurs (20:00)

| Bâtiment | Habitants | Effet | Temps | Coût | Récompense | Max |
|----------|-----------|-------|-------|------|------------|-----|
| 🔺 Pyramide | +200 | Monument légendaire | 300s | 2000💰, 200🪨, 150🏜️, 100🧱 | 3000💰 | 1 |
| 🦁 Sphinx | +400 | Monument mythique | 280s | 4000💰, 250🪨, 200🏜️ | 6000💰 | 1 |
| 🏟️ Colisée | +350 | +25 or/min | 240s | 3500💰, 180🪨, 120🏜️, 80🧱 | 5000💰 | 2 |

### Processus de Construction

1. **Sélection** - Cliquez sur le bâtiment dans le panneau
2. **Multiplicateur** - Choisissez x1, x5, x10 ou Max
3. **Déduction** - Coût total déduit (or + ressources)
4. **Placement automatique** - Le système trouve le meilleur emplacement selon la stratégie du bâtiment
5. **Construction** - Barre de progression visible sur le canvas
6. **Achèvement** - Animation de complétion, effets appliqués, récompense donnée

**Formes de bâtiments :** Chaque bâtiment a une ou plusieurs formes possibles (1×1, 1×2, 2×1, 2×2, 2×3, 3×3) pour s'adapter à l'espace disponible.

**Coût progressif :** Certains bâtiments (comme les huttes) voient leur coût augmenter avec un facteur d'échelle de 1.15 par construction.

---

## 7. Paysans et Main-d'œuvre

### Rôle des Paysans

Les paysans (🧑‍🌾) sont la main-d'œuvre de votre village. Ils sont nécessaires pour :
1. **Construction** - 1 paysan par bâtiment en construction
2. **Collecte de ressources** - 1 paysan par tâche de collecte
3. **Consommation** - Chaque paysan consomme 1 nourriture + 0.5 eau par ration (60s)

### Source des Paysans

| Bâtiment | Paysans fournis |
|----------|-----------------|
| 🛖 Hutte | +1 |
| 🏠 Maison | +2 |
| 🏡 Ferme | +1 |
| 🏘️ Villa | +3 |
| 👑 Palais Royal | +10 |
| 🎓 Académie | +5 |

### Affichage

**Format :** Disponibles / Total

**Exemples :**
- `8 / 10` : 8 paysans disponibles, 10 au total, 2 occupés
- `0 / 50` : Tous les paysans sont occupés (construction/collecte)

### Optimisation de la Main-d'œuvre

**Début de partie :**
- Priorisez les bâtiments donnant des paysans (huttes, maisons)
- Gardez toujours 2-3 paysans disponibles pour les urgences

**Milieu de partie :**
- Automatisez la collecte avec Scieries et Carrières
- Libérez les paysans pour les constructions importantes

**Fin de partie :**
- Les monuments nécessitent 5+ minutes de construction, bloquez des paysans
- Assurez-vous d'avoir assez de nourriture/eau pour tous les paysans

---

## 8. Production et Consommation

### Système de Production par Minute

Tous les bâtiments producteurs génèrent des ressources **par minute** de manière continue.

#### Producteurs de Nourriture
| Bâtiment | Production |
|----------|------------|
| 🌾 Champ | 5/min |
| 🏡 Ferme | 10/min |
| 🥖 Boulangerie | 15/min |
| 🌳 Jardins | 5/min |

#### Producteurs d'Eau
| Bâtiment | Production |
|----------|------------|
| 🪣 Puits | 10/min |
| 🏺 Citerne | 20/min |

#### Producteurs d'Or
| Bâtiment | Production |
|----------|------------|
| 💰 Marché | 20/min |
| ⚓ Port | 30/min |
| 🏟️ Colisée | 25/min |

#### Producteurs de Ressources de Construction
| Bâtiment | Production |
|----------|------------|
| 🔨 Atelier | 2 bois/min + 2 pierre/min |
| 🪚 Scierie | 3 bois/min |
| ⛏️ Carrière | 3 pierre/min |

### Système de Consommation (Rations)

**Intervalle :** Toutes les 60 secondes

**Formule de consommation :**
- Nourriture requise = Total paysans × 1
- Eau requise = Total paysans × 0.5

**Exemple :**
- 50 paysans → 50 nourriture + 25 eau toutes les 60 secondes
- 200 paysans → 200 nourriture + 100 eau toutes les 60 secondes

**Système d'avertissement :**
- **Vert (45-60s)** : Ressources suffisantes, situation normale
- **Jaune (15-44s)** : Avertissement, préparez la prochaine ration
- **Rouge (0-14s)** : Critique, risque de pénurie imminent

**Pénalité de pénurie :**
Si vous n'avez pas assez de nourriture OU d'eau lors d'une ration :
- La population diminue proportionnellement au manque
- Les paysans deviennent inefficaces

---

## 9. Croissance de la Population

### Système de Croissance Naturelle

**Intervalle :** Toutes les 30 secondes

**Taux de base :** 0.5 habitant par minute

**Formule complète :**
```
Croissance = Taux de base × (1 + Bonus de logement) × Deltatime
Maximum par cycle = 50 habitants
```

### Conditions Requises

Pour que la croissance se produise :
1. **Nourriture** : Stock > 10 unités
2. **Eau** : Stock > 5 unités

Si ces conditions ne sont PAS remplies, aucune croissance ne se produit.

### Bonus de Croissance par Bâtiment

| Bâtiment | Bonus de croissance |
|----------|---------------------|
| 🏠 Maison | +10% |
| 🍺 Auberge | +5% |
| 🛁 Thermes | +15% |
| 🌳 Jardins | +25% |
| 🏘️ Villa | +20% |

**Important :** Les bonus se cumulent de manière additive.

**Exemple :**
- 10 Maisons (10 × 10% = +100%)
- 5 Auberges (5 × 5% = +25%)
- 2 Thermes (2 × 15% = +30%)
- **Total :** +155% de bonus → Taux de croissance = 0.5 × 2.55 = 1.275 habitants/min

### Coût de la Croissance

Chaque nouvel habitant consomme lors de sa création :
- **2 nourriture**
- **1 eau**

Cette consommation est déduite immédiatement du stock lors de la croissance.

### Optimisation de la Croissance

**Début de partie :**
- Construisez des maisons pour le bonus de base (+10% chacune)
- Maintenez toujours un stock > 20 nourriture et > 10 eau

**Milieu de partie :**
- Ajoutez des thermes (+15%) pour accélérer
- Les jardins (+25%) sont excellents si vous avez la place

**Fin de partie :**
- La croissance naturelle devient secondaire
- Focus sur les gros bâtiments (+500 du palais > 5 min de croissance naturelle)

---

## 10. Système de Tâches de Cléopâtre

### Vue d'ensemble

Cléopâtre assigne des **missions** que vous devez accomplir dans un temps limité.

**Paramètres :**
- **Tâches simultanées maximum :** 3 tâches actives
- **Délai entre les tâches :** 45 secondes par défaut (20s en tutoriel)
- **Assignation automatique :** Activable/désactivable dans les options
- **Cooldown de prochaine tâche :** Affiché dans le panneau de Cléopâtre

### Types de Tâches

#### 1. Tâches de Construction (BUILD)

**Description :** Construire un nombre spécifique de bâtiments.

**Exemples :**
- "Construis 3 huttes"
- "Construis 1 palais"
- "Construis 5 maisons"

**Paramètres :**
- **Limite de temps :** 60-500 secondes selon le tier et le bâtiment
- **Récompense :** 100-8500 or
- **Vérification :** Compte le nombre de bâtiments du type demandé (en construction ou terminés)

**Astuce :** Vous pouvez commencer la construction AVANT que la tâche soit assignée si vous anticipez.

#### 2. Tâches de Collecte (GATHER)

**Description :** Collecter une quantité spécifique de ressources.

**Exemples :**
- "Collecte 50 bois"
- "Collecte 30 pierre"

**Paramètres :**
- **Limite de temps :** 90-160 secondes
- **Récompense :** 100-500 or
- **Multiplicateur de difficulté :** +3% par minute de jeu (max 2.5×)

**Important :** Les ressources collectées sont "prises" par Cléopâtre en taxe (disparaissent de votre stock).

**Formule du multiplicateur :**
```
Multiplicateur = 1 + (temps de jeu en minutes × 0.03)
Maximum = 2.5
```

#### 3. Tâches de Message (MESSAGE)

**Description :** Envoyer un message à César via la Volière.

**Exemples :**
- "Envoie un message à César"

**Prérequis :**
- Avoir construit une 🕊️ Volière

**Paramètres :**
- **Limite de temps :** 50 secondes
- **Coût :** 50 or par message
- **Récompense :** 200 or

**Astuce :** La volière n'est nécessaire que pour ce type de tâche. Ne la construisez qu'après avoir reçu une tâche de message.

**Auto-message :** Un système invisible envoie des messages toutes les 60 secondes si vous avez une volière (ne compte pas pour les tâches).

#### 4. Tâches d'Alimentation (FEED)

**Description :** Maintenir un stock minimum de nourriture.

**Exemples :**
- "Garde au moins 50 nourriture en réserve"

**Paramètres :**
- **Limite de temps :** 80-140 secondes
- **Récompense :** 150-400 or
- **Vérification :** Stock de nourriture ≥ quantité demandée à la fin du timer

**Stratégie :** Construisez des champs/fermes ou collectez de la nourriture selon l'urgence.

#### 5. Tâches d'Eau (WATER)

**Description :** Maintenir un stock minimum d'eau.

**Exemples :**
- "Garde au moins 30 eau en réserve"

**Paramètres :**
- **Limite de temps :** 80-140 secondes
- **Récompense :** 150-400 or
- **Vérification :** Stock d'eau ≥ quantité demandée

**Stratégie :** Construisez des puits/citernes.

#### 6. Tâches de Population (POPULATION)

**Description :** Atteindre un certain nombre d'habitants.

**Exemples :**
- "Atteins 500 habitants"

**Paramètres :**
- **Limite de temps :** 180-300 secondes
- **Récompense :** 500-2000 or
- **Vérification :** Population totale ≥ nombre demandé

**Stratégie :** Construisez des bâtiments résidentiels rapidement (huttes, maisons, villas).

### Dialogues de Cléopâtre

Chaque tâche a des messages associés :
- **Message de début :** Annonce de la tâche
- **Message de rappel :** Quand il reste peu de temps
- **Message de succès :** Félicitations et récompense
- **Message d'échec :** Déception et pénalité d'humeur

**Messages d'inactivité :**
Quand aucune tâche n'est active, Cléopâtre affiche des messages aléatoires :
- "Tout va bien pour l'instant..."
- "J'attends de voir tes progrès..."
- "Ne me déçois pas..."

### Auto-construction

**Option activable :** Le système peut tenter de construire automatiquement les bâtiments demandés si vous avez les ressources.

**Fonctionnement :**
1. Vérifier les ressources disponibles
2. Tenter la construction automatique
3. Notification de succès/échec

**Attention :** Cette option peut vider vos ressources rapidement. Utilisez-la avec prudence.

---

## 11. Système d'Humeur de Cléopâtre

### Jauge d'Humeur

**Plage :** 0% à 100%

**Valeur de départ :**
- Mode libre : **15%** (très difficile, seulement 1 échec autorisé au début)
- Mode tutoriel : Plus élevé (mode d'apprentissage)

### Modification de l'Humeur

| Événement | Changement |
|-----------|------------|
| ✅ Tâche réussie | +5% |
| ❌ Tâche échouée | -10% |

### Seuils Critiques

| Plage d'humeur | État | Effet visuel |
|----------------|------|--------------|
| 0-20% | 😡 En colère | Sprite en colère, éclairs rouges, fond rouge |
| 20-50% | 😐 Neutre | Sprite neutre, pas d'effet spécial |
| 50-100% | 😊 Heureuse | Sprite heureux, aura dorée, particules d'étoiles |

### Game Over

**Condition :** Humeur = 0%

**Message :** "Vous m'avez déçue... C'en est fini de vous."

**Important :** En mode tutoriel, le game over par humeur est désactivé pour laisser le joueur apprendre.

### Stratégie de Gestion de l'Humeur

**Début de partie :**
- Avec 15% de départ, vous NE POUVEZ PAS échouer la première tâche
- Réussissez 2 tâches pour monter à 25% (marge de sécurité)

**Milieu de partie :**
- Maintenez l'humeur > 30% minimum (3 échecs d'affilée = game over)
- Une humeur > 50% vous met en sécurité (état heureux)

**Fin de partie :**
- Si vous avez > 70% d'humeur, vous pouvez vous permettre quelques échecs
- Priorisez les tâches faciles si l'humeur est critique (< 25%)

---

## 12. Niveaux de Difficulté (Tiers)

### Système de Progression

Le jeu utilise un système de **5 tiers** qui déterminent :
1. Les bâtiments disponibles à la construction
2. La difficulté des tâches de Cléopâtre
3. Les types de tâches assignées

### Déblocage des Tiers

| Tier | Temps de jeu | Bâtiments débloqués | Tâches |
|------|-------------|---------------------|--------|
| 1 | 0:00 | Hutte, Maison, Champ, Puits, Ferme, Citerne, Grenier, Atelier, Volière, Boulangerie | Faciles (petites quantités) |
| 2 | 2:00 | + Auberge, Villa, Thermes, Carrière, Scierie, Marché | Moyennes (quantités doublées) |
| 3 | 5:00 | + Port, Jardins, Temple, Obélisque, Bibliothèque, Caserne | Difficiles (grandes quantités) |
| 4 | 10:00 | + Palais Royal, Académie, Grand Temple | Très difficiles (monuments) |
| 5 | 20:00 | + Pyramide, Sphinx, Colisée | Extrêmes (1-2 monuments) |

### Évolution de la Difficulté

**Tier 1 (0:00-2:00) :**
- Tâches de construction : 2-5 huttes/maisons
- Tâches de collecte : 20-40 ressources
- Délai : 60-120 secondes
- **Objectif :** Apprendre les mécaniques

**Tier 2 (2:00-5:00) :**
- Tâches de construction : 3-8 bâtiments intermédiaires
- Tâches de collecte : 40-80 ressources
- Délai : 90-180 secondes
- **Objectif :** Établir une économie stable

**Tier 3 (5:00-10:00) :**
- Tâches de construction : 5-15 bâtiments avancés
- Tâches de collecte : 60-120 ressources
- Nouvelles tâches : Message, Population
- Délai : 120-240 secondes
- **Objectif :** Expansion rapide

**Tier 4 (10:00-20:00) :**
- Tâches de construction : 1-3 palais/académies
- Tâches de population : 2000-5000 habitants
- Délai : 240-400 secondes
- **Objectif :** Monuments de prestige

**Tier 5 (20:00+) :**
- Tâches de construction : 1 pyramide/sphinx
- Tâches de population : 5000-8000 habitants
- Délai : 300-500 secondes
- **Objectif :** Course finale vers 10 000

### Configuration du Tier Timer

**Activation :** Le tier timer est activé par défaut en mode libre, désactivé en tutoriel.

**Visualisation :** Le tier actuel n'est pas affiché directement, mais vous le voyez à travers :
- Les bâtiments disponibles dans l'onglet Bâtiments
- Les types de tâches assignées par Cléopâtre

---

## 13. Phases de Jeu

### Phase 1 : Début de partie (0:00-5:00)

**Tier actif :** 1 → 2

**Bâtiments disponibles :**
- Départ : Huttes, Maisons, Champs, Puits, Fermes, Citernes
- À 2:00 : + Auberges, Villas, Marchés, Carrières, Scieries

**Stratégie recommandée :**
1. **0:00-0:30 :** Construisez 3-5 maisons immédiatement (paysans + bonus croissance)
2. **0:30-1:30 :** Construisez 2-3 champs et 1-2 puits (production de base)
3. **1:30-2:00 :** Construisez 1 grenier et 1 atelier (stockage + automatisation)
4. **2:00-3:00 :** Passez aux villas (60 habitants chacune)
5. **3:00-5:00 :** Construisez 1-2 marchés (or passif)

**Objectif de population :** 500-1000 habitants à 5:00

**Ressources critiques :**
- Maintenez nourriture > 50, eau > 30 en permanence
- Ne laissez jamais l'or descendre < 200

**Tâches de Cléopâtre :**
- Très faciles (2-5 bâtiments simples)
- Réussissez-les TOUTES (humeur critique à 15%)

### Phase 2 : Milieu de partie (5:00-15:00)

**Tier actif :** 2 → 3 → 4

**Bâtiments disponibles :**
- À 5:00 : + Ports, Jardins, Temples, Obélisques
- À 10:00 : + Palais, Académies, Grands Temples

**Stratégie recommandée :**
1. **5:00-7:00 :** Construisez 5-10 villas (expansion rapide)
2. **7:00-10:00 :** Construisez 1-2 ports (+80 habitants, +30 or/min)
3. **10:00-12:00 :** Construisez 1-2 palais (+500 habitants chacun !)
4. **12:00-15:00 :** Maximisez les temples et académies

**Objectif de population :** 3000-5000 habitants à 15:00

**Ressources critiques :**
- Automatisez la collecte (carrières, scieries)
- Stockez du sable et de l'argile pour les monuments

**Tâches de Cléopâtre :**
- Difficulté moyenne à élevée
- Anticipez les tâches de construction (commencez avant l'assignation)
- Tâches de message : construisez la volière

**Gestion de l'humeur :**
- Visez 40-60% d'humeur pour une marge de sécurité
- Si < 30%, concentrez-vous sur les tâches faciles

### Phase 3 : Fin de partie (15:00-Victoire)

**Tier actif :** 4 → 5

**Bâtiments disponibles :**
- À 20:00 : + Pyramide, Sphinx, Colisée

**Stratégie recommandée :**
1. **15:00-20:00 :** Construisez le maximum de palais (3 max = +1500 habitants)
2. **20:00-25:00 :** Construisez la pyramide (+200) et le sphinx (+400)
3. **25:00-Fin :** Construisez 1-2 colisées (+350 chacun, +25 or/min)
4. **Push final :** Villas, académies, grands temples en masse

**Objectif de population :** 10 000 habitants

**Ressources critiques :**
- Sable et pierre en grande quantité (pyramide = 150 sable, sphinx = 200 sable)
- Or pour financer les constructions massives (colisée = 3500 or)

**Tâches de Cléopâtre :**
- Très difficiles (1 pyramide, 5000 habitants, etc.)
- Délais longs (300-500 secondes)
- Récompenses massives (3000-8000 or)

**Gestion de l'humeur :**
- Si > 60%, vous êtes en sécurité
- Priorisez les monuments (donnent beaucoup d'habitants = tâches de population faciles)

---

## 14. Conseils Stratégiques

### Stratégies Universelles

#### Début de partie (0:00-5:00)

✅ **À FAIRE :**
1. **Maisons > Huttes** - 20 habitants vs 10, meilleur rapport coût/habitants
2. **Production de nourriture en priorité** - Champs immédiats, puis fermes
3. **Dépensez l'or rapidement** - L'or dort ne produit rien
4. **Anticipez les tâches** - Si vous voyez un pattern, construisez avant l'assignation
5. **Grenier précoce** - +500 stockage de nourriture évite les pénuries

❌ **À ÉVITER :**
1. Construire des huttes après les 2 premières minutes
2. Accumuler plus de 500 or sans raison
3. Ignorer la production d'eau (les puits sont bon marché)
4. Négliger les tâches de Cléopâtre (humeur à 15% = 0 marge d'erreur)

#### Milieu de partie (5:00-15:00)

✅ **À FAIRE :**
1. **Villas >> Maisons** - 60 habitants pour 500 or (excellente efficacité)
2. **Automatisation** - 1 carrière + 1 scierie libèrent les paysans
3. **Marchés avant temples** - Or passif > pics de population
4. **Ports dès que possible** - +80 habitants + +30 or/min (tier 3)
5. **Jardins stratégiques** - +25% croissance + nourriture

❌ **À ÉVITER :**
1. Sur-construire les thermes (bonus se chevauche, limité à 10)
2. Construire des pyramides trop tôt (inefficace avant tier 5)
3. Manquer de paysans (toujours garder 3-5 disponibles)
4. Ignorer les alertes de ressources (onglet Stats)

#### Fin de partie (15:00+)

✅ **À FAIRE :**
1. **Palais en priorité** - +500 habitants × 3 = +1500 total
2. **Sphinx > Pyramide** - +400 vs +200, meilleur rapport
3. **Multiplicateurs agressifs** - Construisez 10× villas/académies
4. **Stockage de sable** - Collectez 300-400 sable avant les monuments
5. **Focus monuments** - Ne construisez plus de petits bâtiments

❌ **À ÉVITER :**
1. Construire des huttes/maisons (inefficace à ce stade)
2. Négliger la production d'or (monuments coûtent 2000-5000 or)
3. Manquer de patience (monuments prennent 4-5 minutes)

### Gestion des Ressources

#### Nourriture

**Objectif :** Production > Consommation × 1.5

**Stratégie :**
- **Début :** 3-5 champs (15-25/min)
- **Milieu :** 2-3 fermes + 1 boulangerie (35-45/min)
- **Fin :** Jardins + fermes (maximiser)

**Seuil critique :** Ne descendez JAMAIS < 20 nourriture

#### Eau

**Objectif :** Production > Consommation × 2 (l'eau se consomme moins)

**Stratégie :**
- **Début :** 2-3 puits (20-30/min)
- **Milieu :** 1-2 citernes (40-60/min)
- **Fin :** Thermes + citernes

**Seuil critique :** Ne descendez JAMAIS < 10 eau

#### Or

**Objectif :** Dépenser pour gagner

**Stratégie :**
- **Début :** Investir dans production (champs, puits)
- **Milieu :** Construire des marchés (+20 or/min chacun)
- **Fin :** Ports + colisées (+30 et +25 or/min)

**Ne stockez PAS l'or** - Chaque pièce doit se multiplier via la production

#### Ressources de Construction

**Bois :**
- Début : Collecte manuelle (5 par 10s)
- Milieu : 1 atelier (+2/min)
- Fin : 1-3 scieries (+3/min chacune)

**Pierre :**
- Début : Collecte manuelle (3 par 15s)
- Milieu : 1 atelier (+2/min)
- Fin : 1-3 carrières (+3/min chacune)

**Sable :**
- **Critique pour les monuments**
- Collectez 200-300 unités avant le tier 5
- Production : uniquement collecte manuelle (8 par 8s)

**Terre :**
- Abondante (10 par 6s)
- Collectez au besoin

**Argile :**
- Moyenne demande (4 par 12s)
- Stockez 100-150 pour les monuments

### Gestion des Paysans

**Formule optimale :**
```
Paysans disponibles = 10% du total minimum
```

**Exemples :**
- 50 paysans → Gardez 5 disponibles
- 100 paysans → Gardez 10 disponibles
- 200 paysans → Gardez 20 disponibles

**Priorisation :**
1. Tâches de Cléopâtre urgentes (< 60s restantes)
2. Construction de bâtiments producteurs (champs, puits, marchés)
3. Collecte de ressources critiques (nourriture si < 30, sable pour monuments)
4. Construction de bâtiments résidentiels

### Gestion de l'Humeur de Cléopâtre

**Zones de sécurité :**
- **0-20%** : 🔴 DANGER - 1 échec = game over
- **20-40%** : 🟠 ATTENTION - Priorisez les tâches faciles
- **40-60%** : 🟡 STABLE - Gérez normalement
- **60-100%** : 🟢 SÉCURITÉ - Vous pouvez prendre des risques

**Stratégies de récupération :**

Si humeur < 25% :
1. Activez l'option "Auto-construction" dans les paramètres
2. Stockez des ressources à l'avance pour les tâches de collecte
3. Refusez les tâches impossibles (redémarrez si nécessaire)

Si humeur > 50% :
1. Utilisez la marge pour tenter des tâches difficiles
2. Récompenses des tâches difficiles = plus d'or

### Erreurs Courantes à Éviter

1. ❌ **Ignorer le timer de ration** - L'indicateur jaune (15s avant) est un avertissement
2. ❌ **Sur-construire le tier 1** - Les huttes atteignent rapidement le max (100)
3. ❌ **Ne pas anticiper les tâches** - Commencez la construction AVANT l'assignation
4. ❌ **Bloquer tous les paysans** - Gardez toujours 10% de disponibles
5. ❌ **Construire la volière trop tôt** - Ne la construisez qu'après la première tâche de message
6. ❌ **Négliger les statistiques** - L'onglet Stats affiche les alertes critiques
7. ❌ **Construire des pyramides avant 20:00** - Inefficace, préférez les palais

---

## 15. Statistiques et Analyse

### Onglet Stats (Panneau Droit)

Affiche en temps réel :

**Production actuelle :**
- Nourriture/min (total de tous les bâtiments producteurs)
- Eau/min
- Or/min
- Bois/min (si ateliers/scieries)
- Pierre/min (si ateliers/carrières)

**Consommation actuelle :**
- Nourriture : Total paysans × 1 par 60s
- Eau : Total paysans × 0.5 par 60s

**Alertes :**
- 🔴 **Critique** : Ressource < 10%, prévision d'épuisement < 2 minutes
- 🟡 **Avertissement** : Ressource < 50%, prévision d'épuisement < 5 minutes
- 🟢 **Normal** : Ressource > 50%

**Statistiques générales :**
- Temps de jeu total
- Bâtiments construits
- Tâches réussies/échouées
- Humeur actuelle de Cléopâtre

### Menu de Statistiques Avancées (📊)

Accessible via le bouton 📊 dans la barre supérieure.

**Graphiques d'historique des ressources :**
- Fenêtres temporelles : 1 min, 5 min, 10 min, 30 min, 1 heure
- Courbes pour : Or, Nourriture, Eau, Population
- Permet de voir les tendances et optimiser la production

**Graphique de distribution des bâtiments :**
- Camembert montrant la répartition par type
- Utile pour identifier les déséquilibres

**Production/Consommation :**
- Taux théorique (bâtiments uniquement)
- Taux réel (incluant collectes et consommation)
- Prévisions d'épuisement

**Système d'alertes :**
- Liste des ressources en danger
- Temps estimé avant épuisement
- Recommandations d'action

### Info-bulles des Ressources

Survolez une ressource dans la barre supérieure pour voir :
- **Valeur actuelle**
- **Production par minute** (si applicable)
- **Consommation par minute** (si applicable)
- **Solde net** : Production - Consommation
- **Temps avant épuisement** (si solde négatif)
- **Statut** : 🟢 Normal, 🟡 Avertissement, 🔴 Critique

**Exemple :**
```
🍞 Nourriture : 150
Production : +30/min
Consommation : -60/min
Solde : -30/min
⏱️ Épuisement dans : 5 minutes
🔴 Statut : Critique
```

### Utilisation des Statistiques

**Début de partie :**
- Vérifiez que Production nourriture > Consommation
- Surveillez l'évolution de la population

**Milieu de partie :**
- Analysez les graphiques sur 10-30 minutes
- Identifiez les pics de consommation lors des rations
- Ajustez la production en conséquence

**Fin de partie :**
- Utilisez les prévisions pour anticiper les besoins
- Stockez les ressources AVANT les grandes constructions

---

## 16. Sauvegarde et Chargement

### Sauvegarde Automatique

**Activation :**
- Bouton dans la barre supérieure (💾 Auto)
- S'active automatiquement en mode libre

**Fréquence :** Toutes les 2 minutes (120 secondes)

**Notification :** "Partie sauvegardée automatiquement" (toast vert)

### Sauvegarde Manuelle

**Bouton :** 💾 dans la barre supérieure

**Utilisation :** Cliquez pour sauvegarder immédiatement

**Notification :** "Partie sauvegardée !" (toast vert)

### Chargement

**Emplacement :** Menu principal → Bouton "Charger la partie"

**Condition :** Le bouton n'est actif que s'il existe une sauvegarde

**Effet :** Restaure l'état exact du jeu au moment de la sauvegarde

### Données Sauvegardées

**État du jeu :**
- Ressources : Or, nourriture, eau, bois, pierre, sable, terre, argile
- Population : Total, paysans disponibles/total
- Humeur de Cléopâtre
- Temps de jeu total

**Bâtiments :**
- Liste de tous les bâtiments construits
- Position sur la grille (x, y)
- État (en construction, terminé)
- Temps de construction restant

**Tâches de Cléopâtre :**
- Tâches actives avec temps restant
- Historique des tâches (réussies/échouées)

**Statistiques :**
- Historique de production (60 minutes maximum)
- Snapshots de ressources pour les graphiques

**Configuration :**
- Scénario actuel (freeplay, tutorial)
- Tier actuel
- Overrides de configuration (bâtiments débloqués, etc.)

**Multiplicateurs UI :**
- Multiplicateur de construction (x1, x5, x10, Max)
- Multiplicateur de collecte (x1, x5, x10, Max)

### Persistance

**Technologie :** LocalStorage du navigateur

**Clé :** `cleopatra_save`

**Format :** JSON compressé

**Limitation :** ~5-10 MB (largement suffisant pour ce jeu)

### Conseils de Sauvegarde

**Mode libre :**
- La sauvegarde automatique suffit généralement
- Sauvegardez manuellement avant de quitter le navigateur
- Sauvegardez avant de prendre des risques (humeur critique)

**Mode tutoriel :**
- Sauvegardez après chaque étape importante
- Rechargez si vous faites une erreur

**Attention :**
- Fermer le navigateur sans sauvegarder = perte de progression
- Les sauvegardes sont locales au navigateur (ne se transfèrent pas)

---

## 17. Options et Paramètres

### Menu Options (⚙️)

Accessible via le bouton ⚙️ dans la barre supérieure.

### Paramètres Audio

**Musique :**
- Volume : 0% à 100%
- Musique de menu (boucle)
- Musique de jeu (boucle)
- Transition fluide entre menu et jeu

**Effets Sonores (SFX) :**
- Volume : 0% à 100%
- Sons de boutons (clic)
- Sons de sélection de personnage (homme/femme, 3 variantes)
- Sons de Cléopâtre :
  - Nouvelle tâche (5 variantes)
  - Tâche réussie (4 variantes)
  - Tâche échouée (4 variantes)

**Astuce :** Réduisez le volume SFX si les sons de Cléopâtre deviennent répétitifs.

### Paramètres de Jeu

**Auto-construction :**
- Active/Désactive la construction automatique lors des tâches
- Utile si vous manquez de temps ou avez une humeur critique

**Affichage du timer de prochaine tâche :**
- Montre/Cache le compte à rebours avant la prochaine mission
- Utile pour anticiper les tâches

**Vitesse du jeu :**
- Non implémenté dans la version actuelle
- Prévu pour les futures versions (×1, ×2, ×5)

### Paramètres d'Affichage

**Notifications :**
- Durée d'affichage : 3 secondes par défaut
- Groupage intelligent (accumule les valeurs identiques)

**Canvas :**
- Zoom : Molette de souris
- Pan : Clic + glisser
- Réinitialisation : Double-clic

### Raccourcis Clavier

| Touche | Action |
|--------|--------|
| Espace | Pause/Reprendre |
| S | Sauvegarde manuelle |
| Échap | Fermer les menus |
| Tab | Changer d'onglet (Bâtiments → Tâches → Stats) |

---

## Conclusion

**Cléopâtre : Le Village du Nil** est un jeu de stratégie et de gestion profond qui récompense la planification, l'allocation efficace des ressources et la complétion ponctuelle des tâches.

### Clés du Succès

**Court terme (0:00-5:00) :**
- Établir une production stable de nourriture et d'eau
- Réussir TOUTES les tâches de Cléopâtre (humeur critique)
- Construire 500-1000 habitants

**Moyen terme (5:00-15:00) :**
- Automatiser la collecte de ressources (carrières, scieries)
- Construire des bâtiments producteurs d'or (marchés, ports)
- Atteindre 3000-5000 habitants
- Maintenir l'humeur > 40%

**Long terme (15:00-Victoire) :**
- Construire les monuments majeurs (palais, pyramides, sphinx)
- Maximiser la production de toutes les ressources
- Atteindre 10 000 habitants
- Garder l'humeur > 60% pour une marge de sécurité

### Formule de Victoire

```
Victoire = Production stable + Tâches réussies + Monuments stratégiques
```

**Production stable :**
- Nourriture > Consommation × 1.5
- Eau > Consommation × 2
- Or : 2-3 marchés/ports minimum

**Tâches réussies :**
- Anticipation (construire avant l'assignation)
- Stockage de ressources
- Gestion de l'humeur

**Monuments stratégiques :**
- Tier 4 : 3 palais (+1500 habitants)
- Tier 5 : Sphinx (+400), Pyramide (+200), Colisées (+350 chacun)

### Derniers Conseils

1. **La patience est une vertu** - Les monuments prennent 4-5 minutes, planifiez
2. **L'or travaille pour vous** - Chaque pièce doit se multiplier
3. **Anticipez Cléopâtre** - Ses tâches suivent des patterns
4. **Les statistiques sont vos amies** - Consultez l'onglet Stats régulièrement
5. **N'ayez pas peur de recommencer** - Le tutoriel existe pour une raison

---

*"Que Râ illumine ton chemin, et que Cléopâtre soit satisfaite de ton règne sur les rives du Nil."*

**Bonne chance, gouverneur(e) !**
