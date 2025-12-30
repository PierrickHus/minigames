// ==========================================
// RENDU DU VILLAGE - SYSTÈME AVANCÉ
// ==========================================

import { BUILDINGS, BUILDING_SHAPES } from '../data/index.js';

class VillageRenderer {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('villageCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Configuration de la grille - Plus grande avec tuiles plus petites
        this.tileSize = 24; // Tuiles plus petites (était 60)
        this.gridWidth = 40; // Plus large (était 15)
        this.gridHeight = 25; // Plus haut (était 10)

        // État de la vue
        this.offsetX = 0;
        this.offsetY = 0;
        this.selectedTile = null;
        this.hoveredTile = null;

        // Grille du village
        // Chaque cellule contient soit null, soit un objet { buildingUid, isOrigin }
        // buildingUid = identifiant unique du placement
        // isOrigin = true si c'est la cellule d'origine (coin supérieur gauche)
        this.grid = [];
        this.initGrid();

        // Registre des bâtiments placés
        // { uid: { buildingId, x, y, shapeIndex, constructing, builtAt } }
        this.placedBuildings = {};
        this.nextBuildingUid = 1;

        // Animations
        this.animations = [];
        this.peasantPositions = [];

        // Cache des positions par type de placement
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
     * Initialise la grille vide
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
     * Configure le canvas
     */
    setupCanvas() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Redimensionne le canvas
     */
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Centrer la vue
        this.offsetX = (this.canvas.width - this.gridWidth * this.tileSize) / 2;
        this.offsetY = (this.canvas.height - this.gridHeight * this.tileSize) / 2 - 30; // Décalé vers le haut pour le Nil
    }

    /**
     * Configure les événements
     */
    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.offsetX;
            const y = e.clientY - rect.top - this.offsetY;

            const tileX = Math.floor(x / this.tileSize);
            const tileY = Math.floor(y / this.tileSize);

