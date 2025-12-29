/**
 * Script pour générer l'image de la carte d'Europe
 * Basé fidèlement sur la carte de Rome Total War
 *
 * Usage: node generate-map-image.js
 * Génère: ../assets/maps/europe.png (400x300 pixels)
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Dimensions de la carte
const WIDTH = 400;
const HEIGHT = 300;

// Palette de couleurs (terrain -> hex)
const COLORS = {
    DEEP_WATER: '#0a2d4a',
    SHALLOW_WATER: '#1a4d6e',
    PLAINS: '#7cb342',
    GRASSLAND: '#8bc34a',
    FOREST: '#2e5c2e',
    DENSE_FOREST: '#1b4332',
    HILLS: '#8d6e63',
    MOUNTAINS: '#5d4037',
    IMPASSABLE_MOUNTAINS: '#3e2723',
    DESERT: '#e6c47f',
    SAND_COAST: '#d4b896',
    MARSH: '#4a6741',
    FARMLAND: '#c5a03f',
    ROAD: '#a1887f',
    RIVER: '#42a5f5'
};

// Créer le canvas
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// Remplir avec l'eau profonde par défaut
ctx.fillStyle = COLORS.DEEP_WATER;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

/**
 * Dessine un polygone rempli
 */
function fillPolygon(points, color) {
    if (points.length < 3) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * Dessine une ellipse remplie
 */
function fillEllipse(cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Dessine une ligne épaisse courbe
 */
function drawCurvedLine(points, width, color) {
    if (points.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
}

/**
 * Remplit une zone rectangulaire avec du bruit
 */
function fillNoiseRegion(x, y, w, h, color, density) {
    ctx.fillStyle = color;
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            if (Math.random() < density) {
                ctx.fillRect(x + dx, y + dy, 1, 1);
            }
        }
    }
}

/**
 * Remplit une zone circulaire avec du bruit
 */
function fillNoiseCircle(cx, cy, radius, color, density) {
    ctx.fillStyle = color;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx*dx + dy*dy <= radius*radius && Math.random() < density) {
                ctx.fillRect(cx + dx, cy + dy, 1, 1);
            }
        }
    }
}

// ==========================================
// GÉNÉRATION DE LA CARTE - FIDÈLE À ROME TW
// ==========================================

console.log('Génération de la carte (fidèle à Rome Total War)...');

// La carte RTW montre:
// - Hispanie à gauche (environ 0-15% de la largeur)
// - Gaule/Germanie au centre-nord
// - Italie au centre
// - Balkans/Grèce à droite du centre
// - Asie Mineure à l'extrême droite
// - Afrique du Nord en bas

// ========== HISPANIE (ESPAGNE/PORTUGAL) ==========
// Position: extrême gauche de la carte
fillPolygon([
    { x: 0, y: 95 },      // Nord-ouest (Galice)
    { x: 15, y: 82 },     // Côte cantabrique
    { x: 40, y: 78 },     // Asturies
    { x: 65, y: 80 },     // Pays Basque
    { x: 85, y: 88 },     // Navarre
    { x: 95, y: 100 },    // Pyrénées ouest
    { x: 105, y: 110 },   // Pyrénées centre
    { x: 110, y: 125 },   // Catalogne
    { x: 105, y: 145 },   // Valence nord
    { x: 95, y: 165 },    // Valence sud
    { x: 80, y: 180 },    // Murcie
    { x: 55, y: 188 },    // Almeria
    { x: 30, y: 185 },    // Malaga/Gibraltar
    { x: 15, y: 175 },    // Cadix
    { x: 5, y: 160 },     // Algarve
    { x: 0, y: 140 },     // Portugal sud
    { x: 0, y: 115 },     // Portugal centre
], COLORS.GRASSLAND);

// Plateau central (Meseta)
fillPolygon([
    { x: 20, y: 100 },
    { x: 70, y: 95 },
    { x: 85, y: 115 },
    { x: 80, y: 155 },
    { x: 55, y: 170 },
    { x: 25, y: 165 },
    { x: 12, y: 140 },
    { x: 12, y: 115 },
], COLORS.HILLS);

