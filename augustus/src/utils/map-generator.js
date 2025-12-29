// ==========================================
// GÉNÉRATEUR DE CARTE D'EUROPE (VERSION AMÉLIORÉE)
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';

/**
 * Génère une carte de l'Europe méditerranéenne pour la période romaine
 * Utilise du bruit simplifié pour des contours naturels
 */
class MapGenerator {
    constructor() {
        this.map = null;
        this.width = MAP_CONFIG.GRID_WIDTH;
        this.height = MAP_CONFIG.GRID_HEIGHT;
        this.seed = Date.now();
    }

    /**
     * Bruit pseudo-aléatoire simple basé sur position
     */
    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return n - Math.floor(n);
    }

    /**
     * Bruit interpolé pour des transitions douces
     */
    smoothNoise(x, y, scale = 20) {
        const sx = x / scale;
        const sy = y / scale;

        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const fx = sx - x0;
        const fy = sy - y0;

        const v00 = this.noise(x0, y0);
        const v10 = this.noise(x0 + 1, y0);
        const v01 = this.noise(x0, y0 + 1);
        const v11 = this.noise(x0 + 1, y0 + 1);

        const i1 = v00 * (1 - fx) + v10 * fx;
        const i2 = v01 * (1 - fx) + v11 * fx;

        return i1 * (1 - fy) + i2 * fy;
    }

    /**
     * Bruit fractal (plusieurs octaves)
     */
    fractalNoise(x, y, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.smoothNoise(x * frequency, y * frequency, 30) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value / maxValue;
    }

    /**
     * Dessine les masses terrestres principales
     * Basé sur la carte de référence de l'Europe en 300 av. J.-C.
     */
    generateLandmasses() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        // ========== PÉNINSULE IBÉRIQUE ==========
        // Forme plus carrée/compacte comme sur la carte de référence
        this.fillSmoothPolygon([
            { x: 8, y: 108 },    // Nord-Ouest (Galice)
            { x: 25, y: 95 },    // Côte nord
            { x: 55, y: 88 },    // Asturies
            { x: 85, y: 85 },    // Cantabrie
            { x: 110, y: 90 },   // Pays Basque
            { x: 130, y: 105 },  // Pyrénées ouest
            { x: 145, y: 118 },  // Pyrénées est
            { x: 148, y: 135 },  // Catalogne nord
            { x: 140, y: 155 },  // Catalogne sud
            { x: 120, y: 175 },  // Valence
            { x: 95, y: 188 },   // Murcie
            { x: 65, y: 195 },   // Andalousie est
            { x: 35, y: 192 },   // Andalousie ouest
            { x: 18, y: 180 },   // Gibraltar
            { x: 5, y: 165 },    // Algarve
            { x: 0, y: 145 },    // Portugal sud
            { x: 0, y: 125 },    // Portugal centre
        ], T.PLAINS, 10);

        // ========== GAULE (FRANCE) ==========
        this.fillSmoothPolygon([
            { x: 145, y: 118 },  // Pyrénées
            { x: 160, y: 130 },  // Languedoc
            { x: 195, y: 138 },  // Provence
            { x: 235, y: 132 },  // Côte d'Azur
            { x: 252, y: 118 },  // Alpes françaises
            { x: 268, y: 95 },   // Franche-Comté
            { x: 270, y: 70 },   // Alsace
            { x: 258, y: 52 },   // Belgique
            { x: 235, y: 42 },   // Nord
            { x: 210, y: 38 },   // Picardie
            { x: 188, y: 45 },   // Normandie
            { x: 165, y: 55 },   // Bretagne nord
            { x: 148, y: 68 },   // Bretagne ouest
            { x: 155, y: 85 },   // Loire
            { x: 148, y: 105 },  // Aquitaine
        ], T.GRASSLAND, 12);

        // ========== ÎLES BRITANNIQUES ==========
        // Grande-Bretagne - forme plus allongée
        this.fillSmoothPolygon([
            { x: 165, y: 0 },    // Écosse nord
            { x: 185, y: 0 },    // Écosse est
            { x: 195, y: 12 },   // Northumbrie
            { x: 200, y: 28 },   // Yorkshire
            { x: 198, y: 42 },   // Est Anglie
            { x: 192, y: 55 },   // Kent
            { x: 178, y: 58 },   // Sud
            { x: 162, y: 52 },   // Cornouailles
            { x: 155, y: 38 },   // Pays de Galles
            { x: 158, y: 22 },   // Lancashire
            { x: 165, y: 10 },   // Écosse sud
        ], T.GRASSLAND, 8);

        // Irlande
        this.fillSmoothPolygon([
            { x: 118, y: 8 },    // Nord
            { x: 142, y: 5 },    // Nord-est
            { x: 152, y: 18 },   // Est
            { x: 150, y: 38 },   // Sud-est
            { x: 138, y: 48 },   // Sud
            { x: 120, y: 42 },   // Sud-ouest
            { x: 112, y: 28 },   // Ouest
        ], T.GRASSLAND, 6);

        // ========== ITALIE ==========
        // Nord de l'Italie (Plaine du Pô) - forme d'arc
        this.fillSmoothPolygon([
            { x: 252, y: 118 },  // Nice/frontière
            { x: 268, y: 108 },  // Piémont
            { x: 285, y: 105 },  // Lombardie ouest
            { x: 305, y: 108 },  // Lombardie est
            { x: 322, y: 115 },  // Vénétie
            { x: 335, y: 125 },  // Frioul
            { x: 332, y: 140 },  // Istrie
            { x: 315, y: 145 },  // Émilie-Romagne
            { x: 295, y: 148 },  // Ligurie est
            { x: 272, y: 145 },  // Ligurie ouest
            { x: 258, y: 135 },  // Côte ligure
        ], T.PLAINS, 8);

        // Péninsule italienne (botte) - forme plus réaliste
        this.fillSmoothPolygon([
            { x: 295, y: 148 },  // Émilie
            { x: 305, y: 158 },  // Toscane nord
            { x: 298, y: 172 },  // Toscane sud
            { x: 305, y: 185 },  // Latium nord
            { x: 312, y: 198 },  // Rome/Latium
            { x: 322, y: 215 },  // Campanie
            { x: 335, y: 235 },  // Calabre nord
            { x: 340, y: 252 },  // Calabre pointe
            { x: 332, y: 248 },  // Calabre ouest
            { x: 325, y: 232 },  // Basilicate
            { x: 335, y: 215 },  // Pouilles sud
            { x: 342, y: 195 },  // Pouilles nord
            { x: 335, y: 175 },  // Marches
            { x: 320, y: 158 },  // Ombrie
            { x: 305, y: 152 },  // Jonction
        ], T.HILLS, 6);

        // Sicile - forme triangulaire
        this.fillSmoothPolygon([
            { x: 305, y: 262 },  // Ouest (Trapani)
            { x: 325, y: 255 },  // Nord (Palerme)
            { x: 345, y: 260 },  // Nord-est (Messine)
            { x: 348, y: 272 },  // Est (Catane)
            { x: 335, y: 280 },  // Sud-est (Syracuse)
            { x: 315, y: 278 },  // Sud
            { x: 302, y: 270 },  // Sud-ouest
        ], T.HILLS, 5);

        // Sardaigne
        this.fillSmoothPolygon([
            { x: 262, y: 165 },
            { x: 275, y: 162 },
            { x: 280, y: 178 },
            { x: 278, y: 198 },
            { x: 268, y: 210 },
            { x: 255, y: 205 },
            { x: 252, y: 188 },
            { x: 255, y: 172 },
        ], T.HILLS, 4);

        // Corse
        this.fillSmoothPolygon([
            { x: 265, y: 138 },
            { x: 275, y: 135 },
            { x: 278, y: 148 },
            { x: 275, y: 162 },
            { x: 265, y: 165 },
            { x: 260, y: 152 },
        ], T.HILLS, 3);

        // ========== GERMANIE ET EUROPE CENTRALE ==========
        this.fillSmoothPolygon([
            { x: 258, y: 52 },   // Rhin ouest
            { x: 275, y: 42 },   // Pays-Bas
            { x: 305, y: 32 },   // Frise
            { x: 338, y: 25 },   // Mer du Nord
            { x: 365, y: 18 },   // Jutland
            { x: 385, y: 25 },   // Danemark est
            { x: 400, y: 35 },   // Baltique
            { x: 400, y: 85 },   // Pologne
            { x: 385, y: 95 },   // Silésie
            { x: 365, y: 105 },  // Bohême
            { x: 345, y: 115 },  // Autriche
            { x: 322, y: 115 },  // Bavière
            { x: 295, y: 105 },  // Suisse est
            { x: 275, y: 95 },   // Suisse ouest
            { x: 268, y: 75 },   // Forêt-Noire
        ], T.FOREST, 15);

        // ========== BALKANS ==========
        this.fillSmoothPolygon([
            { x: 332, y: 140 },  // Istrie
            { x: 348, y: 135 },  // Slovénie
            { x: 368, y: 138 },  // Croatie
            { x: 385, y: 148 },  // Bosnie
            { x: 398, y: 162 },  // Serbie
            { x: 400, y: 185 },  // Thrace
            { x: 388, y: 195 },  // Macédoine
            { x: 372, y: 188 },  // Épire nord
            { x: 358, y: 175 },  // Albanie
            { x: 345, y: 162 },  // Monténégro
            { x: 338, y: 150 },  // Dalmatie
        ], T.HILLS, 10);

        // ========== GRÈCE ==========
        // Grèce continentale
        this.fillSmoothPolygon([
            { x: 358, y: 175 },  // Épire
            { x: 372, y: 182 },  // Thessalie
            { x: 385, y: 188 },  // Macédoine sud
            { x: 392, y: 202 },  // Thrace sud
            { x: 388, y: 218 },  // Attique
            { x: 378, y: 225 },  // Béotie
            { x: 365, y: 222 },  // Grèce centrale
            { x: 355, y: 212 },  // Achaïe
            { x: 352, y: 195 },  // Étolie
        ], T.HILLS, 6);

        // Péloponnèse
        this.fillSmoothPolygon([
            { x: 355, y: 222 },  // Corinthe
            { x: 368, y: 228 },  // Argolide
            { x: 375, y: 242 },  // Laconie est
            { x: 365, y: 255 },  // Laconie sud
            { x: 352, y: 252 },  // Messénie
            { x: 345, y: 238 },  // Élide
            { x: 348, y: 225 },  // Arcadie
        ], T.HILLS, 5);

        // Crète
        this.fillSmoothPolygon([
            { x: 362, y: 272 },
            { x: 385, y: 268 },
            { x: 400, y: 272 },
            { x: 398, y: 280 },
            { x: 378, y: 282 },
            { x: 358, y: 278 },
        ], T.HILLS, 3);

        // Îles Baléares
        this.fillSmoothEllipse(155, 172, 12, 6, T.HILLS, 3);  // Majorque
        this.fillSmoothEllipse(172, 165, 6, 4, T.HILLS, 2);   // Minorque
        this.fillSmoothEllipse(142, 178, 5, 4, T.HILLS, 2);   // Ibiza

        // Chypre
        this.fillSmoothEllipse(398, 248, 15, 6, T.HILLS, 3);

        // Îles grecques (Égée)
        this.fillSmoothEllipse(395, 218, 6, 5, T.HILLS, 2);   // Rhodes
        this.fillSmoothEllipse(388, 232, 5, 4, T.HILLS, 2);   // Karpathos
        this.fillSmoothEllipse(378, 238, 4, 3, T.HILLS, 2);   // Cyclades

        // ========== ASIE MINEURE (Anatolie) ==========
        this.fillSmoothPolygon([
            { x: 400, y: 135 },  // Pont (Mer Noire)
            { x: 398, y: 155 },  // Bithynie
            { x: 392, y: 175 },  // Mysie
            { x: 388, y: 195 },  // Lydie/Ionie
            { x: 392, y: 218 },  // Carie
            { x: 400, y: 235 },  // Lycie
            { x: 400, y: 265 },  // Cilicie
            { x: 385, y: 258 },  // Pamphylie
            { x: 375, y: 242 },  // Pisidie
            { x: 378, y: 225 },  // Phrygie sud
            { x: 382, y: 205 },  // Phrygie
            { x: 388, y: 185 },  // Galatie
            { x: 395, y: 165 },  // Paphlagonie
            { x: 398, y: 145 },  // Pont ouest
        ], T.HILLS, 8);

        // ========== AFRIQUE DU NORD ==========
        // Côte nord-africaine (Maghreb + Égypte)
        this.fillSmoothPolygon([
            { x: 0, y: 210 },    // Maroc ouest
            { x: 25, y: 198 },   // Maroc nord
            { x: 55, y: 205 },   // Maurétanie
            { x: 95, y: 212 },   // Numidie ouest
            { x: 145, y: 218 },  // Numidie
            { x: 195, y: 222 },  // Africa
            { x: 245, y: 228 },  // Tunisie
            { x: 285, y: 238 },  // Tripolitaine
            { x: 335, y: 265 },  // Cyrénaïque
            { x: 385, y: 278 },  // Égypte ouest
            { x: 400, y: 280 },  // Égypte
            { x: 400, y: 300 },
            { x: 0, y: 300 },
        ], T.SAND_COAST, 12);

        // ========== EUROPE DE L'EST (Scythie/Sarmates) ==========
        this.fillSmoothPolygon([
            { x: 400, y: 85 },   // Pologne est
            { x: 400, y: 135 },  // Ukraine
            { x: 398, y: 155 },  // Mer Noire nord
            { x: 392, y: 145 },  // Thrace nord
            { x: 385, y: 125 },  // Dacie
            { x: 378, y: 108 },  // Carpates
            { x: 385, y: 92 },   // Galicie
        ], T.PLAINS, 12);

        // ========== SCANDINAVIE (partielle) ==========
        this.fillSmoothPolygon([
            { x: 285, y: 0 },    // Norvège sud
            { x: 320, y: 0 },    // Suède sud
            { x: 355, y: 0 },    // Suède est
            { x: 378, y: 8 },    // Gotland
            { x: 385, y: 22 },   // Danemark est
            { x: 368, y: 18 },   // Danemark
            { x: 345, y: 12 },   // Kattegat
            { x: 315, y: 8 },    // Skagerrak
            { x: 295, y: 5 },    // Norvège
        ], T.FOREST, 8);
    }

    /**
     * Remplit un polygone avec des bords bruités
     */
    fillSmoothPolygon(points, terrainId, noiseAmount = 5) {
        // Trouver les limites
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const p of points) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }

        // Élargir pour le bruit
        minX = Math.max(0, minX - noiseAmount);
        maxX = Math.min(this.width - 1, maxX + noiseAmount);
        minY = Math.max(0, minY - noiseAmount);
        maxY = Math.min(this.height - 1, maxY + noiseAmount);

        // Pour chaque pixel, vérifier s'il est dans le polygone bruité
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                // Distance au polygone + bruit
                const dist = this.pointToPolygonDistance(x, y, points);
                const noise = (this.fractalNoise(x, y, 3) - 0.5) * noiseAmount * 2;

                if (dist + noise < noiseAmount * 0.5) {
                    this.map.setTerrain(x, y, terrainId);
                }
            }
        }
    }

    /**
     * Remplit une ellipse avec des bords bruités
     */
    fillSmoothEllipse(centerX, centerY, radiusX, radiusY, terrainId, noiseAmount = 3) {
        for (let y = centerY - radiusY - noiseAmount; y <= centerY + radiusY + noiseAmount; y++) {
            for (let x = centerX - radiusX - noiseAmount; x <= centerX + radiusX + noiseAmount; x++) {
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

                const dx = (x - centerX) / radiusX;
                const dy = (y - centerY) / radiusY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const noise = (this.fractalNoise(x, y, 2) - 0.5) * 0.3;

                if (dist + noise < 1) {
                    this.map.setTerrain(x, y, terrainId);
                }
            }
        }
    }

    /**
     * Calcule la distance d'un point au bord d'un polygone
     */
    pointToPolygonDistance(px, py, points) {
        let inside = false;
        let minDist = Infinity;

        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;

            // Test ray casting pour inside/outside
            if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
                inside = !inside;
            }

            // Distance au segment
            const dx = xj - xi;
            const dy = yj - yi;
            const t = Math.max(0, Math.min(1, ((px - xi) * dx + (py - yi) * dy) / (dx * dx + dy * dy)));
            const nearX = xi + t * dx;
            const nearY = yi + t * dy;
            const dist = Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
            minDist = Math.min(minDist, dist);
        }

        return inside ? -minDist : minDist;
    }

    /**
     * Génère les eaux côtières autour des terres
     */
    generateCoastalWaters() {
        const T = MAP_CONFIG.TERRAIN_IDS;
        const coastWidth = 3;

        // Première passe: marquer les côtes
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.map.getTerrainId(x, y) === T.DEEP_WATER) {
                    let nearLand = false;
                    for (let dy = -coastWidth; dy <= coastWidth && !nearLand; dy++) {
                        for (let dx = -coastWidth; dx <= coastWidth && !nearLand; dx++) {
                            const terrain = this.map.getTerrainId(x + dx, y + dy);
                            if (terrain !== T.DEEP_WATER && terrain !== T.SHALLOW_WATER) {
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                if (dist <= coastWidth) {
                                    nearLand = true;
                                }
                            }
                        }
                    }
                    if (nearLand) {
                        this.map.setTerrain(x, y, T.SHALLOW_WATER);
                    }
                }
            }
        }
    }

    /**
     * Génère les chaînes de montagnes
     */
    generateMountains() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        // Pyrénées (ajusté aux nouvelles coordonnées)
        this.drawMountainRange(130, 105, 148, 125, 8, T.MOUNTAINS);
        this.drawMountainRange(135, 110, 145, 120, 4, T.IMPASSABLE_MOUNTAINS);

        // Alpes (arc alpin complet)
        this.drawMountainRange(252, 115, 275, 100, 8, T.MOUNTAINS);  // Alpes françaises
        this.drawMountainRange(275, 100, 310, 105, 10, T.MOUNTAINS); // Alpes suisses
        this.drawMountainRange(310, 105, 335, 125, 8, T.MOUNTAINS);  // Alpes autrichiennes
        this.drawMountainRange(268, 105, 305, 108, 5, T.IMPASSABLE_MOUNTAINS); // Hauts sommets

        // Apennins (colonne vertébrale de l'Italie)
        this.drawMountainRange(295, 148, 305, 170, 5, T.MOUNTAINS);
        this.drawMountainRange(305, 170, 320, 200, 5, T.MOUNTAINS);
        this.drawMountainRange(320, 200, 335, 235, 4, T.MOUNTAINS);

        // Balkans (Alpes dinariques)
        this.drawMountainRange(335, 140, 365, 165, 7, T.MOUNTAINS);
        this.drawMountainRange(365, 165, 388, 185, 6, T.MOUNTAINS);

        // Carpates
        this.drawMountainRange(365, 105, 385, 125, 8, T.MOUNTAINS);
        this.drawMountainRange(378, 108, 392, 135, 6, T.MOUNTAINS);

        // Atlas (Afrique du Nord) - plus longue chaîne
        this.drawMountainRange(25, 205, 95, 218, 8, T.MOUNTAINS);
        this.drawMountainRange(95, 218, 180, 225, 10, T.MOUNTAINS);
        this.drawMountainRange(45, 210, 150, 222, 4, T.IMPASSABLE_MOUNTAINS);

        // Montagnes d'Écosse (Highlands)
        this.drawMountainRange(165, 5, 185, 18, 5, T.HILLS);

        // Massif Central (France)
        this.drawMountainRange(175, 85, 200, 110, 8, T.HILLS);
        this.drawMountainRange(185, 90, 195, 105, 4, T.MOUNTAINS);

        // Meseta espagnole (plateau central)
        this.fillNoiseRegion(40, 120, 70, 55, T.HILLS, 0.4);

        // Sierra Nevada (sud Espagne)
        this.drawMountainRange(55, 180, 95, 185, 5, T.MOUNTAINS);

        // Montagnes de Grèce (Pinde)
        this.drawMountainRange(355, 185, 368, 210, 5, T.MOUNTAINS);

        // Montagnes d'Anatolie (Taurus)
        this.drawMountainRange(380, 230, 398, 255, 6, T.MOUNTAINS);
    }

    /**
     * Dessine une chaîne de montagnes avec du bruit
     */
    drawMountainRange(x1, y1, x2, y2, width, terrainId) {
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const baseX = x1 + (x2 - x1) * t;
            const baseY = y1 + (y2 - y1) * t;

            // Ajouter du bruit à la position
            const noiseX = (this.smoothNoise(i * 0.5, 0, 10) - 0.5) * width * 0.5;
            const noiseY = (this.smoothNoise(0, i * 0.5, 10) - 0.5) * width * 0.5;

            const x = Math.round(baseX + noiseX);
            const y = Math.round(baseY + noiseY);

            // Largeur variable
            const localWidth = width * (0.7 + this.smoothNoise(i, 0, 5) * 0.6);

            for (let dy = -localWidth; dy <= localWidth; dy++) {
                for (let dx = -localWidth; dx <= localWidth; dx++) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= localWidth) {
                        const nx = x + dx;
                        const ny = y + dy;
                        const currentTerrain = this.map.getTerrainId(nx, ny);
                        // Ne pas écraser l'eau
                        if (currentTerrain !== MAP_CONFIG.TERRAIN_IDS.DEEP_WATER &&
                            currentTerrain !== MAP_CONFIG.TERRAIN_IDS.SHALLOW_WATER) {
                            this.map.setTerrain(nx, ny, terrainId);
                        }
                    }
                }
            }
        }
    }

    /**
     * Génère les collines autour des montagnes
     */
    generateHills() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrain = this.map.getTerrainId(x, y);
                if (terrain === T.MOUNTAINS || terrain === T.IMPASSABLE_MOUNTAINS) {
                    // Ajouter des collines autour
                    for (const dir of MAP_CONFIG.DIRECTIONS) {
                        for (let d = 1; d <= 2; d++) {
                            const nx = x + dir.dx * d;
                            const ny = y + dir.dy * d;
                            const neighborTerrain = this.map.getTerrainId(nx, ny);
                            if ((neighborTerrain === T.PLAINS || neighborTerrain === T.GRASSLAND) &&
                                Math.random() < 0.5) {
                                this.map.setTerrain(nx, ny, T.HILLS);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Génère les forêts
     */
    generateForests() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        // Forêts denses de Germanie (Hercynienne)
        this.fillNoiseRegion(285, 45, 80, 50, T.DENSE_FOREST, 0.4);
        this.fillNoiseRegion(335, 55, 50, 40, T.FOREST, 0.45);
        this.fillNoiseRegion(365, 75, 35, 30, T.DENSE_FOREST, 0.35);

        // Forêts des Ardennes
        this.fillNoiseRegion(255, 55, 30, 25, T.FOREST, 0.5);

        // Forêts gauloises
        this.fillNoiseRegion(165, 60, 45, 35, T.FOREST, 0.35);
        this.fillNoiseRegion(195, 85, 40, 30, T.FOREST, 0.3);
        this.fillNoiseRegion(150, 75, 25, 20, T.FOREST, 0.4); // Bretagne intérieure

        // Forêts d'Irlande
        this.fillNoiseRegion(120, 15, 30, 30, T.FOREST, 0.4);

        // Forêts de Britannie
        this.fillNoiseRegion(165, 20, 30, 35, T.FOREST, 0.35);

        // Forêts des Balkans
        this.fillNoiseRegion(350, 145, 35, 30, T.FOREST, 0.35);
        this.fillNoiseRegion(375, 155, 25, 25, T.FOREST, 0.3);

        // Forêts de Scandinavie
        this.fillNoiseRegion(295, 0, 80, 20, T.DENSE_FOREST, 0.5);

        // Forêts d'Ibérie (nord)
        this.fillNoiseRegion(25, 95, 60, 25, T.FOREST, 0.3);

        // Forêts d'Europe de l'Est
        this.fillNoiseRegion(385, 85, 15, 40, T.FOREST, 0.4);
    }

    /**
     * Génère les zones désertiques
     */
    generateDeserts() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        // Sahara (intérieur) - ajusté aux nouvelles coordonnées
        this.fillNoiseRegion(0, 245, 400, 55, T.DESERT, 0.9);

        // Zones arides intermédiaires
        this.fillNoiseRegion(100, 235, 200, 30, T.DESERT, 0.8);
        this.fillNoiseRegion(300, 275, 100, 25, T.DESERT, 0.85);

        // Désert de Syrie/Arabie (bord est)
        this.fillNoiseRegion(395, 250, 5, 50, T.DESERT, 0.95);
    }

    /**
     * Génère les marécages
     */
    generateMarshes() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        // Marais Pontins (près de Rome)
        this.fillNoiseRegion(310, 195, 12, 10, T.MARSH, 0.4);

        // Delta du Pô
        this.fillNoiseRegion(325, 135, 12, 10, T.MARSH, 0.5);

        // Delta du Nil (Égypte)
        this.fillNoiseRegion(395, 275, 5, 15, T.MARSH, 0.6);

        // Marais de Gaule (Bretagne)
        this.fillNoiseRegion(150, 55, 15, 12, T.MARSH, 0.35);

        // Embouchures du Rhin
        this.fillNoiseRegion(275, 42, 12, 10, T.MARSH, 0.45);

        // Marais britanniques
        this.fillNoiseRegion(190, 45, 10, 12, T.MARSH, 0.4);
    }

    /**
     * Génère les rivières principales
     */
    generateRivers() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        // Tibre (Rome)
        this.drawRiver(305, 158, 315, 198, 2);

        // Pô (traversée de la plaine du Pô)
        this.drawRiver(268, 115, 330, 138, 3);

        // Rhône
        this.drawRiver(235, 75, 225, 135, 2);

        // Rhin
        this.drawRiver(268, 75, 280, 42, 2);

        // Danube (du centre vers l'est)
        this.drawRiver(310, 108, 398, 155, 3);

        // Loire
        this.drawRiver(150, 68, 175, 95, 1);

        // Seine
        this.drawRiver(195, 45, 218, 75, 1);

        // Ebre
        this.drawRiver(75, 95, 140, 150, 2);

        // Garonne
        this.drawRiver(145, 115, 165, 90, 1);

        // Nil (delta)
        this.drawRiver(398, 265, 398, 285, 2);
    }

    /**
     * Dessine une rivière avec méandres
     */
    drawRiver(x1, y1, x2, y2, width) {
        const T = MAP_CONFIG.TERRAIN_IDS;
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;

        let x = x1;
        let y = y1;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const targetX = x1 + (x2 - x1) * t;
            const targetY = y1 + (y2 - y1) * t;

            // Méandres
            const meander = Math.sin(i * 0.3) * 3;
            const perpX = -(y2 - y1) / steps;
            const perpY = (x2 - x1) / steps;

            x += (targetX - x) * 0.25 + perpX * meander * 0.1;
            y += (targetY - y) * 0.25 + perpY * meander * 0.1;

            const rx = Math.round(x);
            const ry = Math.round(y);

            // Ne pas dessiner sur l'eau de mer
            if (!this.map.isWater(rx, ry)) {
                for (let dy = -width; dy <= width; dy++) {
                    for (let dx = -width; dx <= width; dx++) {
                        if (Math.abs(dx) + Math.abs(dy) <= width) {
                            const nx = rx + dx;
                            const ny = ry + dy;
                            if (!this.map.isWater(nx, ny)) {
                                this.map.setTerrain(nx, ny, T.RIVER);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Définit les zones climatiques
     */
    generateClimateZones() {
        const C = MAP_CONFIG.CLIMATE_IDS;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrain = this.map.getTerrain(x, y);
                let climate = C.TEMPERATE;

                // Zone méditerranéenne (sud de l'Europe, côtes)
                // Italie, Grèce, sud de la Gaule, Ibérie côtière
                if ((y > 130 && y < 230 && x > 235 && x < 400) ||  // Méditerranée orientale
                    (y > 120 && y < 200 && x > 145 && x < 235) ||  // Provence, Languedoc
                    (y > 150 && y < 200 && x < 150)) {              // Ibérie côtière
                    climate = 5; // Méditerranéen
                }

                // Zone maritime (Britannie, Irlande, côtes atlantiques)
                if ((x < 210 && y < 65) ||                         // Îles britanniques
                    (x < 165 && y < 90)) {                         // Bretagne, côte atlantique
                    climate = C.MARITIME;
                }

                // Zone aride (Afrique du Nord)
                if (y > 210) {
                    climate = C.ARID;
                }

                // Zone alpine (montagnes)
                if (terrain.id === MAP_CONFIG.TERRAIN_IDS.MOUNTAINS ||
                    terrain.id === MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS) {
                    climate = C.ALPINE;
                }

                this.map.setClimate(x, y, climate);
            }
        }
    }

    /**
     * Ajoute de la variation au terrain
     */
    addTerrainVariation() {
        const T = MAP_CONFIG.TERRAIN_IDS;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrain = this.map.getTerrainId(x, y);

                // Convertir certaines plaines en prairies avec du bruit
                if (terrain === T.PLAINS && this.fractalNoise(x, y, 2) > 0.55) {
                    this.map.setTerrain(x, y, T.GRASSLAND);
                }

                // Terres agricoles près des rivières
                if ((terrain === T.PLAINS || terrain === T.GRASSLAND)) {
                    let nearRiver = false;
                    for (const dir of MAP_CONFIG.DIRECTIONS) {
                        if (this.map.getTerrainId(x + dir.dx, y + dir.dy) === T.RIVER) {
                            nearRiver = true;
                            break;
                        }
                    }
                    if (nearRiver && Math.random() < 0.4) {
                        this.map.setTerrain(x, y, T.FARMLAND);
                    }
                }

                // Élévation
                let elevation = 50;
                switch (terrain) {
                    case T.DEEP_WATER: elevation = 0; break;
                    case T.SHALLOW_WATER: elevation = 20; break;
                    case T.HILLS: elevation = 100 + this.noise(x, y) * 50; break;
                    case T.MOUNTAINS: elevation = 180 + this.noise(x, y) * 50; break;
                    case T.IMPASSABLE_MOUNTAINS: elevation = 240 + this.noise(x, y) * 15; break;
                    default: elevation = 50 + this.noise(x, y) * 30;
                }
                this.map.setElevation(x, y, Math.floor(elevation));
            }
        }
    }

    /**
     * Remplit une région avec du bruit
     */
    fillNoiseRegion(x, y, width, height, terrainId, density) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

                const noiseVal = this.fractalNoise(nx, ny, 2);
                if (noiseVal < density) {
                    const current = this.map.getTerrainId(nx, ny);
                    if (current !== MAP_CONFIG.TERRAIN_IDS.DEEP_WATER &&
                        current !== MAP_CONFIG.TERRAIN_IDS.SHALLOW_WATER &&
                        current !== MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS) {
                        this.map.setTerrain(nx, ny, terrainId);
                    }
                }
            }
        }
    }
}

/**
 * Fonction utilitaire pour générer une carte
 */
function generateEuropeMap(terrainMap) {
    const generator = new MapGenerator();
    generator.map = terrainMap;
    generator.width = terrainMap.width;
    generator.height = terrainMap.height;

    // Remplir avec de l'eau profonde
    generator.map.clear(MAP_CONFIG.TERRAIN_IDS.DEEP_WATER);

    // Générer les éléments
    generator.generateLandmasses();
    generator.generateCoastalWaters();
    generator.generateMountains();
    generator.generateHills();
    generator.generateForests();
    generator.generateDeserts();
    generator.generateMarshes();
    generator.generateRivers();
    generator.generateClimateZones();
    generator.addTerrainVariation();

    return terrainMap;
}

export { MapGenerator, generateEuropeMap };
