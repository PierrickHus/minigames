// ==========================================
// CLASSE DE GESTION DU TERRAIN
// ==========================================

import { MAP_CONFIG, isValidTile } from './MapConfig.js';
import { getTerrainById, TERRAIN_TYPES } from '../data/terrain-types.js';
import { getClimateById, getSeasonMovementModifier, calculateAttrition } from '../data/climate-zones.js';

/**
 * Classe gérant la carte de terrain
 * Utilise des Uint8Array pour un stockage compact et performant
 */
class TerrainMap {
    constructor(width = MAP_CONFIG.GRID_WIDTH, height = MAP_CONFIG.GRID_HEIGHT) {
        this.width = width;
        this.height = height;

        // Couche de terrain (type de terrain pour chaque tuile)
        this.terrainData = new Uint8Array(width * height);

        // Couche de climat (zone climatique pour chaque tuile)
        this.climateData = new Uint8Array(width * height);

        // Couche d'élévation (0-255 pour effets visuels)
        this.elevationData = new Uint8Array(width * height);

        // Couche de propriété (faction qui contrôle la tuile)
        this.ownershipData = new Uint8Array(width * height);

        // Cache pour les tuiles visibles (optimisation)
        this.visibleCache = null;
        this.visibleCacheKey = '';
    }

    // ========== ACCESSEURS DE BASE ==========

    /**
     * Convertit des coordonnées 2D en index linéaire
     */
    getIndex(x, y) {
        return y * this.width + x;
    }

    /**
     * Convertit un index linéaire en coordonnées 2D
     */
    getCoords(index) {
        return {
            x: index % this.width,
            y: Math.floor(index / this.width)
        };
    }

    /**
     * Obtient le type de terrain à une position
     * @returns {Object} Objet terrain avec toutes ses propriétés
     */
    getTerrain(x, y) {
        if (!isValidTile(x, y)) {
            return TERRAIN_TYPES.IMPASSABLE_MOUNTAINS;
        }
        const id = this.terrainData[this.getIndex(x, y)];
        return getTerrainById(id);
    }

    /**
     * Obtient l'ID du terrain à une position
     * @returns {number} ID du terrain
     */
    getTerrainId(x, y) {
        if (!isValidTile(x, y)) {
            return MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS;
        }
        return this.terrainData[this.getIndex(x, y)];
    }

    /**
     * Définit le type de terrain à une position
     */
    setTerrain(x, y, terrainId) {
        if (!isValidTile(x, y)) return;
        this.terrainData[this.getIndex(x, y)] = terrainId;
    }

    /**
     * Obtient la zone climatique à une position
     * @returns {Object} Objet climat avec toutes ses propriétés
     */
    getClimate(x, y) {
        if (!isValidTile(x, y)) {
            return getClimateById(MAP_CONFIG.CLIMATE_IDS.ALPINE);
        }
        const id = this.climateData[this.getIndex(x, y)];
        return getClimateById(id);
    }

    /**
     * Définit la zone climatique à une position
     */
    setClimate(x, y, climateId) {
        if (!isValidTile(x, y)) return;
        this.climateData[this.getIndex(x, y)] = climateId;
    }

    /**
     * Obtient l'élévation à une position (0-255)
     */
    getElevation(x, y) {
        if (!isValidTile(x, y)) return 255;
        return this.elevationData[this.getIndex(x, y)];
    }

    /**
     * Définit l'élévation à une position
     */
    setElevation(x, y, elevation) {
        if (!isValidTile(x, y)) return;
        this.elevationData[this.getIndex(x, y)] = Math.min(255, Math.max(0, elevation));
    }

    /**
     * Obtient la faction propriétaire à une position (0 = neutre)
     */
    getOwnership(x, y) {
        if (!isValidTile(x, y)) return 0;
        return this.ownershipData[this.getIndex(x, y)];
    }

    /**
     * Définit la faction propriétaire à une position
     */
    setOwnership(x, y, factionId) {
        if (!isValidTile(x, y)) return;
        this.ownershipData[this.getIndex(x, y)] = factionId;
    }

    // ========== CALCULS DE GAMEPLAY ==========

    /**
     * Calcule le coût de mouvement pour une tuile
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {number} season - Index de la saison (0-3)
     * @param {string} unitType - Type d'unité ('infantry', 'cavalry', 'naval')
     * @returns {number} Coût de mouvement
     */
    getMovementCost(x, y, season = 0, unitType = 'infantry') {
        const terrain = this.getTerrain(x, y);
        const climate = this.getClimate(x, y);

        // Terrain impassable
        if (!terrain.isPassable && unitType !== 'naval') {
            return Infinity;
        }

        // Unités navales ne peuvent aller que sur l'eau
        if (unitType === 'naval' && !terrain.isNaval) {
            return Infinity;
        }

        let cost = terrain.movementCost;

        // Modificateur de saison
        const seasonMod = getSeasonMovementModifier(climate.key || 'temperate', season);
        cost *= seasonMod;

        // Modificateurs par type d'unité
        if (unitType === 'cavalry') {
            if (terrain.id === MAP_CONFIG.TERRAIN_IDS.FOREST) cost *= 1.5;
            if (terrain.id === MAP_CONFIG.TERRAIN_IDS.DENSE_FOREST) cost *= 2.0;
            if (terrain.id === MAP_CONFIG.TERRAIN_IDS.MOUNTAINS) cost *= 1.5;
            if (terrain.id === MAP_CONFIG.TERRAIN_IDS.MARSH) cost *= 1.5;
        }

        return cost;
    }