// ========== GAULE (FRANCE) ==========
fillPolygon([
    { x: 105, y: 110 },   // Pyrénées
    { x: 120, y: 120 },   // Languedoc
    { x: 145, y: 125 },   // Provence ouest
    { x: 175, y: 122 },   // Provence est
    { x: 195, y: 112 },   // Alpes françaises
    { x: 210, y: 95 },    // Jura
    { x: 220, y: 75 },    // Alsace
    { x: 215, y: 55 },    // Belgique
    { x: 195, y: 42 },    // Nord
    { x: 170, y: 38 },    // Picardie
    { x: 145, y: 42 },    // Normandie
    { x: 120, y: 50 },    // Bretagne nord
    { x: 100, y: 58 },    // Bretagne ouest
    { x: 95, y: 72 },     // Bretagne sud
    { x: 100, y: 88 },    // Vendée
    { x: 95, y: 102 },    // Aquitaine
], COLORS.GRASSLAND);

// ========== ÎLES BRITANNIQUES ==========
// Grande-Bretagne
fillPolygon([
    { x: 135, y: 0 },     // Écosse nord-ouest
    { x: 155, y: 0 },     // Écosse nord-est
    { x: 162, y: 12 },    // Northumbrie
    { x: 168, y: 28 },    // Yorkshire
    { x: 170, y: 42 },    // Est-Anglie
    { x: 165, y: 52 },    // Kent
    { x: 150, y: 55 },    // Sussex
    { x: 138, y: 50 },    // Hampshire
    { x: 125, y: 42 },    // Cornouailles
    { x: 122, y: 28 },    // Pays de Galles
    { x: 128, y: 15 },    // Lancashire
    { x: 138, y: 8 },     // Écosse sud
], COLORS.GRASSLAND);

// Irlande
fillPolygon([
    { x: 85, y: 8 },
    { x: 108, y: 5 },
    { x: 118, y: 18 },
    { x: 115, y: 38 },
    { x: 102, y: 48 },
    { x: 85, y: 42 },
    { x: 78, y: 28 },
    { x: 80, y: 12 },
], COLORS.GRASSLAND);

// ========== ITALIE ==========
// Plaine du Pô (Nord)
fillPolygon([
    { x: 195, y: 112 },   // Alpes françaises
    { x: 215, y: 105 },   // Piémont
    { x: 238, y: 100 },   // Lombardie
    { x: 262, y: 105 },   // Vénétie
    { x: 280, y: 115 },   // Frioul
    { x: 285, y: 130 },   // Istrie
    { x: 270, y: 138 },   // Émilie est
    { x: 248, y: 142 },   // Émilie ouest
    { x: 225, y: 138 },   // Ligurie est
    { x: 205, y: 128 },   // Ligurie ouest
], COLORS.PLAINS);

// Péninsule italienne (la botte)
fillPolygon([
    { x: 248, y: 142 },   // Émilie
    { x: 258, y: 155 },   // Toscane nord
    { x: 252, y: 172 },   // Toscane sud
    { x: 260, y: 190 },   // Latium
    { x: 272, y: 210 },   // Campanie
    { x: 285, y: 235 },   // Calabre nord
    { x: 295, y: 260 },   // Calabre sud (pointe)
    { x: 288, y: 255 },   // Calabre ouest
    { x: 280, y: 238 },   // Basilicate
    { x: 290, y: 218 },   // Pouilles sud
    { x: 302, y: 195 },   // Pouilles nord
    { x: 295, y: 172 },   // Marches
    { x: 280, y: 155 },   // Ombrie
    { x: 265, y: 148 },   // Jonction
], COLORS.HILLS);

// Talon de la botte (Pouilles)
fillPolygon([
    { x: 295, y: 190 },
    { x: 312, y: 195 },
    { x: 320, y: 210 },
    { x: 312, y: 222 },
    { x: 298, y: 218 },
    { x: 292, y: 205 },
], COLORS.PLAINS);

// Sicile
fillPolygon([
    { x: 260, y: 268 },   // Ouest (Trapani)
    { x: 280, y: 262 },   // Nord (Palerme)
    { x: 302, y: 268 },   // Est (Messine)
    { x: 308, y: 282 },   // Sud-est (Syracuse)
    { x: 290, y: 290 },   // Sud
    { x: 265, y: 285 },   // Sud-ouest
    { x: 255, y: 275 },   // Ouest
], COLORS.HILLS);

// Sardaigne
fillPolygon([
    { x: 210, y: 162 },
    { x: 225, y: 158 },
    { x: 232, y: 175 },
    { x: 228, y: 198 },
    { x: 218, y: 212 },
    { x: 205, y: 205 },
    { x: 200, y: 185 },
    { x: 205, y: 168 },
], COLORS.HILLS);

