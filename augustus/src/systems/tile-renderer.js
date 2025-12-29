// ==========================================
// SYSTÈME DE RENDU DES TUILES
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';
import { FACTIONS } from '../data/index.js';
import Camera from './Camera.js';

/**
 * Classe de rendu optimisée pour la carte à tuiles
 * Dessine uniquement les tuiles visibles
 */
class TileRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = game;

        // Caméra
        this.camera = new Camera(canvas.width, canvas.height);

        // Cache des tuiles visibles
        this.visibleTiles = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0
        };

        // Cache de couleurs pré-calculées
        this.terrainColors = { ...MAP_CONFIG.TERRAIN_COLORS };

        // Système de sprites
        this.spriteManager = null;
        this.animationTime = 0;
        this.lastFrameTime = 0;
    }

    /**
     * Met à jour le temps d'animation (appelé à chaque frame)
     */
    updateAnimationTime(timestamp) {
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = timestamp;
        }
        this.animationTime += timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
    }

    /**
     * Met à jour la taille du canvas
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.camera.setViewport(width, height);
    }

    /**
     * Centre la caméra sur une position en tuiles
     */
    centerOn(tileX, tileY) {
        this.camera.centerOn(tileX, tileY);
    }

    /**
     * Calcule les tuiles visibles à l'écran
     */
    calculateVisibleTiles() {
        this.visibleTiles = this.camera.getVisibleTiles();
    }

    /**
     * Convertit des coordonnées écran en coordonnées tuile
     */
    screenToTile(screenX, screenY) {
        return this.camera.screenToTile(screenX, screenY);
    }

    /**
     * Convertit des coordonnées tuile en coordonnées écran
     */
    tileToScreen(tileX, tileY) {
        return this.camera.tileToScreen(tileX, tileY);
    }

    /**
     * Vérifie si une tuile est visible
     */
    isTileVisible(x, y) {
        return this.camera.isTileVisible(x, y);
    }

    /**
     * Rendu principal
     */
    render() {
        if (!this.game.terrainMap) return;

        this.calculateVisibleTiles();

        const ctx = this.ctx;
        const tileSize = MAP_CONFIG.TILE_SIZE * this.camera.zoom;

        // Effacer le canvas avec la couleur de l'eau profonde
        ctx.fillStyle = MAP_CONFIG.TERRAIN_COLORS[0];
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sauvegarder le contexte
        ctx.save();

        // Dessiner les couches dans l'ordre
        this.renderTerrain(ctx, tileSize);
        this.renderCities(ctx, tileSize);
        this.renderSelections(ctx, tileSize);
        this.renderWaypointPaths(ctx, tileSize);
        this.renderArmies(ctx, tileSize);
        this.renderMovementPreview(ctx, tileSize);

        ctx.restore();

        // UI par-dessus (pas affectée par les transformations)
        this.renderUI(ctx);
    }

    /**
     * Dessine le terrain
     */
    renderTerrain(ctx, tileSize) {
        const { startX, startY, endX, endY } = this.visibleTiles;
        const terrainMap = this.game.terrainMap;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const terrainId = terrainMap.getTerrainId(x, y);
                const screenPos = this.tileToScreen(x, y);

                // Couleur de base du terrain
                ctx.fillStyle = this.terrainColors[terrainId] || '#ff00ff';
                ctx.fillRect(screenPos.x, screenPos.y, tileSize + 1, tileSize + 1);

                // Ajouter de la variation visuelle à zoom élevé
                if (this.camera.zoom >= 0.7) {
                    this.addTerrainDetail(ctx, x, y, screenPos, tileSize, terrainId);
                }
            }
        }

        // Dessiner les bordures de terrain à zoom élevé
        if (this.camera.zoom >= 1.0) {
            this.renderTerrainBorders(ctx, tileSize);
        }
    }

    /**
     * Ajoute des détails visuels au terrain
     */
    addTerrainDetail(ctx, x, y, screenPos, tileSize, terrainId) {
        const T = MAP_CONFIG.TERRAIN_IDS;

        // Utiliser la position comme seed pour la cohérence
        const seed = x * 1000 + y;
        const random = this.seededRandom(seed);

        switch (terrainId) {
            case T.FOREST:
            case T.DENSE_FOREST:
                // Arbres
                ctx.fillStyle = terrainId === T.DENSE_FOREST ? '#0d2818' : '#1a4025';
                const treesCount = terrainId === T.DENSE_FOREST ? 3 : 2;
                for (let i = 0; i < treesCount; i++) {
                    const tx = screenPos.x + random() * tileSize * 0.8 + tileSize * 0.1;
                    const ty = screenPos.y + random() * tileSize * 0.8 + tileSize * 0.1;
                    const ts = tileSize * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(tx, ty);
                    ctx.lineTo(tx - ts / 2, ty + ts);
                    ctx.lineTo(tx + ts / 2, ty + ts);
                    ctx.closePath();
                    ctx.fill();
                }
                break;

            case T.HILLS:
            case T.MOUNTAINS:
                // Relief
                const hillColor = terrainId === T.MOUNTAINS ? '#4a3520' : '#7a5a42';
                ctx.fillStyle = hillColor;
                const cx = screenPos.x + tileSize / 2;
                const cy = screenPos.y + tileSize / 2;
                const hr = tileSize * 0.3;
                ctx.beginPath();
                ctx.arc(cx + random() * 4 - 2, cy + random() * 4 - 2, hr, 0, Math.PI * 2);
                ctx.fill();
                break;

            case T.MARSH:
                // Végétation de marais
                ctx.fillStyle = '#5a7550';
                for (let i = 0; i < 4; i++) {
                    const mx = screenPos.x + random() * tileSize;
                    const my = screenPos.y + random() * tileSize;
                    ctx.fillRect(mx, my, 2, 4);
                }
                break;
        }
    }

    /**
     * Générateur de nombres pseudo-aléatoires avec seed
     */
    seededRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    /**
     * Dessine les bordures entre différents terrains
     */
    renderTerrainBorders(ctx, tileSize) {
        const { startX, startY, endX, endY } = this.visibleTiles;
        const terrainMap = this.game.terrainMap;

        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const terrainId = terrainMap.getTerrainId(x, y);
                const screenPos = this.tileToScreen(x, y);

                // Vérifier les voisins
                const rightTerrain = terrainMap.getTerrainId(x + 1, y);
                const bottomTerrain = terrainMap.getTerrainId(x, y + 1);

                if (terrainId !== rightTerrain) {
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x + tileSize, screenPos.y);
                    ctx.lineTo(screenPos.x + tileSize, screenPos.y + tileSize);
                    ctx.stroke();
                }

                if (terrainId !== bottomTerrain) {
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x, screenPos.y + tileSize);
                    ctx.lineTo(screenPos.x + tileSize, screenPos.y + tileSize);
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Dessine les villes
     */
    renderCities(ctx, tileSize) {
        if (!this.game.cities) return;

        for (const [cityId, city] of Object.entries(this.game.cities)) {
            if (!city.tiles) continue;

            const faction = FACTIONS[city.faction] || FACTIONS.rebels;
            const isSelected = this.game.selectedCity === cityId;

            // Dessiner chaque tuile de la ville
            for (const tile of city.tiles) {
                if (!this.isTileVisible(tile.x, tile.y)) continue;

                const screenPos = this.tileToScreen(tile.x, tile.y);

                // Fond coloré par faction
                ctx.fillStyle = `${faction.color}66`;
                ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);

                // Bordure
                ctx.strokeStyle = faction.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(screenPos.x, screenPos.y, tileSize, tileSize);

                // Icône de la tuile (à zoom suffisant)
                if (this.camera.zoom >= 0.5 && tile.type) {
                    const icon = tile.type.id === 'center' ?
                        (city.isCapital ? '🏛️' : '🏠') :
                        (tile.type.icon || '🏠');

                    ctx.font = `${Math.max(10, tileSize * 0.6)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(icon, screenPos.x + tileSize / 2, screenPos.y + tileSize / 2);
                }
            }

            // Nom de la ville (sur le centre)
            const centerTile = city.tiles.find(t => t.type && t.type.id === 'center');
            if (centerTile && this.isTileVisible(centerTile.x, centerTile.y)) {
                const screenPos = this.tileToScreen(centerTile.x, centerTile.y);

                ctx.font = `bold ${Math.max(10, tileSize * 0.5)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText(city.name, screenPos.x + tileSize / 2, screenPos.y + tileSize + 12);
                ctx.fillText(city.name, screenPos.x + tileSize / 2, screenPos.y + tileSize + 12);
            }

            // Sélection
            if (isSelected && centerTile) {
                const screenPos = this.tileToScreen(centerTile.x, centerTile.y);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 3]);
                ctx.strokeRect(
                    screenPos.x - 5,
                    screenPos.y - 5,
                    tileSize + 10,
                    tileSize + 10
                );
                ctx.setLineDash([]);
            }
        }
    }

    /**
     * Dessine les armées
     */
    renderArmies(ctx, tileSize) {
        if (!this.game.armies) return;

        for (const army of this.game.armies) {
            // Utiliser la position visuelle si disponible (pour l'animation)
            // Sinon utiliser tileX/tileY, sinon convertir depuis x/y
            let tx, ty;
            if (army.visualX !== undefined && army.visualY !== undefined) {
                tx = army.visualX;
                ty = army.visualY;
            } else if (army.tileX !== undefined) {
                tx = army.tileX;
                ty = army.tileY;
            } else {
                tx = Math.floor(army.x / 2);
                ty = Math.floor(army.y / 2);
            }

            // Vérifier la visibilité avec une marge pour les animations
            const margin = 2;
            if (tx < this.visibleTiles.startX - margin || tx > this.visibleTiles.endX + margin ||
                ty < this.visibleTiles.startY - margin || ty > this.visibleTiles.endY + margin) {
                continue;
            }

            // Convertir en position écran (supporte les positions fractionnelles)
            const screenPos = {
                x: (tx - this.camera.x) * tileSize,
                y: (ty - this.camera.y) * tileSize
            };
            const faction = FACTIONS[army.faction] || FACTIONS.rebels;
            const isSelected = this.game.selectedArmy && this.game.selectedArmy.id === army.id;
            const isPlayer = army.faction === this.game.playerFaction;
            const isMoving = this.game.armyManager?.isAnimating(army) || false;
            const direction = this.getArmyDirection(army);

            // Dessiner le sprite ou le fallback
            if (this.spriteManager && this.spriteManager.isReady()) {
                const frame = this.spriteManager.getFrame(
                    army.faction,
                    direction,
                    isMoving,
                    this.animationTime
                );
                if (frame) {
                    this.drawArmySprite(ctx, screenPos, tileSize, frame, faction);
                } else {
                    this.drawArmyFallback(ctx, screenPos, tileSize, faction);
                }
            } else {
                this.drawArmyFallback(ctx, screenPos, tileSize, faction);
            }

            // Nom (à zoom suffisant)
            if (this.camera.zoom >= 0.6) {
                ctx.font = `bold ${Math.max(8, tileSize * 0.35)}px Arial`;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeText(army.name, screenPos.x + tileSize / 2, screenPos.y + tileSize + 8);
                ctx.fillText(army.name, screenPos.x + tileSize / 2, screenPos.y + tileSize + 8);
            }

            // Sélection
            if (isSelected) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 3]);
                ctx.strokeRect(
                    screenPos.x - 3,
                    screenPos.y - 3,
                    tileSize + 6,
                    tileSize + 6
                );
                ctx.setLineDash([]);

                // Afficher MP si c'est le joueur
                if (isPlayer) {
                    ctx.font = `${Math.max(8, tileSize * 0.3)}px Arial`;
                    ctx.fillStyle = '#0f0';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        `PM: ${army.movementPoints}/${army.maxMovement}`,
                        screenPos.x + tileSize / 2,
                        screenPos.y - 5
                    );
                }
            }
        }
    }

    /**
     * Dessine un sprite d'armée
     */
    drawArmySprite(ctx, screenPos, tileSize, frame, faction) {
        // Le sprite fait 32x32, on l'adapte à la taille de la tuile
        const spriteScale = tileSize / 32;
        const drawWidth = 32 * spriteScale;
        const drawHeight = 32 * spriteScale;

        // Centrer le sprite sur la tuile, légèrement vers le haut
        const drawX = screenPos.x + (tileSize - drawWidth) / 2;
        const drawY = screenPos.y + (tileSize - drawHeight) / 2 - tileSize * 0.15;

        // Désactiver le lissage pour le pixel art
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
            frame.image,
            frame.sx, frame.sy, frame.sw, frame.sh,
            drawX, drawY, drawWidth, drawHeight
        );

        ctx.imageSmoothingEnabled = true;

        // Petite bannière de faction au-dessus du sprite
        ctx.fillStyle = faction.color;
        ctx.beginPath();
        ctx.moveTo(screenPos.x + tileSize * 0.7, screenPos.y - 2);
        ctx.lineTo(screenPos.x + tileSize - 2, screenPos.y + tileSize * 0.1);
        ctx.lineTo(screenPos.x + tileSize * 0.7, screenPos.y + tileSize * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Dessine le fallback (emoji) pour une armée
     */
    drawArmyFallback(ctx, screenPos, tileSize, faction) {
        // Bannière de faction
        ctx.fillStyle = faction.color;
        ctx.beginPath();
        ctx.moveTo(screenPos.x + tileSize * 0.7, screenPos.y + 2);
        ctx.lineTo(screenPos.x + tileSize - 2, screenPos.y + tileSize * 0.25);
        ctx.lineTo(screenPos.x + tileSize * 0.7, screenPos.y + tileSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icône de l'armée
        ctx.font = `${tileSize * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', screenPos.x + tileSize / 2, screenPos.y + tileSize * 0.6);
    }

    /**
     * Calcule la direction d'une armée
     */
    getArmyDirection(army) {
        // Si l'armée est en animation, calculer la direction depuis le mouvement
        if (this.game.armyManager?.animations) {
            const anim = this.game.armyManager.animations.get(army.id);
            if (anim && anim.path && anim.path.length > 1) {
                const fromIdx = anim.currentSegment;
                const toIdx = anim.currentSegment + 1;
                if (toIdx < anim.path.length) {
                    const dx = anim.path[toIdx].x - anim.path[fromIdx].x;
                    const dy = anim.path[toIdx].y - anim.path[fromIdx].y;
                    return this.vectorToDirection(dx, dy);
                }
            }
        }
        // Sinon utiliser la dernière direction connue ou défaut (sud)
        return army.lastDirection || 'S';
    }

    /**
     * Convertit un vecteur en direction
     */
    vectorToDirection(dx, dy) {
        if (dx === 0 && dy > 0) return 'S';
        if (dx === 0 && dy < 0) return 'N';
        if (dx > 0 && dy === 0) return 'E';
        if (dx < 0 && dy === 0) return 'W';
        if (dx > 0 && dy > 0) return 'SE';
        if (dx < 0 && dy > 0) return 'SW';
        if (dx > 0 && dy < 0) return 'NE';
        if (dx < 0 && dy < 0) return 'NW';
        return 'S';
    }

    /**
     * Dessine la prévisualisation du mouvement
     */
    renderMovementPreview(ctx, tileSize) {
        if (!this.game.movementPreview) return;

        const { path, canReachThisTurn, reachableIndex } = this.game.movementPreview;
        if (!path || path.length < 2) return;

        // Dessiner le chemin
        ctx.strokeStyle = canReachThisTurn ? '#ffd700' : '#ff8800';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);

        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const screenPos = this.tileToScreen(path[i].x, path[i].y);
            const centerX = screenPos.x + tileSize / 2;
            const centerY = screenPos.y + tileSize / 2;

            if (i === 0) {
                ctx.moveTo(centerX, centerY);
            } else {
                ctx.lineTo(centerX, centerY);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Marquer les tuiles atteignables ce tour
        if (reachableIndex !== undefined) {
            for (let i = 1; i <= reachableIndex; i++) {
                const screenPos = this.tileToScreen(path[i].x, path[i].y);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);
            }
        }

        // Destination finale
        const lastPos = path[path.length - 1];
        const screenPos = this.tileToScreen(lastPos.x, lastPos.y);
        ctx.fillStyle = canReachThisTurn ? '#ffd700' : '#ff8800';
        ctx.beginPath();
        ctx.arc(
            screenPos.x + tileSize / 2,
            screenPos.y + tileSize / 2,
            tileSize * 0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    /**
     * Dessine les sélections et highlights
     */
    renderSelections(ctx, tileSize) {
        // Tuiles accessibles en surbrillance (vert)
        if (this.game.reachableTiles) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';

            for (const [key] of this.game.reachableTiles) {
                const [x, y] = key.split(',').map(Number);
                if (this.isTileVisible(x, y)) {
                    const screenPos = this.tileToScreen(x, y);
                    ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);
                }
            }
        }
    }

    /**
     * Dessine les chemins des waypoints pour les armées du joueur
     */
    renderWaypointPaths(ctx, tileSize) {
        if (!this.game.armies || !this.game.pathfinder) return;

        // Afficher les waypoints de toutes les armées du joueur
        for (const army of this.game.armies) {
            if (army.faction !== this.game.playerFaction) continue;
            if (!army.waypoint) continue;

            const startTile = { x: army.tileX, y: army.tileY };
            const path = this.game.pathfinder.findPath(startTile, army.waypoint, {
                unitType: 'infantry',
                season: this.game.season
            });

            if (!path || path.length < 2) continue;

            // Dessiner le chemin en pointillés oranges
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);

            ctx.beginPath();
            for (let i = 0; i < path.length; i++) {
                const screenPos = this.tileToScreen(path[i].x, path[i].y);
                const centerX = screenPos.x + tileSize / 2;
                const centerY = screenPos.y + tileSize / 2;

                if (i === 0) {
                    ctx.moveTo(centerX, centerY);
                } else {
                    ctx.lineTo(centerX, centerY);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Marqueur de destination (drapeau)
            const lastPos = path[path.length - 1];
            const screenPos = this.tileToScreen(lastPos.x, lastPos.y);

            // Cercle orange pour la destination
            ctx.fillStyle = 'rgba(255, 136, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(
                screenPos.x + tileSize / 2,
                screenPos.y + tileSize / 2,
                tileSize * 0.4,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Icône drapeau
            ctx.font = `${tileSize * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚩', screenPos.x + tileSize / 2, screenPos.y + tileSize / 2);
        }
    }

    /**
     * Dessine l'interface utilisateur par-dessus
     */
    renderUI(ctx) {
        // Indicateur de zoom
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`Zoom: ${Math.round(this.camera.zoom * 100)}%`, 10, 20);

        // Coordonnées de la souris (debug)
        if (this.game.debugMode) {
            const mousePos = this.game.lastMouseTile;
            if (mousePos) {
                ctx.fillText(`Tuile: ${mousePos.x}, ${mousePos.y}`, 10, 35);
            }
        }
    }

    /**
     * Gestion du zoom
     */
    zoom(delta, centerX, centerY) {
        this.camera.applyZoom(delta, centerX, centerY);
    }

    /**
     * Déplacement de la caméra (pan)
     */
    pan(deltaX, deltaY) {
        this.camera.pan(deltaX, deltaY);
    }
}

export default TileRenderer;