    /**
     * Calcule le taux d'attrition pour une tuile
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {number} season - Index de la saison (0-3)
     * @returns {number} Taux d'attrition (0.0 - 1.0)
     */
    getAttritionRate(x, y, season = 0) {
        const terrain = this.getTerrain(x, y);
        const climate = this.getClimate(x, y);

        return calculateAttrition(
            terrain.attritionRate,
            climate.key || 'temperate',
            season
        );
    }

    /**
     * Calcule le bonus de défense pour une tuile
     * @returns {number} Bonus de défense en pourcentage
     */
    getDefenseBonus(x, y) {
        const terrain = this.getTerrain(x, y);
        return terrain.defenseBonus;
    }

    /**
     * Vérifie si une tuile est traversable
     */
    isPassable(x, y, isNaval = false) {
        const terrain = this.getTerrain(x, y);
        if (isNaval) {
            return terrain.isNaval;
        }
        return terrain.isPassable;
    }

    /**
     * Vérifie si une tuile est de l'eau (pour la navigation)
     */
    isWater(x, y) {
        const terrainId = this.getTerrainId(x, y);
        return terrainId === MAP_CONFIG.TERRAIN_IDS.DEEP_WATER ||
               terrainId === MAP_CONFIG.TERRAIN_IDS.SHALLOW_WATER;
    }

    /**
     * Vérifie si une tuile est côtière (adjacent à l'eau)
     */
    isCoastal(x, y) {
        if (this.isWater(x, y)) return false;

        for (const dir of MAP_CONFIG.DIRECTIONS) {
            if (this.isWater(x + dir.dx, y + dir.dy)) {
                return true;
            }
        }
        return false;
    }

    // ========== OPÉRATIONS EN ZONE ==========

    /**
     * Remplit une zone rectangulaire avec un terrain
     */
    fillRect(x, y, width, height, terrainId) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.setTerrain(x + dx, y + dy, terrainId);
            }
        }
    }

    /**
     * Remplit un cercle avec un terrain
     */
    fillCircle(centerX, centerY, radius, terrainId) {
        const radiusSq = radius * radius;
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                if (dx * dx + dy * dy <= radiusSq) {
                    this.setTerrain(x, y, terrainId);
                }
            }
        }
    }

    /**
     * Dessine une ligne de terrain (pour routes, rivières)
     */
    drawLine(x1, y1, x2, y2, terrainId, thickness = 1) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            // Dessiner avec épaisseur
            if (thickness === 1) {
                this.setTerrain(x, y, terrainId);
            } else {
                this.fillCircle(x, y, Math.floor(thickness / 2), terrainId);
            }

            if (x === x2 && y === y2) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    // ========== SÉRIALISATION ==========

    /**
     * Exporte la carte en format JSON compressé
     */
    export() {
        return {
            width: this.width,
            height: this.height,
            terrain: Array.from(this.terrainData),
            climate: Array.from(this.climateData),
            elevation: Array.from(this.elevationData),
            ownership: Array.from(this.ownershipData)
        };
    }

    /**
     * Importe une carte depuis des données JSON
     */
    import(data) {
        if (data.width !== this.width || data.height !== this.height) {
            this.width = data.width;
            this.height = data.height;
            this.terrainData = new Uint8Array(this.width * this.height);
            this.climateData = new Uint8Array(this.width * this.height);
            this.elevationData = new Uint8Array(this.width * this.height);
            this.ownershipData = new Uint8Array(this.width * this.height);
        }

        this.terrainData.set(data.terrain);
        if (data.climate) this.climateData.set(data.climate);
        if (data.elevation) this.elevationData.set(data.elevation);
        if (data.ownership) this.ownershipData.set(data.ownership);
    }

    /**
     * Réinitialise la carte avec un terrain par défaut
     */
    clear(defaultTerrain = MAP_CONFIG.TERRAIN_IDS.DEEP_WATER) {
        this.terrainData.fill(defaultTerrain);
        this.climateData.fill(MAP_CONFIG.CLIMATE_IDS.TEMPERATE);
        this.elevationData.fill(0);
        this.ownershipData.fill(0);
    }
}

export default TerrainMap;