// Corse
fillPolygon([
    { x: 215, y: 132 },
    { x: 228, y: 128 },
    { x: 235, y: 142 },
    { x: 230, y: 160 },
    { x: 218, y: 165 },
    { x: 212, y: 150 },
], COLORS.HILLS);

// ========== GERMANIE ==========
fillPolygon([
    { x: 215, y: 55 },    // Belgique
    { x: 235, y: 45 },    // Pays-Bas
    { x: 265, y: 35 },    // Frise
    { x: 295, y: 28 },    // Saxe nord
    { x: 325, y: 22 },    // Poméranie
    { x: 355, y: 28 },    // Prusse
    { x: 380, y: 40 },    // Pologne nord
    { x: 400, y: 55 },    // Baltique est
    { x: 400, y: 95 },    // Pologne
    { x: 375, y: 105 },   // Silésie
    { x: 345, y: 112 },   // Bohême
    { x: 315, y: 115 },   // Autriche nord
    { x: 285, y: 110 },   // Bavière
    { x: 255, y: 100 },   // Suisse
    { x: 230, y: 90 },    // Forêt-Noire
    { x: 220, y: 72 },    // Rhénanie
], COLORS.FOREST);

// ========== BALKANS ==========
fillPolygon([
    { x: 285, y: 130 },   // Istrie
    { x: 305, y: 125 },   // Slovénie
    { x: 328, y: 128 },   // Croatie
    { x: 350, y: 135 },   // Bosnie
    { x: 372, y: 145 },   // Serbie
    { x: 390, y: 160 },   // Thrace nord
    { x: 400, y: 178 },   // Thrace est
    { x: 395, y: 195 },   // Thrace sud
    { x: 378, y: 188 },   // Macédoine est
    { x: 358, y: 178 },   // Macédoine
    { x: 340, y: 165 },   // Épire nord
    { x: 320, y: 152 },   // Albanie
    { x: 298, y: 142 },   // Dalmatie
], COLORS.HILLS);

// ========== GRÈCE ==========
// Grèce continentale
fillPolygon([
    { x: 340, y: 165 },   // Épire
    { x: 358, y: 175 },   // Thessalie
    { x: 378, y: 185 },   // Macédoine sud
    { x: 388, y: 200 },   // Attique nord
    { x: 382, y: 218 },   // Attique
    { x: 368, y: 225 },   // Béotie
    { x: 352, y: 220 },   // Grèce centrale
    { x: 338, y: 205 },   // Acarnanie
    { x: 332, y: 188 },   // Étolie
    { x: 335, y: 172 },   // Épire sud
], COLORS.HILLS);

// Péloponnèse
fillPolygon([
    { x: 345, y: 228 },   // Corinthe
    { x: 362, y: 235 },   // Argolide
    { x: 368, y: 252 },   // Laconie est
    { x: 358, y: 268 },   // Laconie sud
    { x: 342, y: 265 },   // Messénie
    { x: 332, y: 248 },   // Élide
    { x: 335, y: 232 },   // Arcadie
], COLORS.HILLS);

// Crète
fillPolygon([
    { x: 355, y: 285 },
    { x: 385, y: 280 },
    { x: 400, y: 285 },
    { x: 398, y: 295 },
    { x: 370, y: 298 },
    { x: 350, y: 292 },
], COLORS.HILLS);

// ========== ASIE MINEURE (ANATOLIE) ==========
fillPolygon([
    { x: 400, y: 130 },   // Pont (Mer Noire)
    { x: 395, y: 150 },   // Bithynie
    { x: 388, y: 172 },   // Mysie
    { x: 385, y: 195 },   // Lydie
    { x: 390, y: 218 },   // Carie
    { x: 400, y: 240 },   // Lycie
    { x: 400, y: 275 },   // Cilicie
    { x: 385, y: 268 },   // Pamphylie
    { x: 372, y: 252 },   // Pisidie
    { x: 375, y: 235 },   // Phrygie sud
    { x: 380, y: 215 },   // Phrygie
    { x: 385, y: 192 },   // Galatie
    { x: 392, y: 168 },   // Paphlagonie
    { x: 398, y: 145 },   // Pont ouest
], COLORS.HILLS);

