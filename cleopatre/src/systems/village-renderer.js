/**
 * Système de rendu du village égyptien
 * Gère l'affichage de la grille, des bâtiments, du Nil et des animations
 */

import { BUILDINGS, BUILDING_SHAPES } from '../data/index.js';

class VillageRenderer {
    /**
     * Crée une nouvelle instance du renderer de village
     * @param {Game} game - Instance du jeu principal
     */
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('villageCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Configuration de la grille
        this.tileSize = 26;
        this.gridWidth = 48;
        this.gridHeight = 28;

        // Décalage de base de la vue (calculé par resize)
        this.offsetX = 0;
        this.offsetY = 0;

        // Système de pan/zoom
        this.viewX = 0;  // Décalage horizontal par le joueur
        this.viewY = 0;  // Décalage vertical par le joueur
        this.zoom = 1;   // Niveau de zoom (1 = normal)
        this.minZoom = 1;
        this.maxZoom = 2;
        this.isMouseDown = false;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.viewStartX = 0;
        this.viewStartY = 0;

        // État de sélection
        this.selectedTile = null;
        this.hoveredTile = null;

        // Grille de placement: chaque cellule contient null ou { buildingUid, isOrigin }
        // isOrigin = true uniquement pour la cellule en haut à gauche du bâtiment
        this.grid = [];
        this.initGrid();

        // Registre des bâtiments placés indexé par uid
        // Format: { uid: { buildingId, x, y, shapeIndex, constructing, builtAt, ... } }
        this.placedBuildings = {};
        this.nextBuildingUid = 1;

        // Animations visuelles (ex: flash doré quand construction terminée)
        this.animations = [];

        // Positions des paysans animés
        this.peasantPositions = [];

        // Cache des positions pour optimiser le placement intelligent
        this.placementCache = {
            wells: [],
            farms: [],
            houses: [],
            markets: []
        };

        this.setupCanvas();
        this.setupEvents();
    }

