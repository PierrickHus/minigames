# 🐱 O'Cha'To - Le Restaurant des Chats

Un jeu de cuisine frénétique où vous incarnez un chat cuisinier gérant son propre restaurant !

## 🎯 Objectif

Servez **100 clients** avec succès sans perdre vos **3 vies** pour gagner la partie.

## 🎮 Comment jouer

### Contrôles
- **Clic gauche** : Prendre un ingrédient ou utiliser un ustensile
- **Bouton Menu** : Accéder au menu pendant le jeu
- **Bouton Pause** : Mettre le jeu en pause

### Déroulement d'une commande

1. **Collectez les ingrédients** nécessaires depuis le frigo
2. **Suivez les étapes** de la recette dans l'ordre
3. **Utilisez les bons ustensiles** pour chaque étape
4. **Servez le plat** avant la fin du timer !

### Système de vies
- Vous commencez avec **3 vies** (❤️)
- Vous perdez une vie si vous échouez à préparer un plat dans les temps
- À 0 vie, c'est **Game Over**

### Progression
- Les clients arrivent progressivement
- Les recettes deviennent de plus en plus complexes
- Le temps alloué diminue avec votre progression

## 🍳 Ustensiles de cuisine

- 🔥 **Four** - Cuisson longue (180s)
- 📡 **Micro-ondes** - Réchauffage rapide (60s)
- 🥄 **Batteur** - Mélange (30s)
- 🍳 **Poêle** - Cuisson moyenne (120s)
- 🍲 **Casserole** - Mijotage (150s)
- 🔪 **Couteau** - Découpage (20s)
- 🍽️ **Assiette** - Service (5s)

## 🥗 Ingrédients disponibles

### Légumes
🥬 Salade • 🍄 Champignon • 🍅 Tomate • 🥔 Pomme de terre • 🫑 Poivron • 🫛 Haricots verts • 🧅 Oignon • 🥕 Carotte

### Épices
🌶️ Curry • 🌶️ Piment • 🧂 Sel • ⚫ Poivre

### Produits laitiers
🥚 Œuf • 🥛 Lait • 🧀 Fromage • 🧈 Beurre

### Protéines & Autres
🥩 Viande • 🐟 Poisson • 🍞 Pain • 🍚 Riz • 🍝 Pâtes • 🍯 Miel • 🥧 Fond de tarte

## 🍽️ Exemples de recettes

### Faciles (⭐)
- 🥗 Salade Simple
- 🍯 Toast au Miel

### Moyennes (⭐⭐)
- 🍳 Omelette
- 🍲 Soupe de Légumes
- 🧀 Pâtes au Fromage

### Difficiles (⭐⭐⭐⭐)
- 🥧 Tarte aux Légumes
- 🥔 Gratin de Pommes de Terre
- 🥩 Steak et Haricots
- 🥧 Quiche aux Champignons

## 🎨 Interface

### Écrans disponibles
- **Menu Principal** : Nouvelle partie, Charger, Tutoriel, Guide, Crédits, Paramètres
- **Sélection du personnage** : Choisissez entre Chef Minou (♂) ou Cheffe Minette (♀)
- **Écran de jeu** : Cuisine en 2D avec tous les ustensiles et le frigo
- **Guide du jeu** : Explications complètes
- **Paramètres** : Volume musique/SFX, options d'affichage

### Panneau de commande
- Affiche la recette en cours
- Liste des ingrédients nécessaires
- Étapes de préparation
- Timer de la commande

### Notifications
- Ingrédients collectés
- Étapes validées
- Erreurs et alertes
- Score gagné

## 💾 Sauvegarde

Les paramètres sont automatiquement sauvegardés dans le localStorage :
- Volume de la musique
- Volume des effets sonores
- Préférences d'affichage

## 🛠️ Architecture technique

### Structure des fichiers
```
cookercat/
├── index.html                 # Page principale
├── css/
│   └── main.css              # Styles du jeu
├── src/
│   ├── main.js               # Point d'entrée
│   ├── core/
│   │   └── Game.js           # Logique principale
│   ├── ui/
│   │   └── ScreenManager.js  # Gestion des écrans
│   ├── renderer/
│   │   └── GameRenderer.js   # Rendu Canvas 2D
│   └── data/
│       ├── ingredients.js    # Définition des ingrédients
│       └── recipes.js        # Définition des recettes
└── README.md                 # Ce fichier
```

### Principes de développement

Le code suit les principes définis dans [CLAUDE.md](../CLAUDE.md) :
- ✅ Pas de rafraîchissement DOM inutile (mises à jour conditionnelles)
- ✅ Documentation JSDoc complète des classes et méthodes
- ✅ Respect des principes SOLID et Clean Code
- ✅ Nommage explicite et fonctions courtes
- ✅ Éviter la duplication de code (DRY)

## 🎯 Astuces pour gagner

1. **Anticipez** : Lisez la recette avant de commencer à collecter
2. **Soyez organisé** : Collectez tous les ingrédients avant de cuisiner
3. **Gérez le temps** : Les recettes simples sont rapides, privilégiez-les au début
4. **Progressez doucement** : Maîtrisez les recettes faciles avant d'affronter les difficiles
5. **Restez calme** : La précipitation mène aux erreurs !

## 📝 Notes de version

### Version 1.0.0
- Système de jeu complet avec 12 recettes
- 25+ ingrédients différents
- 7 ustensiles de cuisine
- Système de progression et de difficulté
- Interface complète avec menus
- Sauvegarde des paramètres

---

Bon appétit et bonne chance, Chef ! 🐱👨‍🍳