// ========== AFRIQUE DU NORD ==========
// Côte fertile (Maghreb)
fillPolygon([
    { x: 0, y: 200 },     // Maroc ouest
    { x: 20, y: 192 },    // Maroc nord
    { x: 55, y: 198 },    // Maurétanie
    { x: 100, y: 208 },   // Numidie ouest
    { x: 150, y: 218 },   // Numidie
    { x: 195, y: 228 },   // Africa (Tunisie)
    { x: 240, y: 242 },   // Tripolitaine
    { x: 300, y: 265 },   // Cyrénaïque
    { x: 360, y: 285 },   // Marmarique
    { x: 400, y: 295 },   // Égypte
    { x: 400, y: 300 },
    { x: 0, y: 300 },
], COLORS.SAND_COAST);

// ========== EUROPE DE L'EST ==========
fillPolygon([
    { x: 400, y: 95 },    // Pologne est
    { x: 400, y: 130 },   // Ukraine
    { x: 395, y: 148 },   // Crimée
    { x: 385, y: 138 },   // Scythie sud
    { x: 372, y: 125 },   // Dacie
    { x: 365, y: 110 },   // Carpates
    { x: 378, y: 98 },    // Galicie
], COLORS.PLAINS);

// ========== SCANDINAVIE ==========
// Danemark
fillPolygon([
    { x: 248, y: 15 },
    { x: 268, y: 12 },
    { x: 280, y: 25 },
    { x: 272, y: 38 },
    { x: 255, y: 35 },
    { x: 245, y: 25 },
], COLORS.GRASSLAND);

// Suède/Norvège sud
fillPolygon([
    { x: 265, y: 0 },
    { x: 300, y: 0 },
    { x: 335, y: 0 },
    { x: 365, y: 5 },
    { x: 385, y: 15 },
    { x: 380, y: 32 },
    { x: 358, y: 25 },
    { x: 328, y: 18 },
    { x: 295, y: 10 },
    { x: 270, y: 5 },
], COLORS.FOREST);

// ========== ÎLES ==========
// Baléares
fillEllipse(130, 165, 10, 4, COLORS.HILLS);  // Majorque
fillEllipse(142, 160, 5, 3, COLORS.HILLS);   // Minorque
fillEllipse(118, 170, 4, 3, COLORS.HILLS);   // Ibiza

// Chypre
fillEllipse(398, 252, 10, 4, COLORS.HILLS);

// Îles grecques
fillEllipse(392, 210, 4, 3, COLORS.HILLS);   // Lesbos
fillEllipse(395, 225, 4, 3, COLORS.HILLS);   // Chios
fillEllipse(388, 240, 3, 3, COLORS.HILLS);   // Samos
fillEllipse(378, 268, 5, 4, COLORS.HILLS);   // Rhodes
fillEllipse(365, 255, 3, 3, COLORS.HILLS);   // Cyclades

// Malte
fillEllipse(272, 292, 3, 2, COLORS.HILLS);

// ========== GÉNÉRER LES EAUX CÔTIÈRES ==========
console.log('Génération des eaux côtières...');

const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
const data = imageData.data;

function isLand(x, y) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false;
    const i = (y * WIDTH + x) * 4;
    const r = data[i], g = data[i+1], b = data[i+2];
    return !(r === 10 && g === 45 && b === 74);
}

function isDeepWater(x, y) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return true;
    const i = (y * WIDTH + x) * 4;
    const r = data[i], g = data[i+1], b = data[i+2];
    return (r === 10 && g === 45 && b === 74);
}

const shallowWaterPixels = [];
for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        if (isDeepWater(x, y)) {
            let nearLand = false;
            for (let dy = -3; dy <= 3 && !nearLand; dy++) {
                for (let dx = -3; dx <= 3 && !nearLand; dx++) {
                    if (isLand(x + dx, y + dy)) {
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist <= 3) nearLand = true;
                    }
                }
            }
            if (nearLand) {
                shallowWaterPixels.push({x, y});
            }
        }
    }
}

ctx.fillStyle = COLORS.SHALLOW_WATER;
for (const p of shallowWaterPixels) {
    ctx.fillRect(p.x, p.y, 1, 1);
}

// ========== MONTAGNES ==========
console.log('Ajout des montagnes...');

