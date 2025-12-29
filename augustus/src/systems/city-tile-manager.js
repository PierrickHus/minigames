// ==========================================
// GESTIONNAIRE DE TUILES DE VILLE
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';
import {
    CITY_TILE_TYPES,
    getCityCategory,
    calculateTileCount
} from '../data/city-tiles.js';

/**
 * Gère le placement et la croissance des villes multi-tuiles
 */
class CityTileManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Génère le layout de tuiles pour une ville
     * @param {Object} city - Objet ville avec tileX, tileY, population
     * @returns {Array} Tableau de tuiles {x, y, type}
     */
    generateCityLayout(city) {
        const category = getCityCategory(city.population);
        const maxTiles = category.maxTiles;
        const tiles = [];

        // Toujours commencer par le centre
        tiles.push({
            x: city.tileX,
            y: city.tileY,
            type: CITY_TILE_TYPES.CENTER
        });

        if (maxTiles <= 1) return tiles;

        // Pattern d'expansion en spirale
        const expansionPattern = this.getSpiralPattern(maxTiles);

        // Types de tuiles à assigner (triés par priorité)
        const tileTypesToAssign = this.determineTileTypes(city, maxTiles);

        let typeIndex = 0;

        for (let i = 0; i < expansionPattern.length && tiles.length < maxTiles; i++) {
            const offset = expansionPattern[i];
            const nx = city.tileX + offset.dx;
            const ny = city.tileY + offset.dy;

            // Vérifier si la tuile est valide pour l'expansion
            if (this.isValidExpansionTile(nx, ny, city, tiles)) {
                // Déterminer le type de tuile
                let tileType = tileTypesToAssign[typeIndex] || CITY_TILE_TYPES.RESIDENTIAL;

                // Si la tuile est côtière et qu'on n'a pas encore de port
                if (this.isCoastalTile(nx, ny) && !tiles.some(t => t.type.id === 'port')) {
                    if (city.coastal) {
                        tileType = CITY_TILE_TYPES.PORT;
                    }
                }

                tiles.push({
                    x: nx,
                    y: ny,
                    type: tileType
                });

                typeIndex++;
            }
        }

        return tiles;
    }

    /**
     * Génère un pattern de spirale pour l'expansion
     */
    getSpiralPattern(maxSize) {
        const pattern = [];
        const directions = [
            { dx: 1, dy: 0 },   // Droite
            { dx: 0, dy: 1 },   // Bas
            { dx: -1, dy: 0 },  // Gauche
            { dx: 0, dy: -1 }   // Haut
        ];

        let x = 0, y = 0;
        let dirIndex = 0;
        let stepsInDir = 1;
        let stepsTaken = 0;
        let turnsAtThisLength = 0;

        for (let i = 0; i < maxSize * maxSize; i++) {
            x += directions[dirIndex].dx;
            y += directions[dirIndex].dy;
            pattern.push({ dx: x, dy: y });

            stepsTaken++;
            if (stepsTaken >= stepsInDir) {
                stepsTaken = 0;
                dirIndex = (dirIndex + 1) % 4;
                turnsAtThisLength++;
                if (turnsAtThisLength >= 2) {
                    turnsAtThisLength = 0;
                    stepsInDir++;
                }
            }
        }

        return pattern;
    }

    /**
     * Détermine les types de tuiles à assigner pour une ville
     */
    determineTileTypes(city, tileCount) {
        const types = [];

        // Répartition basée sur la taille de la ville
        if (tileCount >= 2) {
            types.push(CITY_TILE_TYPES.RESIDENTIAL);
        }
        if (tileCount >= 3) {
            types.push(CITY_TILE_TYPES.FARMLAND);
        }
        if (tileCount >= 4) {
            types.push(CITY_TILE_TYPES.MARKET);
        }
        if (tileCount >= 5) {
            types.push(CITY_TILE_TYPES.MILITARY);
        }
        if (tileCount >= 6) {
            types.push(CITY_TILE_TYPES.RESIDENTIAL);
            types.push(CITY_TILE_TYPES.FARMLAND);
        }
        if (tileCount >= 8) {
            types.push(CITY_TILE_TYPES.TEMPLE);
            types.push(CITY_TILE_TYPES.INDUSTRIAL);
        }
        if (tileCount >= 10) {
            types.push(CITY_TILE_TYPES.RESIDENTIAL);
            types.push(CITY_TILE_TYPES.MARKET);
        }

        // Remplir le reste avec des résidentiels et agricoles
        while (types.length < tileCount - 1) {
            types.push(Math.random() > 0.5 ?
                CITY_TILE_TYPES.RESIDENTIAL :
                CITY_TILE_TYPES.FARMLAND
            );
        }

        return types;
    }

    /**
     * Vérifie si une tuile est valide pour l'expansion
     */
    isValidExpansionTile(x, y, city, existingTiles) {
        // Hors limites
        if (x < 0 || x >= MAP_CONFIG.GRID_WIDTH ||
            y < 0 || y >= MAP_CONFIG.GRID_HEIGHT) {
            return false;
        }

        // Déjà occupée par cette ville
        if (existingTiles.some(t => t.x === x && t.y === y)) {
            return false;
        }

        // Vérifier le terrain
        if (this.game && this.game.terrainMap) {
            const terrain = this.game.terrainMap.getTerrain(x, y);

            // Pas d'expansion sur l'eau
            if (!terrain.isPassable) {
                return false;
            }

            // Pas d'expansion sur les montagnes hautes
            if (terrain.id === MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS) {
                return false;
            }
        }

        // Vérifier si une autre ville occupe cette tuile
        if (this.game && this.game.cities) {
            for (const [cityId, otherCity] of Object.entries(this.game.cities)) {
                if (cityId === city.id) continue;
                if (otherCity.tiles && otherCity.tiles.some(t => t.x === x && t.y === y)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Vérifie si une tuile est adjacente à l'eau
     */
    isCoastalTile(x, y) {
        if (!this.game || !this.game.terrainMap) return false;

        for (const dir of MAP_CONFIG.DIRECTIONS) {
            if (this.game.terrainMap.isWater(x + dir.dx, y + dir.dy)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Met à jour les tuiles d'une ville (après changement de population)
     */
    updateCityTiles(city) {
        const oldTileCount = city.tiles ? city.tiles.length : 0;
        const newTileCount = calculateTileCount(city.population);

        // Croissance nécessaire
        if (newTileCount > oldTileCount) {
            city.tiles = this.generateCityLayout(city);
            this.recalculateCityStats(city);
            return true;
        }

        return false;
    }

    /**
     * Recalcule les statistiques d'une ville basées sur ses tuiles
     */
    recalculateCityStats(city) {
        if (!city.tiles || city.tiles.length === 0) return;

        let totalPopulationCapacity = 0;
        let totalDefense = 0;
        let totalGoldBonus = 0;
        let totalFoodBonus = 0;
        let totalHappinessBonus = 0;

        for (const tile of city.tiles) {
            totalPopulationCapacity += tile.type.populationCapacity || 0;
            totalDefense += tile.type.defenseBonus || 0;
            totalGoldBonus += tile.type.goldBonus || 0;
            totalFoodBonus += tile.type.foodBonus || 0;
            totalHappinessBonus += tile.type.happinessBonus || 0;
        }

        city.populationCapacity = totalPopulationCapacity;
        city.tileDefenseBonus = totalDefense;
        city.tileGoldBonus = totalGoldBonus;
        city.tileFoodBonus = totalFoodBonus;
        city.tileHappinessBonus = totalHappinessBonus;

        // Vérifier si la ville a un port
        city.hasPort = city.tiles.some(t => t.type.id === 'port');
    }

    /**
     * Vérifie si une position est occupée par une ville
     * @returns {Object|null} La ville occupant cette tuile ou null
     */
    getCityAtTile(x, y) {
        if (!this.game || !this.game.cities) return null;

        for (const [cityId, city] of Object.entries(this.game.cities)) {
            if (city.tiles && city.tiles.some(t => t.x === x && t.y === y)) {
                return city;
            }
        }
        return null;
    }

    /**
     * Obtient toutes les tuiles occupées par les villes
     * @returns {Set} Set de clés "x,y"
     */
    getAllCityTiles() {
        const tiles = new Set();

        if (this.game && this.game.cities) {
            for (const city of Object.values(this.game.cities)) {
                if (city.tiles) {
                    for (const tile of city.tiles) {
                        tiles.add(`${tile.x},${tile.y}`);
                    }
                }
            }
        }

        return tiles;
    }

    /**
     * Initialise les tuiles pour toutes les villes
     */
    initializeAllCities() {
        if (!this.game || !this.game.cities) return;

        for (const city of Object.values(this.game.cities)) {
            city.tiles = this.generateCityLayout(city);
            this.recalculateCityStats(city);
        }
    }

    /**
     * Obtient la catégorie (nom) d'une ville
     */
    getCityTypeName(city) {
        const category = getCityCategory(city.population);
        return category.name;
    }
}

export default CityTileManager;