            if (tileX >= 0 && tileX < this.gridWidth && tileY >= 0 && tileY < this.gridHeight) {
                this.hoveredTile = { x: tileX, y: tileY };
            } else {
                this.hoveredTile = null;
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredTile) {
                this.handleTileClick(this.hoveredTile.x, this.hoveredTile.y);
            } else {
                this.game.closeSidePanel();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredTile = null;
        });
    }

    /**
     * Gère le clic sur une tuile
     */
    handleTileClick(x, y) {
        const cell = this.grid[y][x];

        if (cell && cell.buildingUid) {
            const placed = this.placedBuildings[cell.buildingUid];
            if (placed) {
                // Passer l'uid pour identifier cette instance spécifique
                this.game.showBuildingInfo(placed.uid);
            }
        } else {
            this.game.closeSidePanel();
            this.selectedTile = { x, y };
        }
    }

    /**
     * Trouve le meilleur emplacement pour un bâtiment selon sa logique de placement
     */
    findBestPosition(buildingId) {
        const shapeConfig = BUILDING_SHAPES[buildingId];
        if (!shapeConfig) {
            // Fallback: bâtiment 1x1
            return this.findAnyFreePosition(1, 1, [[1]]);
        }

        const placement = shapeConfig.placement;
        const shapes = shapeConfig.shapes;

        // Essayer chaque forme dans un ordre aléatoire
        const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5);

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
     * Trouve une position selon le type de placement
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
     * Trouve une position en périphérie
     */
    findPeripheryPosition(width, height, shape) {
        const positions = [];
        const margin = 3; // Marge depuis le bord

        // Parcourir la périphérie (haut, bas, gauche, droite)
        for (let y = 0; y < this.gridHeight - height + 1; y++) {
            for (let x = 0; x < this.gridWidth - width + 1; x++) {
                const isPeriphery = x < margin || x >= this.gridWidth - width - margin ||
                                   y < margin || y >= this.gridHeight - height - margin - 3; // -3 pour éviter l'eau

                if (isPeriphery && this.canPlaceShape(x, y, width, height, shape)) {
                    // Score basé sur la distance au bord
                    const distToBorder = Math.min(x, y, this.gridWidth - x - width, this.gridHeight - y - height);
                    positions.push({ x, y, score: -distToBorder }); // Plus proche du bord = meilleur
                }
            }
        }

        if (positions.length === 0) return null;

        // Trier par score et prendre un des meilleurs avec un peu d'aléatoire
        positions.sort((a, b) => b.score - a.score);
        const topPositions = positions.slice(0, Math.min(10, positions.length));
        return topPositions[Math.floor(Math.random() * topPositions.length)];
    }

    /**
     * Trouve une position près d'un type de bâtiment
     */
    findNearBuildingPosition(buildingTypes, width, height, shape) {
        // Trouver tous les bâtiments du type recherché
        const targetBuildings = [];
        for (const uid in this.placedBuildings) {
            const placed = this.placedBuildings[uid];
            if (buildingTypes.includes(placed.buildingId) && !placed.constructing) {
                targetBuildings.push(placed);
            }
        }

        if (targetBuildings.length === 0) {
            // Aucun bâtiment cible, placer au centre
            return this.findCenterPosition(width, height, shape);
        }

        const positions = [];
        const searchRadius = 8;

        for (const target of targetBuildings) {
            // Chercher autour du bâtiment cible
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                    const x = target.x + dx;
                    const y = target.y + dy;

                    if (x >= 0 && y >= 0 &&
                        x + width <= this.gridWidth &&
                        y + height <= this.gridHeight - 3 && // Éviter l'eau
                        this.canPlaceShape(x, y, width, height, shape)) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist >= 2) { // Pas trop proche
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
     * Trouve une position au centre
     */
    findCenterPosition(width, height, shape) {
        const centerX = Math.floor(this.gridWidth / 2);
        const centerY = Math.floor((this.gridHeight - 3) / 2); // -3 pour l'eau
        const positions = [];

        // Chercher en spirale depuis le centre
        for (let radius = 0; radius < Math.max(this.gridWidth, this.gridHeight) / 2; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
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
            if (positions.length > 0) break;
        }

        if (positions.length === 0) return this.findAnyFreePosition(width, height, shape);

        return positions[Math.floor(Math.random() * positions.length)];
    }

    /**
     * Trouve une position au centre des habitations
     */
    findCenterHousesPosition(width, height, shape) {
        // Trouver le centre de masse des maisons
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

        // Calculer le centre de masse
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
     * Trouve une position près de l'eau
     */
    findNearWaterPosition(width, height, shape) {
        const positions = [];
        const waterY = this.gridHeight - 3; // Zone près de l'eau

        for (let y = waterY - 5; y < waterY - height + 1; y++) {
            for (let x = 0; x < this.gridWidth - width + 1; x++) {
                if (y >= 0 && this.canPlaceShape(x, y, width, height, shape)) {
                    const distToWater = waterY - y - height;
                    positions.push({ x, y, score: -distToWater }); // Plus proche de l'eau = meilleur
                }
            }
        }

        if (positions.length === 0) return this.findAnyFreePosition(width, height, shape);

        positions.sort((a, b) => b.score - a.score);
        const topPositions = positions.slice(0, Math.min(10, positions.length));
        return topPositions[Math.floor(Math.random() * topPositions.length)];
    }

    /**
     * Trouve n'importe quelle position libre
     */
    findAnyFreePosition(width, height, shape) {
        const positions = [];

        for (let y = 0; y < this.gridHeight - height - 3 + 1; y++) { // -3 pour l'eau
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
     * Vérifie si une forme peut être placée
     */
    canPlaceShape(startX, startY, width, height, shape) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (shape[dy][dx] === 1) {
                    const x = startX + dx;
                    const y = startY + dy;

                    // Vérifier les limites
                    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight - 3) {
                        return false;
                    }

                    // Vérifier si la cellule est libre
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

        // Marquer les cellules sur la grille
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

        // Mettre à jour le cache de placement
        this.updatePlacementCache(buildingId, x, y);

        // Retourner l'objet complet pour permettre l'accès à toutes les propriétés
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
     * Récupère un bâtiment à partir de coordonnées
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
     * Met à jour le cache de placement
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
     * Finalise un bâtiment construit (par UID ou coordonnées)
     */
    finishBuilding(xOrUid, y) {
        let placed = null;

        // Si y n'est pas défini, xOrUid est un UID
        if (y === undefined) {
            placed = this.placedBuildings[xOrUid];
        } else {
            // Sinon, chercher par coordonnées
            const cell = this.grid[y] && this.grid[y][xOrUid];
            if (cell && cell.buildingUid) {
                placed = this.placedBuildings[cell.buildingUid];
            }
        }

        if (placed) {
            placed.constructing = false;
            placed.builtAt = Date.now();

            // Animation de construction terminée
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
     * Ajoute une animation
     */
    addAnimation(animation) {
        this.animations.push(animation);
    }

    /**
     * Met à jour les animations
     */
    updateAnimations(deltaTime) {
        const now = Date.now();
        this.animations = this.animations.filter(anim => {
            return now - anim.startTime < anim.duration;
        });
    }

    /**
     * Met à jour les positions des paysans
     */
    updatePeasants() {
        const peasantCount = Math.min(this.game.state.availablePeasants, 30);

        while (this.peasantPositions.length < peasantCount) {
            this.peasantPositions.push({
                x: Math.random() * this.gridWidth * this.tileSize,
                y: Math.random() * (this.gridHeight - 3) * this.tileSize,
                targetX: Math.random() * this.gridWidth * this.tileSize,
                targetY: Math.random() * (this.gridHeight - 3) * this.tileSize,
                gender: Math.random() > 0.5 ? 'male' : 'female'
            });
        }

        while (this.peasantPositions.length > peasantCount) {
            this.peasantPositions.pop();
        }

        this.peasantPositions.forEach(peasant => {
            const dx = peasant.targetX - peasant.x;
            const dy = peasant.targetY - peasant.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {
                peasant.targetX = Math.random() * this.gridWidth * this.tileSize;
                peasant.targetY = Math.random() * (this.gridHeight - 3) * this.tileSize;
            } else {
                peasant.x += (dx / dist) * 0.3;
                peasant.y += (dy / dist) * 0.3;
            }
        });
    }

    /**
     * Dessine le village
     */
    render() {
        const ctx = this.ctx;

        // Fond désert
        ctx.fillStyle = '#c2a668';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner le Nil
        this.drawNile();

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);

        // Dessiner la grille
        this.drawGrid();

        // Dessiner les bâtiments
        this.drawBuildings();

        // Dessiner les paysans
        this.drawPeasants();

        // Dessiner les animations
        this.drawAnimations();

        // Dessiner le survol
        if (this.hoveredTile) {
            this.drawHover();
        }

        ctx.restore();

        // Dessiner les décorations
        this.drawDecorations();
    }

    /**
     * Dessine le Nil
     */
    drawNile() {
        const ctx = this.ctx;
        const riverY = this.offsetY + (this.gridHeight - 3) * this.tileSize;

        // Gradient pour l'eau
        const gradient = ctx.createLinearGradient(0, riverY, 0, riverY + 80);
        gradient.addColorStop(0, '#4a90c2');
        gradient.addColorStop(1, '#2c5a8a');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, riverY, this.canvas.width, 80);

        // Vagues
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        const time = Date.now() / 1000;

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            for (let x = 0; x < this.canvas.width; x += 8) {
                const y = riverY + 10 + i * 18 + Math.sin(x * 0.03 + time + i) * 3;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Roseaux
        ctx.fillStyle = '#4a7c4e';
        for (let x = 20; x < this.canvas.width; x += 60) {
            const height = 25 + Math.sin(x) * 8;
            ctx.fillRect(x, riverY - height, 2, height + 3);
            ctx.fillRect(x + 4, riverY - height + 4, 2, height);
            ctx.fillRect(x + 8, riverY - height + 8, 2, height - 4);
        }
    }

    /**
     * Dessine la grille
     */
    drawGrid() {
        const ctx = this.ctx;

        for (let y = 0; y < this.gridHeight - 3; y++) { // -3 pour l'eau
            for (let x = 0; x < this.gridWidth; x++) {
                const px = x * this.tileSize;
                const py = y * this.tileSize;

                // Fond de la tuile
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
     * Dessine les bâtiments
     */
    drawBuildings() {
        const ctx = this.ctx;

        // Dessiner chaque bâtiment placé
        for (const uid in this.placedBuildings) {
            const placed = this.placedBuildings[uid];
            const building = BUILDINGS[placed.buildingId];
            if (!building) continue;

            const px = placed.x * this.tileSize;
            const py = placed.y * this.tileSize;
            const pw = placed.width * this.tileSize;
            const ph = placed.height * this.tileSize;

            // Obtenir la forme pour dessiner correctement
            const shapeConfig = BUILDING_SHAPES[placed.buildingId];
            const shapeData = shapeConfig ? shapeConfig.shapes[placed.shapeIndex || 0] : { shape: [[1]] };

            if (placed.constructing) {
                // Bâtiment en construction
                const construction = this.game.state.constructions.find(c =>
                    c.position && c.position.x === placed.x && c.position.y === placed.y
                );
                const progress = construction ? construction.elapsed / construction.totalTime : 0;

                // Dessiner la forme en construction
                this.drawBuildingShape(px, py, shapeData.shape, 'rgba(255,215,0,0.3)');

                // Barre de progression
                const barY = py + ph - 8;
                ctx.fillStyle = '#333';
                ctx.fillRect(px + 2, barY, pw - 4, 6);
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(px + 2, barY, (pw - 4) * progress, 6);

                // Icône semi-transparente au centre
                ctx.globalAlpha = 0.5;
                const iconSize = Math.min(pw, ph) * 0.6;
                ctx.font = `${iconSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(building.icon, px + pw / 2, py + ph / 2 - 5);
                ctx.globalAlpha = 1;

                // Icône de construction
                ctx.font = '12px Arial';
                ctx.fillText('🏗️', px + pw - 10, py + 10);
            } else {
                // Bâtiment terminé
                // Ombre
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                this.drawBuildingShape(px + 3, py + 3, shapeData.shape, 'rgba(0,0,0,0.15)');

                // Fond du bâtiment
                this.drawBuildingShape(px, py, shapeData.shape, '#8b7355');

                // Bordure
                ctx.strokeStyle = '#6b5335';
                ctx.lineWidth = 1;
                this.strokeBuildingShape(px, py, shapeData.shape);

                // Icône
                const iconSize = Math.min(pw, ph) * 0.7;
                ctx.font = `${iconSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(building.icon, px + pw / 2, py + ph / 2);
            }
        }
    }

    /**
     * Dessine la forme d'un bâtiment
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
     * Dessine les paysans
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
     * Dessine les animations
     */
    drawAnimations() {
        const ctx = this.ctx;
        const now = Date.now();

        this.animations.forEach(anim => {
            const progress = Math.min(1, (now - anim.startTime) / anim.duration);
            if (progress >= 1) return; // Animation terminée

            if (anim.type === 'build') {
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
     * Dessine le survol
     */
    drawHover() {
        const ctx = this.ctx;
        const { x, y } = this.hoveredTile;

        if (y >= this.gridHeight - 3) return; // Pas de survol sur l'eau

        const px = x * this.tileSize;
        const py = y * this.tileSize;

        // Si c'est un bâtiment, surligner avec le contour exact de la forme
        const cell = this.grid[y][x];
        if (cell && cell.buildingUid) {
            const placed = this.placedBuildings[cell.buildingUid];
            if (placed && placed.shape) {
                this.drawShapeOutline(placed.x, placed.y, placed.shape, 'rgba(255,215,0,0.8)', 3);
                // Remplissage léger sur les cellules occupées
                this.fillShapeCells(placed.x, placed.y, placed.shape, 'rgba(255,215,0,0.1)');
            } else if (placed) {
                // Fallback si pas de shape (bâtiment 1x1)
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
            // Cellule vide - simple rectangle
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, this.tileSize, this.tileSize);
            ctx.fillStyle = 'rgba(255,215,0,0.15)';
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
        }
    }

    /**
     * Dessine le contour exact d'une forme de bâtiment
     */
    drawShapeOutline(startX, startY, shape, color, lineWidth) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const height = shape.length;
        const width = shape[0].length;

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        // Pour chaque cellule occupée, dessiner les bords extérieurs
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
     * Dessine les décorations
     */
    drawDecorations() {
        const ctx = this.ctx;

        // Palmiers
        ctx.font = '30px Arial';
        ctx.fillText('🌴', 25, 100);
        ctx.fillText('🌴', this.canvas.width - 380, 150);
        ctx.fillText('🌴', 40, this.canvas.height - 140);
        ctx.fillText('🌴', this.canvas.width - 400, this.canvas.height - 160);

        // Soleil
        ctx.font = '40px Arial';
        ctx.fillText('☀️', this.canvas.width - 420, 50);
    }

    /**
     * Boucle de mise à jour
     */
    update(deltaTime) {
        this.updateAnimations(deltaTime);
        this.updatePeasants();
    }

    /**
     * Exporte l'état pour la sauvegarde
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

            // Reconstruire la grille
            for (const uid in this.placedBuildings) {
                const placed = this.placedBuildings[uid];
                const shapeConfig = BUILDING_SHAPES[placed.buildingId];
                const shapeData = shapeConfig ?
                    shapeConfig.shapes[placed.shapeIndex || 0] :
                    { width: 1, height: 1, shape: [[1]] };

                // Marquer les cellules
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

        // Restaurer le cache
        if (savedState.placementCache) {
            this.placementCache = savedState.placementCache;
        }
    }
}

export default VillageRenderer;