    /**
     * Initialise la grille vide avec des cellules null
     */
    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = null;
            }
        }
    }

    /**
     * Configure le canvas et l'écouteur de redimensionnement
     */
    setupCanvas() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Redimensionne le canvas et recalcule la position de la grille
     * La grille est centrée horizontalement après le panneau Cléopâtre
     * et alignée verticalement pour que la rivière touche le bas
     */
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Positionner la grille après le panneau Cléopâtre (300px à gauche)
        const cleopatraPanelWidth = 300;
        const gridWidthPx = this.gridWidth * this.tileSize;
        const availableWidth = this.canvas.width - cleopatraPanelWidth;

        // Centrer la grille dans l'espace disponible
        if (gridWidthPx <= availableWidth) {
            this.offsetX = cleopatraPanelWidth + (availableWidth - gridWidthPx) / 2;
        } else {
            this.offsetX = cleopatraPanelWidth;
        }

        // Aligner la grille pour que la rivière (80px de haut) soit au bas du canvas
        // Les 3 dernières rangées de la grille sont réservées pour la zone d'eau
        const riverHeight = 80;
        this.offsetY = this.canvas.height - riverHeight - (this.gridHeight - 3) * this.tileSize;

        // Recalculer les limites de pan après resize
        this.clampView();
    }

    /**
     * Contraint la vue pour ne pas sortir des limites de la grille
     * Limites simples: pas de déplacement au-delà de la position de base
     */
    clampView() {
        // Limiter le déplacement à 0 maximum (pas de dépassement à droite/bas)
        // et permettre un déplacement négatif limité pour les petits écrans
        const gridWidthPx = this.gridWidth * this.tileSize * this.zoom;
        const gridHeightPx = this.gridHeight * this.tileSize * this.zoom;

        // On peut aller vers la gauche/haut si la grille zoomée dépasse l'écran
        const minX = Math.min(0, this.canvas.width - this.offsetX - gridWidthPx);
        const minY = Math.min(0, this.canvas.height - this.offsetY - gridHeightPx);

        this.viewX = Math.max(minX, Math.min(0, this.viewX));
        this.viewY = Math.max(minY, Math.min(0, this.viewY));
    }

    /**
     * Convertit les coordonnées écran en coordonnées grille
     * @param {number} screenX - Position X sur le canvas
     * @param {number} screenY - Position Y sur le canvas
     * @returns {object|null} - Coordonnées {x, y} de la tuile ou null si hors grille
     */
    screenToGrid(screenX, screenY) {
        // Retirer l'offset de base et le pan, puis diviser par zoom et taille tuile
        const x = (screenX - this.offsetX - this.viewX) / this.zoom;
        const y = (screenY - this.offsetY - this.viewY) / this.zoom;

        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        if (tileX >= 0 && tileX < this.gridWidth && tileY >= 0 && tileY < this.gridHeight) {
            return { x: tileX, y: tileY };
        }
        return null;
    }

    /**
     * Configure les événements de souris sur le canvas
     */
    setupEvents() {
        const DRAG_THRESHOLD = 5; // Pixels minimum pour considérer un drag

        // Détection de la tuile survolée et gestion du drag
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Si bouton gauche enfoncé, vérifier si on dépasse le seuil de drag
            if (this.isMouseDown && !this.isDragging) {
                const dx = mouseX - this.dragStartX;
                const dy = mouseY - this.dragStartY;
                if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                    this.isDragging = true;
                    this.canvas.style.cursor = 'grabbing';
                }
            }

            // Gestion du drag (pan)
            if (this.isDragging) {
                this.viewX = this.viewStartX + (mouseX - this.dragStartX);
                this.viewY = this.viewStartY + (mouseY - this.dragStartY);
                this.clampView();
                this.hoveredTile = null;
                return;
            }

            // Détection de la tuile survolée
            this.hoveredTile = this.screenToGrid(mouseX, mouseY);
        });

        // Début du drag potentiel (clic gauche)
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                const rect = this.canvas.getBoundingClientRect();
                this.isMouseDown = true;
                this.dragStartX = e.clientX - rect.left;
                this.dragStartY = e.clientY - rect.top;
                this.viewStartX = this.viewX;
                this.viewStartY = this.viewY;
            }
        });

        // Fin du drag ou clic
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                const wasDragging = this.isDragging;
                this.isMouseDown = false;
                this.isDragging = false;
                this.canvas.style.cursor = 'default';

                // Si c'était un clic (pas un drag), gérer le clic
                if (!wasDragging) {
                    if (this.hoveredTile) {
                        this.handleTileClick(this.hoveredTile.x, this.hoveredTile.y);
                    } else {
                        this.game.closeSidePanel();
                    }
                }
            }
        });

        // Zoom avec la molette
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Position du curseur dans le monde avant zoom
            const worldX = (mouseX - this.offsetX - this.viewX) / this.zoom;
            const worldY = (mouseY - this.offsetY - this.viewY) / this.zoom;

            // Appliquer le zoom
            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomDelta));

            // Ajuster la vue pour zoomer vers le curseur
            this.viewX = mouseX - this.offsetX - worldX * newZoom;
            this.viewY = mouseY - this.offsetY - worldY * newZoom;
            this.zoom = newZoom;

            this.clampView();
        }, { passive: false });

        // Réinitialiser le survol quand la souris quitte le canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredTile = null;
            this.isMouseDown = false;
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });

        // Empêcher le menu contextuel sur clic droit (pour éventuel usage futur)
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Gère le clic sur une tuile de la grille
     * @param {number} x - Coordonnée X de la tuile
     * @param {number} y - Coordonnée Y de la tuile
     */
    handleTileClick(x, y) {
        const cell = this.grid[y][x];

        if (cell && cell.buildingUid) {
            // Tuile occupée par un bâtiment -> afficher ses infos
            const placed = this.placedBuildings[cell.buildingUid];
            if (placed) {
                this.game.showBuildingInfo(placed.uid);
            }
        } else {
            // Tuile vide -> fermer le panneau et sélectionner la tuile
            this.game.closeSidePanel();
            this.selectedTile = { x, y };
        }
    }

    /**
     * Trouve le meilleur emplacement pour un bâtiment selon sa logique de placement
     * Essaie d'abord le placement intelligent, puis fallback sur n'importe quelle position libre
     * @param {string} buildingId - ID du type de bâtiment
     * @returns {object|null} - Position {x, y, shapeIndex} ou null si impossible
     */
    findBestPosition(buildingId) {
        const shapeConfig = BUILDING_SHAPES[buildingId];
        if (!shapeConfig) {
            // Bâtiment sans configuration de forme -> 1x1 par défaut
            return this.findAnyFreePosition(1, 1, [[1]]);
        }

        const placement = shapeConfig.placement;
        const shapes = shapeConfig.shapes;

        // Essayer chaque variante de forme dans un ordre aléatoire
        const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5);

        // Essayer d'abord le placement intelligent
        for (const shapeData of shuffledShapes) {
            const position = this.findPositionForPlacement(placement, shapeData, buildingId);
            if (position) {
                return { ...position, shapeIndex: shapes.indexOf(shapeData) };
            }
        }

        // Fallback: n'importe quelle position libre
        for (const shapeData of shuffledShapes) {
            const position = this.findAnyFreePosition(shapeData.width, shapeData.height, shapeData.shape);
            if (position) {
                return { ...position, shapeIndex: shapes.indexOf(shapeData) };
            }
        }

        return null;
    }

    /**
     * Trouve une position selon le type de placement défini pour le bâtiment
     * @param {string} placementType - Type de placement (periphery, near_well, center, etc.)
     * @param {object} shapeData - Données de forme {width, height, shape}
     * @param {string} buildingId - ID du bâtiment
     * @returns {object|null} - Position {x, y} ou null
     */
    findPositionForPlacement(placementType, shapeData, buildingId) {
        const { width, height, shape } = shapeData;

        switch (placementType) {
            case 'periphery':
                return this.findPeripheryPosition(width, height, shape);

            case 'near_well':
                return this.findNearBuildingPosition(['well', 'cistern'], width, height, shape);

            case 'near_farm':
                return this.findNearBuildingPosition(['farm', 'field'], width, height, shape);

            case 'near_house':
                return this.findNearBuildingPosition(['house', 'hut', 'villa'], width, height, shape);

            case 'near_market':
                return this.findNearBuildingPosition(['market'], width, height, shape);

            case 'center':
                return this.findCenterPosition(width, height, shape);

            case 'center_houses':
                return this.findCenterHousesPosition(width, height, shape);

            case 'near_water':
                return this.findNearWaterPosition(width, height, shape);

            default:
                return this.findAnyFreePosition(width, height, shape);
        }
    }

    /**
     * Trouve une position en périphérie de la grille (près des bords)
     * @param {number} width - Largeur du bâtiment en tuiles
     * @param {number} height - Hauteur du bâtiment en tuiles
     * @param {number[][]} shape - Matrice de forme du bâtiment
     * @returns {object|null} - Position {x, y, score} ou null
     */
    findPeripheryPosition(width, height, shape) {
        const positions = [];
        const margin = 3; // Distance depuis le bord pour être considéré en périphérie

        for (let y = 0; y < this.gridHeight - height + 1; y++) {
            for (let x = 0; x < this.gridWidth - width + 1; x++) {
                // Vérifier si la position est en périphérie (près d'un bord)
                const isPeriphery = x < margin || x >= this.gridWidth - width - margin ||
                                   y < margin || y >= this.gridHeight - height - margin - 3;

                if (isPeriphery && this.canPlaceShape(x, y, width, height, shape)) {
                    // Score négatif = plus proche du bord = meilleur
                    const distToBorder = Math.min(x, y, this.gridWidth - x - width, this.gridHeight - y - height);
                    positions.push({ x, y, score: -distToBorder });
                }
            }
        }

        if (positions.length === 0) return null;

        // Trier par score et choisir aléatoirement parmi les meilleurs
        positions.sort((a, b) => b.score - a.score);
        const topPositions = positions.slice(0, Math.min(10, positions.length));
        return topPositions[Math.floor(Math.random() * topPositions.length)];
    }

    /**
     * Trouve une position près d'un type de bâtiment spécifique
     * @param {string[]} buildingTypes - Types de bâtiments à proximité desquels placer
     * @param {number} width - Largeur du bâtiment
     * @param {number} height - Hauteur du bâtiment
     * @param {number[][]} shape - Matrice de forme
     * @returns {object|null} - Position ou null
     */
    findNearBuildingPosition(buildingTypes, width, height, shape) {
        // Trouver tous les bâtiments du type recherché qui sont construits
        const targetBuildings = [];
        for (const uid in this.placedBuildings) {
            const placed = this.placedBuildings[uid];
            if (buildingTypes.includes(placed.buildingId) && !placed.constructing) {
                targetBuildings.push(placed);
            }
        }

        if (targetBuildings.length === 0) {
            // Aucun bâtiment cible trouvé -> placer au centre
            return this.findCenterPosition(width, height, shape);
        }

        const positions = [];
        const searchRadius = 8;

        // Chercher autour de chaque bâtiment cible
        for (const target of targetBuildings) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                    const x = target.x + dx;
                    const y = target.y + dy;

                    if (x >= 0 && y >= 0 &&
                        x + width <= this.gridWidth &&
                        y + height <= this.gridHeight - 3 &&
                        this.canPlaceShape(x, y, width, height, shape)) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        // Éviter de placer trop près (distance >= 2)
                        if (dist >= 2) {
                            positions.push({ x, y, score: -dist });
                        }
                    }
                }
            }
        }

        if (positions.length === 0) return this.findAnyFreePosition(width, height, shape);

        positions.sort((a, b) => b.score - a.score);
        const topPositions = positions.slice(0, Math.min(5, positions.length));
        return topPositions[Math.floor(Math.random() * topPositions.length)];
    }

    /**
     * Trouve une position au centre de la grille (recherche en spirale)
     * @param {number} width - Largeur du bâtiment
     * @param {number} height - Hauteur du bâtiment
     * @param {number[][]} shape - Matrice de forme
     * @returns {object|null} - Position ou null
     */
    findCenterPosition(width, height, shape) {
        const centerX = Math.floor(this.gridWidth / 2);
        const centerY = Math.floor((this.gridHeight - 3) / 2); // -3 pour éviter l'eau
        const positions = [];

        // Recherche en spirale depuis le centre
        for (let radius = 0; radius < Math.max(this.gridWidth, this.gridHeight) / 2; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    // Ne considérer que le périmètre de la spirale
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                    const x = centerX + dx - Math.floor(width / 2);
                    const y = centerY + dy - Math.floor(height / 2);

                    if (x >= 0 && y >= 0 &&
                        x + width <= this.gridWidth &&
                        y + height <= this.gridHeight - 3 &&
                        this.canPlaceShape(x, y, width, height, shape)) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        positions.push({ x, y, score: -dist });
                    }
                }
            }
            // Dès qu'on trouve des positions valides, arrêter la recherche
            if (positions.length > 0) break;
        }

        if (positions.length === 0) return this.findAnyFreePosition(width, height, shape);

        return positions[Math.floor(Math.random() * positions.length)];
    }

    /**
     * Trouve une position au centre de masse des habitations existantes
     * Idéal pour les bâtiments de service (marché, temple, etc.)
     * @param {number} width - Largeur du bâtiment
     * @param {number} height - Hauteur du bâtiment
     * @param {number[][]} shape - Matrice de forme
     * @returns {object|null} - Position ou null
     */
    findCenterHousesPosition(width, height, shape) {
        // Collecter toutes les habitations
        const houses = [];
        for (const uid in this.placedBuildings) {
            const placed = this.placedBuildings[uid];
            if (['house', 'hut', 'villa', 'inn'].includes(placed.buildingId)) {
                houses.push(placed);
            }
        }

        if (houses.length === 0) {
            return this.findCenterPosition(width, height, shape);
        }

        // Calculer le centre de masse des habitations
        let avgX = 0, avgY = 0;
        for (const h of houses) {
            avgX += h.x;
            avgY += h.y;
        }
        avgX = Math.floor(avgX / houses.length);
        avgY = Math.floor(avgY / houses.length);

        // Chercher près du centre de masse
        const positions = [];
        const searchRadius = 10;

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const x = avgX + dx;
                const y = avgY + dy;

                if (x >= 0 && y >= 0 &&
                    x + width <= this.gridWidth &&
                    y + height <= this.gridHeight - 3 &&
                    this.canPlaceShape(x, y, width, height, shape)) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    positions.push({ x, y, score: -dist });
                }
            }
        }

        if (positions.length === 0) return this.findCenterPosition(width, height, shape);

        positions.sort((a, b) => b.score - a.score);
        const topPositions = positions.slice(0, Math.min(5, positions.length));
        return topPositions[Math.floor(Math.random() * topPositions.length)];
    }

    /**
     * Trouve une position près de l'eau (le Nil)
     * @param {number} width - Largeur du bâtiment
     * @param {number} height - Hauteur du bâtiment
     * @param {number[][]} shape - Matrice de forme
     * @returns {object|null} - Position ou null
     */
    findNearWaterPosition(width, height, shape) {
        const positions = [];
        const waterY = this.gridHeight - 3; // Limite de la zone d'eau

        // Chercher dans les 5 rangées au-dessus de l'eau
        for (let y = waterY - 5; y < waterY - height + 1; y++) {
            for (let x = 0; x < this.gridWidth - width + 1; x++) {
                if (y >= 0 && this.canPlaceShape(x, y, width, height, shape)) {
                    const distToWater = waterY - y - height;
                    positions.push({ x, y, score: -distToWater }); // Plus proche = meilleur
                }
            }
        }

        if (positions.length === 0) return this.findAnyFreePosition(width, height, shape);

        positions.sort((a, b) => b.score - a.score);
        const topPositions = positions.slice(0, Math.min(10, positions.length));
        return topPositions[Math.floor(Math.random() * topPositions.length)];
    }

    /**
     * Trouve n'importe quelle position libre sur la grille
     * @param {number} width - Largeur du bâtiment
     * @param {number} height - Hauteur du bâtiment
     * @param {number[][]} shape - Matrice de forme
     * @returns {object|null} - Position {x, y} ou null si grille pleine
     */
    findAnyFreePosition(width, height, shape) {
        const positions = [];

        // Parcourir toute la grille (sauf zone d'eau)
        for (let y = 0; y < this.gridHeight - height - 3 + 1; y++) {
            for (let x = 0; x < this.gridWidth - width + 1; x++) {
                if (this.canPlaceShape(x, y, width, height, shape)) {
                    positions.push({ x, y });
                }
            }
        }

        if (positions.length === 0) return null;
        return positions[Math.floor(Math.random() * positions.length)];
    }

    /**
     * Vérifie si une forme peut être placée à une position donnée
     * @param {number} startX - Position X de départ
     * @param {number} startY - Position Y de départ
     * @param {number} width - Largeur de la forme
     * @param {number} height - Hauteur de la forme
     * @param {number[][]} shape - Matrice de forme (1 = occupé, 0 = vide)
     * @returns {boolean} - true si le placement est possible
     */
    canPlaceShape(startX, startY, width, height, shape) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (shape[dy][dx] === 1) {
                    const x = startX + dx;
                    const y = startY + dy;

                    // Vérifier les limites (gridHeight - 3 pour éviter l'eau)
                    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight - 3) {
                        return false;
                    }

                    // Vérifier si la cellule est déjà occupée
                    if (this.grid[y][x] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Place un bâtiment sur la grille
     * @param {string} buildingId - L'ID du type de bâtiment (ex: "pyramid", "house")
     * @returns {object|null} - L'objet bâtiment placé avec son uid unique, ou null si impossible
     */
    placeBuilding(buildingId) {
        const position = this.findBestPosition(buildingId);
        if (!position) return null;

        const { x, y, shapeIndex } = position;
        const shapeConfig = BUILDING_SHAPES[buildingId];
        const shapeData = shapeConfig ? shapeConfig.shapes[shapeIndex || 0] : { width: 1, height: 1, shape: [[1]] };
        const { width, height, shape } = shapeData;

        // Créer l'entrée du bâtiment avec un uid unique
        const uid = this.nextBuildingUid++;
        const placedBuilding = {
            uid,              // Identifiant unique de cette instance
            buildingId,       // Type de bâtiment (référence vers BUILDINGS)
            x,
            y,
            width,
            height,
            shape,            // Forme pour le rendu du contour
            shapeIndex: shapeIndex || 0,
            constructing: true,
            builtAt: null,
            // Propriétés personnalisables par instance
            customName: null,
            level: 1,
            efficiency: 1.0
        };

        this.placedBuildings[uid] = placedBuilding;

        // Marquer les cellules occupées sur la grille
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (shape[dy][dx] === 1) {
                    this.grid[y + dy][x + dx] = {
                        buildingUid: uid,
                        isOrigin: (dx === 0 && dy === 0)
                    };
                }
            }
        }

        this.updatePlacementCache(buildingId, x, y);

        return placedBuilding;
    }

    /**
     * Récupère un bâtiment par son uid unique
     * @param {number} uid - L'identifiant unique du bâtiment
     * @returns {object|null} - L'objet bâtiment ou null si non trouvé
     */
    getBuildingByUid(uid) {
        return this.placedBuildings[uid] || null;
    }

    /**
     * Récupère un bâtiment à partir de coordonnées de grille
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @returns {object|null} - L'objet bâtiment ou null si non trouvé
     */
    getBuildingAt(x, y) {
        const cell = this.grid[y] && this.grid[y][x];
        if (cell && cell.buildingUid) {
            return this.placedBuildings[cell.buildingUid] || null;
        }
        return null;
    }

    /**
     * Met à jour le cache de placement pour optimiser les placements futurs
     * @param {string} buildingId - ID du bâtiment placé
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    updatePlacementCache(buildingId, x, y) {
        if (['well', 'cistern'].includes(buildingId)) {
            this.placementCache.wells.push({ x, y });
        } else if (['farm', 'field'].includes(buildingId)) {
            this.placementCache.farms.push({ x, y });
        } else if (['house', 'hut', 'villa'].includes(buildingId)) {
            this.placementCache.houses.push({ x, y });
        } else if (buildingId === 'market') {
            this.placementCache.markets.push({ x, y });
        }
    }

    /**
     * Finalise un bâtiment construit (marque comme terminé)
     * Peut être appelé avec un UID ou des coordonnées
     * @param {number} xOrUid - UID du bâtiment ou coordonnée X
     * @param {number} [y] - Coordonnée Y (si xOrUid est une coordonnée X)
     */
    finishBuilding(xOrUid, y) {
        let placed = null;

        if (y === undefined) {
            // xOrUid est un UID
            placed = this.placedBuildings[xOrUid];
        } else {
            // xOrUid est une coordonnée X
            const cell = this.grid[y] && this.grid[y][xOrUid];
            if (cell && cell.buildingUid) {
                placed = this.placedBuildings[cell.buildingUid];
            }
        }

        if (placed) {
            placed.constructing = false;
            placed.builtAt = Date.now();

            // Déclencher l'animation de construction terminée
            this.addAnimation({
                type: 'build',
                x: placed.x,
                y: placed.y,
                width: placed.width,
                height: placed.height,
                duration: 1000,
                startTime: Date.now()
            });
        }
    }

    /**
     * Ajoute une animation à la file d'attente
     * @param {object} animation - Configuration de l'animation
     */
    addAnimation(animation) {
        this.animations.push(animation);
    }

    /**
     * Met à jour les animations en cours (supprime celles terminées)
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame
     */
    updateAnimations(deltaTime) {
        const now = Date.now();
        this.animations = this.animations.filter(anim => {
            return now - anim.startTime < anim.duration;
        });
    }

    /**
     * Met à jour les positions des paysans animés
     * Les paysans se déplacent aléatoirement sur la grille
     */
    updatePeasants() {
        // Limiter le nombre de paysans visibles à 30 pour les performances
        const peasantCount = Math.min(this.game.state.availablePeasants, 30);

        // Ajouter des paysans si nécessaire
        while (this.peasantPositions.length < peasantCount) {
            this.peasantPositions.push({
                x: Math.random() * this.gridWidth * this.tileSize,
                y: Math.random() * (this.gridHeight - 3) * this.tileSize,
                targetX: Math.random() * this.gridWidth * this.tileSize,
                targetY: Math.random() * (this.gridHeight - 3) * this.tileSize,
                gender: Math.random() > 0.5 ? 'male' : 'female'
            });
        }

        // Retirer des paysans si trop nombreux
        while (this.peasantPositions.length > peasantCount) {
            this.peasantPositions.pop();
        }

        // Déplacer chaque paysan vers sa cible
        this.peasantPositions.forEach(peasant => {
            const dx = peasant.targetX - peasant.x;
            const dy = peasant.targetY - peasant.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {
                // Nouvelle cible aléatoire quand destination atteinte
                peasant.targetX = Math.random() * this.gridWidth * this.tileSize;
                peasant.targetY = Math.random() * (this.gridHeight - 3) * this.tileSize;
            } else {
                // Déplacement vers la cible
                peasant.x += (dx / dist) * 0.3;
                peasant.y += (dy / dist) * 0.3;
            }
        });
    }

    /**
     * Dessine le village complet
     * Ordre de rendu: fond -> Nil -> grille -> bâtiments -> paysans -> animations -> survol -> décorations
     */
    render() {
        const ctx = this.ctx;

        // Fond désert
        ctx.fillStyle = '#c2a668';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Appliquer la transformation de vue (pan + zoom)
        ctx.save();
        ctx.translate(this.offsetX + this.viewX, this.offsetY + this.viewY);
        ctx.scale(this.zoom, this.zoom);

        this.drawNile();
        this.drawGrid();
        this.drawBuildings();
        this.drawPeasants();
        this.drawAnimations();

        if (this.hoveredTile) {
            this.drawHover();
        }

        this.drawDecorations();

        ctx.restore();
    }

    /**
     * Dessine le Nil avec un gradient, des vagues animées et des roseaux
     * Coordonnées relatives à la grille (le contexte est déjà transformé)
     */
    drawNile() {
        const ctx = this.ctx;
        const riverY = (this.gridHeight - 3) * this.tileSize;
        const riverWidth = this.gridWidth * this.tileSize + 1000; // Étendre au-delà de la grille
        const riverStartX = -500; // Commencer bien avant la grille

        // Gradient bleu pour l'eau
        const gradient = ctx.createLinearGradient(0, riverY, 0, riverY + 80);
        gradient.addColorStop(0, '#4a90c2');
        gradient.addColorStop(1, '#2c5a8a');

        ctx.fillStyle = gradient;
        ctx.fillRect(riverStartX, riverY, riverWidth, 80);

        // Vagues animées
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        const time = Date.now() / 1000;

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            for (let x = riverStartX; x < riverStartX + riverWidth; x += 8) {
                const y = riverY + 10 + i * 18 + Math.sin(x * 0.03 + time + i) * 3;
                if (x === riverStartX) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Roseaux sur la berge
        ctx.fillStyle = '#4a7c4e';
        for (let x = 0; x < riverWidth; x += 60) {
            const height = 25 + Math.sin(x) * 8;
            ctx.fillRect(riverStartX + x, riverY - height, 2, height + 3);
            ctx.fillRect(riverStartX + x + 4, riverY - height + 4, 2, height);
            ctx.fillRect(riverStartX + x + 8, riverY - height + 8, 2, height - 4);
        }
    }

    /**
     * Dessine la grille de placement avec un motif en damier subtil
     */
    drawGrid() {
        const ctx = this.ctx;

        // Ne pas dessiner sur la zone d'eau (3 dernières rangées)
        for (let y = 0; y < this.gridHeight - 3; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                // Motif en damier avec alternance de couleurs
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = 'rgba(210,180,120,0.2)';
                } else {
                    ctx.fillStyle = 'rgba(200,170,110,0.2)';
                }
                ctx.fillRect(px, py, this.tileSize, this.tileSize);

                // Bordure légère
                ctx.strokeStyle = 'rgba(139,115,85,0.15)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, this.tileSize, this.tileSize);
            }
        }
    }

    /**
     * Dessine tous les bâtiments placés
     */
    drawBuildings() {
        const ctx = this.ctx;

        for (const uid in this.placedBuildings) {
            const placed = this.placedBuildings[uid];
            const building = BUILDINGS[placed.buildingId];
            if (!building) continue;

            const px = placed.x * this.tileSize;
            const py = placed.y * this.tileSize;
            const pw = placed.width * this.tileSize;
            const ph = placed.height * this.tileSize;

            const shapeConfig = BUILDING_SHAPES[placed.buildingId];
            const shapeData = shapeConfig ? shapeConfig.shapes[placed.shapeIndex || 0] : { shape: [[1]] };

            if (placed.constructing) {
                // Bâtiment en construction
                const construction = this.game.state.constructions.find(c =>
                    c.position && c.position.x === placed.x && c.position.y === placed.y
                );
                const progress = construction ? construction.elapsed / construction.totalTime : 0;

                // Fond semi-transparent
                this.drawBuildingShape(px, py, shapeData.shape, 'rgba(255,215,0,0.3)');

                // Barre de progression
                const barY = py + ph - 8;
                ctx.fillStyle = '#333';
                ctx.fillRect(px + 2, barY, pw - 4, 6);
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(px + 2, barY, (pw - 4) * progress, 6);

                // Icône du bâtiment (semi-transparente)
                ctx.globalAlpha = 0.5;
                const iconSize = Math.min(pw, ph) * 0.6;
                ctx.font = `${iconSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(building.icon, px + pw / 2, py + ph / 2 - 5);
                ctx.globalAlpha = 1;

                // Icône de chantier
                ctx.font = '12px Arial';
                ctx.fillText('🏗️', px + pw - 10, py + 10);
            } else {
                // Bâtiment terminé

                // Ombre portée
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                this.drawBuildingShape(px + 3, py + 3, shapeData.shape, 'rgba(0,0,0,0.15)');

                // Fond du bâtiment
                this.drawBuildingShape(px, py, shapeData.shape, '#8b7355');

                // Bordure
                ctx.strokeStyle = '#6b5335';
                ctx.lineWidth = 1;
                this.strokeBuildingShape(px, py, shapeData.shape);

                // Icône centrale
                const iconSize = Math.min(pw, ph) * 0.7;
                ctx.font = `${iconSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(building.icon, px + pw / 2, py + ph / 2);
            }
        }
    }

    /**
     * Dessine la forme d'un bâtiment (remplissage)
     * @param {number} startX - Position X de départ en pixels
     * @param {number} startY - Position Y de départ en pixels
     * @param {number[][]} shape - Matrice de forme
     * @param {string} color - Couleur de remplissage
     */
    drawBuildingShape(startX, startY, shape, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color;

        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx] === 1) {
                    ctx.fillRect(
                        startX + dx * this.tileSize + 1,
                        startY + dy * this.tileSize + 1,
                        this.tileSize - 2,
                        this.tileSize - 2
                    );
                }
            }
        }
    }

    /**
     * Dessine le contour d'un bâtiment
     * @param {number} startX - Position X de départ en pixels
     * @param {number} startY - Position Y de départ en pixels
     * @param {number[][]} shape - Matrice de forme
     */
    strokeBuildingShape(startX, startY, shape) {
        const ctx = this.ctx;

        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx] === 1) {
                    ctx.strokeRect(
                        startX + dx * this.tileSize + 1,
                        startY + dy * this.tileSize + 1,
                        this.tileSize - 2,
                        this.tileSize - 2
                    );
                }
            }
        }
    }

    /**
     * Dessine les paysans animés sur la grille
     */
    drawPeasants() {
        const ctx = this.ctx;

        this.peasantPositions.forEach(peasant => {
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const icon = peasant.gender === 'male' ? '👨' : '👩';
            ctx.fillText(icon, peasant.x, peasant.y);
        });
    }

    /**
     * Dessine les animations visuelles (flash de construction, etc.)
     */
    drawAnimations() {
        const ctx = this.ctx;
        const now = Date.now();

        this.animations.forEach(anim => {
            const progress = Math.min(1, (now - anim.startTime) / anim.duration);
            if (progress >= 1) return;

            if (anim.type === 'build') {
                // Cercle doré qui s'estompe
                const px = anim.x * this.tileSize + (anim.width * this.tileSize) / 2;
                const py = anim.y * this.tileSize + (anim.height * this.tileSize) / 2;
                const radius = Math.max(0, (1 - progress) * 40);

                ctx.beginPath();
                ctx.arc(px, py, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,215,0,${0.5 * (1 - progress)})`;
                ctx.fill();
            }
        });
    }

    /**
     * Dessine le survol de tuile/bâtiment
     */
    drawHover() {
        const ctx = this.ctx;
        const { x, y } = this.hoveredTile;

        // Pas de survol sur la zone d'eau
        if (y >= this.gridHeight - 3) return;

        const px = x * this.tileSize;
        const py = y * this.tileSize;

        const cell = this.grid[y][x];
        if (cell && cell.buildingUid) {
            // Survol d'un bâtiment -> surligner toute sa forme
            const placed = this.placedBuildings[cell.buildingUid];
            if (placed && placed.shape) {
                this.drawShapeOutline(placed.x, placed.y, placed.shape, 'rgba(255,215,0,0.8)', 3);
                this.fillShapeCells(placed.x, placed.y, placed.shape, 'rgba(255,215,0,0.1)');
            } else if (placed) {
                // Fallback pour bâtiment 1x1 sans shape
                ctx.strokeStyle = 'rgba(255,215,0,0.8)';
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    placed.x * this.tileSize,
                    placed.y * this.tileSize,
                    placed.width * this.tileSize,
                    placed.height * this.tileSize
                );
            }
        } else {
            // Survol d'une cellule vide
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, this.tileSize, this.tileSize);
            ctx.fillStyle = 'rgba(255,215,0,0.15)';
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
        }
    }

    /**
     * Dessine le contour exact d'une forme de bâtiment (bords extérieurs uniquement)
     * @param {number} startX - Position X en tuiles
     * @param {number} startY - Position Y en tuiles
     * @param {number[][]} shape - Matrice de forme
     * @param {string} color - Couleur du contour
     * @param {number} lineWidth - Épaisseur du trait
     */
    drawShapeOutline(startX, startY, shape, color, lineWidth) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const height = shape.length;
        const width = shape[0].length;

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        // Pour chaque cellule occupée, dessiner uniquement les bords extérieurs
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (shape[dy][dx] !== 1) continue;

                const cellX = (startX + dx) * ts;
                const cellY = (startY + dy) * ts;

                // Bord haut (si pas de cellule au-dessus)
                if (dy === 0 || shape[dy - 1][dx] !== 1) {
                    ctx.moveTo(cellX, cellY);
                    ctx.lineTo(cellX + ts, cellY);
                }

                // Bord bas (si pas de cellule en-dessous)
                if (dy === height - 1 || shape[dy + 1][dx] !== 1) {
                    ctx.moveTo(cellX, cellY + ts);
                    ctx.lineTo(cellX + ts, cellY + ts);
                }

                // Bord gauche (si pas de cellule à gauche)
                if (dx === 0 || shape[dy][dx - 1] !== 1) {
                    ctx.moveTo(cellX, cellY);
                    ctx.lineTo(cellX, cellY + ts);
                }

                // Bord droit (si pas de cellule à droite)
                if (dx === width - 1 || shape[dy][dx + 1] !== 1) {
                    ctx.moveTo(cellX + ts, cellY);
                    ctx.lineTo(cellX + ts, cellY + ts);
                }
            }
        }

        ctx.stroke();
    }

    /**
     * Remplit les cellules d'une forme avec une couleur
     * @param {number} startX - Position X en tuiles
     * @param {number} startY - Position Y en tuiles
     * @param {number[][]} shape - Matrice de forme
     * @param {string} color - Couleur de remplissage
     */
    fillShapeCells(startX, startY, shape, color) {
        const ctx = this.ctx;
        const ts = this.tileSize;

        ctx.fillStyle = color;

        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[0].length; dx++) {
                if (shape[dy][dx] === 1) {
                    ctx.fillRect(
                        (startX + dx) * ts,
                        (startY + dy) * ts,
                        ts,
                        ts
                    );
                }
            }
        }
    }

    /**
     * Dessine les décorations (palmiers, soleil) autour de la grille
     * Coordonnées relatives à la grille (le contexte est déjà transformé)
     */
    drawDecorations() {
        const ctx = this.ctx;
        const gridRight = this.gridWidth * this.tileSize;

        // Palmiers aux quatre coins de la grille
        ctx.font = '30px Arial';
        ctx.fillText('🌴', -40, 30);
        ctx.fillText('🌴', gridRight + 10, 50);
        ctx.fillText('🌴', -35, (this.gridHeight - 4) * this.tileSize);
        ctx.fillText('🌴', gridRight + 15, (this.gridHeight - 5) * this.tileSize);

        // Soleil en haut à droite (relatif à la grille)
        ctx.font = '40px Arial';
        ctx.fillText('☀️', gridRight + 50, -20);
    }

    /**
     * Boucle de mise à jour appelée chaque frame
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame en ms
     */
    update(deltaTime) {
        this.updateAnimations(deltaTime);
        this.updatePeasants();
    }

    /**
     * Exporte l'état du renderer pour la sauvegarde
     * @returns {object} - État sérialisable
     */
    exportState() {
        return {
            placedBuildings: { ...this.placedBuildings },
            nextBuildingUid: this.nextBuildingUid,
            placementCache: { ...this.placementCache }
        };
    }

    /**
     * Importe l'état depuis une sauvegarde
     * @param {object} savedState - État sauvegardé
     */
    importState(savedState) {
        if (!savedState) return;

        // Réinitialiser la grille
        this.initGrid();
        this.placedBuildings = {};

        // Restaurer les bâtiments
        if (savedState.placedBuildings) {
            this.placedBuildings = savedState.placedBuildings;
            this.nextBuildingUid = savedState.nextBuildingUid || 1;

            // Reconstruire la grille à partir des bâtiments
            for (const uid in this.placedBuildings) {
                const placed = this.placedBuildings[uid];
                const shapeConfig = BUILDING_SHAPES[placed.buildingId];
                const shapeData = shapeConfig ?
                    shapeConfig.shapes[placed.shapeIndex || 0] :
                    { width: 1, height: 1, shape: [[1]] };

                // Marquer les cellules occupées
                for (let dy = 0; dy < shapeData.height; dy++) {
                    for (let dx = 0; dx < shapeData.width; dx++) {
                        if (shapeData.shape[dy][dx] === 1) {
                            const x = placed.x + dx;
                            const y = placed.y + dy;
                            if (y < this.gridHeight && x < this.gridWidth) {
                                this.grid[y][x] = {
                                    buildingUid: parseInt(uid),
                                    isOrigin: (dx === 0 && dy === 0)
                                };
                            }
                        }
                    }
                }
            }
        }

        // Restaurer le cache de placement
        if (savedState.placementCache) {
            this.placementCache = savedState.placementCache;
        }
    }
}

export default VillageRenderer;