// Pyrénées
drawCurvedLine([
    {x: 85, y: 90}, {x: 95, y: 100}, {x: 105, y: 112}
], 7, COLORS.MOUNTAINS);
drawCurvedLine([
    {x: 90, y: 95}, {x: 100, y: 105}
], 3, COLORS.IMPASSABLE_MOUNTAINS);

// Alpes
drawCurvedLine([
    {x: 195, y: 115}, {x: 215, y: 102}, {x: 240, y: 98}, {x: 265, y: 102}, {x: 285, y: 115}
], 10, COLORS.MOUNTAINS);
drawCurvedLine([
    {x: 210, y: 105}, {x: 235, y: 100}, {x: 260, y: 105}
], 5, COLORS.IMPASSABLE_MOUNTAINS);

// Apennins
drawCurvedLine([
    {x: 250, y: 148}, {x: 255, y: 165}, {x: 260, y: 185}, {x: 270, y: 210}, {x: 285, y: 240}, {x: 292, y: 258}
], 5, COLORS.MOUNTAINS);

// Alpes Dinariques
drawCurvedLine([
    {x: 295, y: 135}, {x: 320, y: 145}, {x: 345, y: 158}, {x: 365, y: 175}
], 6, COLORS.MOUNTAINS);

// Carpates
drawCurvedLine([
    {x: 345, y: 108}, {x: 365, y: 118}, {x: 380, y: 132}, {x: 390, y: 148}
], 7, COLORS.MOUNTAINS);

// Atlas
drawCurvedLine([
    {x: 15, y: 200}, {x: 60, y: 208}, {x: 110, y: 218}, {x: 165, y: 230}, {x: 210, y: 242}
], 10, COLORS.MOUNTAINS);

// Montagnes d'Écosse
drawCurvedLine([
    {x: 138, y: 5}, {x: 148, y: 12}, {x: 155, y: 20}
], 4, COLORS.HILLS);

// Massif Central
fillNoiseCircle(155, 90, 15, COLORS.HILLS, 0.55);

// Sierra Nevada/Cordillère Bétique
drawCurvedLine([
    {x: 40, y: 178}, {x: 65, y: 182}, {x: 85, y: 178}
], 5, COLORS.MOUNTAINS);

// Montagnes de Grèce
drawCurvedLine([
    {x: 345, y: 180}, {x: 355, y: 198}, {x: 352, y: 218}
], 5, COLORS.MOUNTAINS);

// Taurus
drawCurvedLine([
    {x: 378, y: 235}, {x: 390, y: 252}, {x: 398, y: 268}
], 6, COLORS.MOUNTAINS);

// Etna (Sicile)
fillNoiseCircle(295, y = 275, 6, COLORS.MOUNTAINS, 0.5);

// ========== FORÊTS ==========
console.log('Ajout des forêts...');

// Forêts germaniques
fillNoiseRegion(235, 50, 95, 45, COLORS.DENSE_FOREST, 0.42);
fillNoiseRegion(320, 60, 55, 40, COLORS.FOREST, 0.38);
fillNoiseRegion(355, 80, 40, 30, COLORS.DENSE_FOREST, 0.35);

// Forêts de Gaule
fillNoiseRegion(130, 55, 45, 30, COLORS.FOREST, 0.32);
fillNoiseRegion(155, 78, 40, 28, COLORS.FOREST, 0.28);
fillNoiseRegion(115, 68, 25, 22, COLORS.FOREST, 0.35);
fillNoiseRegion(180, 50, 30, 25, COLORS.FOREST, 0.3);

// Forêts britanniques
fillNoiseRegion(88, 15, 25, 28, COLORS.FOREST, 0.38);
fillNoiseRegion(135, 18, 25, 30, COLORS.FOREST, 0.32);

// Forêts des Balkans
fillNoiseRegion(315, 135, 35, 28, COLORS.FOREST, 0.32);
fillNoiseRegion(350, 148, 28, 25, COLORS.FOREST, 0.28);

// Forêts scandinaves
fillNoiseRegion(275, 2, 85, 18, COLORS.DENSE_FOREST, 0.48);
fillNoiseRegion(255, 18, 20, 15, COLORS.FOREST, 0.4);

// Forêts d'Espagne nord
fillNoiseRegion(20, 82, 50, 20, COLORS.FOREST, 0.28);

// Forêts d'Europe de l'Est
fillNoiseRegion(378, 85, 22, 38, COLORS.FOREST, 0.38);

