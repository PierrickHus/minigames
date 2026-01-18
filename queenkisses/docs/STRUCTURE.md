# 📁 Structure du Projet

## Vue d'ensemble

```
queenkisses/
├── 📄 index.html              # Jeu principal
├── 📄 debug.html              # Mode debug des patterns
├── 📄 README.md               # Documentation principale
├── 📄 STRUCTURE.md            # Ce fichier
├── 📄 .gitignore              # Fichiers à ignorer
│
├── 📂 src/                    # Code source JavaScript (11 fichiers)
│   ├── game-pooled.js         # ⭐ Jeu principal avec Object Pooling
│   ├── debug-game.js          # Mode debug
│   │
│   ├── config.js              # Configuration centralisée
│   ├── entities.js            # Entités (King, Queen, Diamond, Projectile)
│   ├── renderer.js            # Système de rendu Canvas
│   │
│   ├── collision-system.js    # Détection de collisions
│   ├── game-state-manager.js  # Gestion d'état du jeu
│   ├── input-manager.js       # Gestion des inputs (clavier/souris)
│   ├── pattern-system.js      # 13 patterns de projectiles DOOM
│   ├── ui-manager.js          # Gestion de l'interface DOM
│   └── object-pool.js         # Optimisation Object Pooling
│
├── 📂 css/                    # Feuilles de style (2 fichiers)
│   ├── style.css              # Styles du jeu principal
│   └── debug-styles.css       # Styles du mode debug
│
├── 📂 assets/                 # Ressources multimédia
│   ├── images/                # Images du jeu (vide)
│   ├── music/                 # Musiques (vide)
│   └── sfx/                   # Effets sonores (vide)
│
└── 📂 docs/                   # Documentation technique (2 fichiers)
    ├── OBJECT_POOLING.md      # Documentation du pattern Object Pooling
    └── FINAL_SUMMARY.md       # Synthèse complète du projet
```

## 📊 Statistiques

- **Total fichiers JS**: 11 (dans src/)
- **Total fichiers CSS**: 2 (dans css/)
- **Total fichiers HTML**: 2 (racine)
- **Total documentation**: 4 fichiers MD
- **Lignes de code**: ~2500 (0% duplication)

## 🎯 Fichiers Principaux

### Jeu
- **index.html** - Point d'entrée du jeu
- **src/game-pooled.js** - Jeu avec toutes les optimisations

### Debug
- **debug.html** - Interface de debug
- **src/debug-game.js** - Logique du mode debug

## 🏗️ Architecture Modulaire

### Core Systems (src/)
Chaque fichier a une responsabilité unique (principe SOLID):

1. **config.js** (3.4 KB)
   - Configuration centralisée
   - Patterns DOOM
   - Messages de la reine
   - Paramètres du pool

2. **entities.js** (15 KB)
   - King (joueur)
   - Queen (ennemi)
   - Diamond (collectible)
   - Projectile (bullets)
   - SpeechBubble (dialogues)

3. **renderer.js** (12 KB)
   - Rendu Canvas optimisé
   - Cache d'emojis
   - Effets visuels (shake, particules)
   - Accélération matérielle

4. **pattern-system.js** (14 KB)
   - 13 patterns DOOM
   - Génération de projectiles
   - Support Object Pooling

5. **collision-system.js** (2.8 KB)
   - Détection de collisions
   - Hitbox précise

6. **game-state-manager.js** (5.6 KB)
   - État du jeu (score, vies, mode)
   - Transitions DOOM
   - Timer

7. **input-manager.js** (4.3 KB)
   - Gestion clavier
   - Gestion souris
   - Events centralisés

8. **ui-manager.js** (7.5 KB)
   - Manipulation DOM
   - Mises à jour conditionnelles
   - Cache des valeurs

9. **object-pool.js** (6.8 KB)
   - Pool générique réutilisable
   - ProjectilePool spécialisé
   - PoolManager singleton
   - Statistiques en temps réel

10. **game-pooled.js** (21 KB)
    - Orchestration de tous les systèmes
    - Boucle de jeu
    - Gestion des events
    - Production ready

11. **debug-game.js** (11 KB)
    - Réutilise TOUS les systèmes
    - AI pour le roi (5 modes)
    - Statistiques en temps réel
    - Interface de test

## 📁 Dossier assets/

Prêt à recevoir:
- **images/** - Sprites, backgrounds, UI
- **music/** - Pistes musicales
- **sfx/** - Effets sonores (tirs, hits, collecte)

Actuellement utilise des emojis rendus via Canvas.

## 📚 Documentation

- **README.md** - Guide principal
- **STRUCTURE.md** - Ce fichier
- **docs/OBJECT_POOLING.md** - Pattern technique
- **docs/FINAL_SUMMARY.md** - Synthèse complète

## 🎨 Styles

- **css/style.css** - Jeu principal (animations, UI)
- **css/debug-styles.css** - Interface debug (panneaux, stats)

## 🚀 Points d'Entrée

### Production
```html
<!-- index.html charge -->
<link rel="stylesheet" href="css/style.css">
<script type="module" src="src/game-pooled.js"></script>
```

### Debug
```html
<!-- debug.html charge -->
<link rel="stylesheet" href="css/debug-styles.css">
<script type="module" src="src/debug-game.js"></script>
```

## 📦 Dépendances

**Aucune!** Le projet utilise uniquement:
- Vanilla JavaScript (ES6 modules)
- Canvas 2D natif
- CSS3

## 🔄 Flux de Données

```
index.html
    ↓
src/game-pooled.js (orchestrateur)
    ↓
Initialise:
    - Renderer
    - InputManager
    - PatternSystem (+ ProjectilePool)
    - CollisionSystem
    - GameStateManager
    - UIManager
    ↓
Game Loop:
    - Update (logique)
    - Render (affichage)
    ↓
Utilise:
    - entities.js (King, Queen, etc.)
    - config.js (constantes)
```

## 💡 Principes Appliqués

- ✅ **SOLID** - Chaque module a une responsabilité
- ✅ **DRY** - 0% de duplication
- ✅ **KISS** - Simple et lisible
- ✅ **Clean Code** - Nommage explicite, JSDoc
- ✅ **Object Pooling** - Optimisation mémoire

## 🎯 Prochaines Étapes Possibles

1. Ajouter des images dans `assets/images/`
2. Ajouter de la musique dans `assets/music/`
3. Ajouter des SFX dans `assets/sfx/`
4. Créer un build system (Vite)
5. Migrer vers TypeScript
6. Ajouter des tests unitaires

---

**Structure propre, modulaire et optimisée! 🚀**