// ========== DÉSERT ==========
console.log('Ajout des déserts...');

// Sahara
fillNoiseRegion(0, 250, 400, 50, COLORS.DESERT, 0.92);
fillNoiseRegion(85, 238, 200, 28, COLORS.DESERT, 0.85);
fillNoiseRegion(280, 280, 120, 20, COLORS.DESERT, 0.88);

// Désert libyen/égyptien
fillNoiseRegion(345, 288, 55, 12, COLORS.DESERT, 0.9);

// ========== MARAIS ==========
console.log('Ajout des marais...');

// Delta du Pô
fillNoiseRegion(268, y = 132, 15, 10, COLORS.MARSH, 0.48);

// Marais Pontins
fillNoiseRegion(262, 192, 10, 10, COLORS.MARSH, 0.42);

// Marais de Bretagne
fillNoiseRegion(105, 52, 12, 10, COLORS.MARSH, 0.38);

// Delta du Rhin
fillNoiseRegion(228, 42, 12, 10, COLORS.MARSH, 0.45);

// Marais britanniques (Fens)
fillNoiseRegion(162, 42, 10, 10, COLORS.MARSH, 0.4);

// Delta du Nil
fillNoiseRegion(392, 285, 8, 12, COLORS.MARSH, 0.55);

// ========== RIVIÈRES ==========
console.log('Ajout des rivières...');

// Tibre
drawCurvedLine([
    {x: 255, y: 158}, {x: 260, y: 175}, {x: 262, y: 190}
], 2, COLORS.RIVER);

// Pô
drawCurvedLine([
    {x: 218, y: 112}, {x: 242, y: 118}, {x: 268, y: 128}, {x: 280, y: 135}
], 3, COLORS.RIVER);

// Rhône
drawCurvedLine([
    {x: 185, y: 70}, {x: 180, y: 92}, {x: 175, y: 115}, {x: 172, y: 125}
], 2, COLORS.RIVER);

// Rhin
drawCurvedLine([
    {x: 220, y: 75}, {x: 228, y: 58}, {x: 235, y: 42}
], 2, COLORS.RIVER);

// Danube
drawCurvedLine([
    {x: 255, y: 98}, {x: 290, y: 108}, {x: 330, y: 118}, {x: 370, y: 135}, {x: 395, y: 150}
], 3, COLORS.RIVER);

// Loire
drawCurvedLine([
    {x: 108, y: 58}, {x: 125, y: 72}, {x: 142, y: 85}
], 2, COLORS.RIVER);

// Seine
drawCurvedLine([
    {x: 155, y: 42}, {x: 165, y: 58}, {x: 172, y: 72}
], 2, COLORS.RIVER);

// Èbre
drawCurvedLine([
    {x: 55, y: 85}, {x: 78, y: 105}, {x: 100, y: 130}, {x: 108, y: 145}
], 2, COLORS.RIVER);

// Garonne
drawCurvedLine([
    {x: 100, y: 105}, {x: 118, y: 92}, {x: 135, y: 82}
], 2, COLORS.RIVER);

// Nil (delta)
drawCurvedLine([
    {x: 395, y: 275}, {x: 398, y: 290}, {x: 400, y: 298}
], 3, COLORS.RIVER);

// Tage
drawCurvedLine([
    {x: 5, y: 148}, {x: 35, y: 145}, {x: 62, y: 138}
], 2, COLORS.RIVER);

// ========== TERRES AGRICOLES ==========
console.log('Ajout des terres agricoles...');

// Plaine du Pô
fillNoiseRegion(225, y = 108, 45, 25, COLORS.FARMLAND, 0.32);

// Sicile
fillNoiseRegion(268, 268, 28, 15, COLORS.FARMLAND, 0.28);

// Delta du Nil
fillNoiseCircle(395, 282, 10, COLORS.FARMLAND, 0.42);

// Tunisie
fillNoiseRegion(185, 232, 32, 18, COLORS.FARMLAND, 0.32);

// ========== SAUVEGARDER ==========
const outputDir = path.join(__dirname, '..', 'assets', 'maps');
const outputPath = path.join(outputDir, 'europe_generated.png');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`\nCarte générée avec succès!`);
console.log(`Fichier: ${outputPath}`);
console.log(`Dimensions: ${WIDTH}x${HEIGHT} pixels`);
console.log(`Taille: ${Math.round(buffer.length / 1024)} Ko`);
