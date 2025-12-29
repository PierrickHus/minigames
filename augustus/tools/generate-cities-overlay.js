/**
 * Script pour générer un calque des villes
 * Permet de vérifier le placement des villes sur la carte
 *
 * Usage: node generate-cities-overlay.js
 * Génère: ../assets/maps/cities_overlay.png (400x300 pixels, fond transparent)
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Dimensions de la carte
const WIDTH = 400;
const HEIGHT = 300;

// Données des villes (copiées de cities.js)
const CITIES = {
    // ========== ITALIE ==========
    roma: { name: 'Rome', tileX: 262, tileY: 188, isCapital: true },
    capua: { name: 'Capoue', tileX: 270, tileY: 208 },
    tarentum: { name: 'Tarente', tileX: 300, tileY: 210 },
    mediolanum: { name: 'Milan', tileX: 235, tileY: 108 },
    ravenna: { name: 'Ravenne', tileX: 268, tileY: 135 },

    // ========== GAULE ==========
    lugdunum: { name: 'Lyon', tileX: 180, tileY: 88 },
    massilia: { name: 'Marseille', tileX: 172, tileY: 122 },
    narbo: { name: 'Narbonne', tileX: 145, tileY: 125 },
    lutetia: { name: 'Lutèce', tileX: 168, tileY: 55 },

    // ========== HISPANIE ==========
    carthago_nova: { name: 'Carthagène', tileX: 88, tileY: 172 },
    tarraco: { name: 'Tarragone', tileX: 108, tileY: 140 },
    corduba: { name: 'Cordoue', tileX: 48, tileY: 165 },

    // ========== AFRIQUE DU NORD ==========
    carthago: { name: 'Carthage', tileX: 198, tileY: 225, isCapital: true },
    tingis: { name: 'Tanger', tileX: 25, tileY: 192 },
    cirta: { name: 'Cirta', tileX: 150, tileY: 218 },
    alexandria: { name: 'Alexandrie', tileX: 395, tileY: 285, isCapital: true },

    // ========== GRÈCE / MACÉDOINE ==========
    thessalonica: { name: 'Thessalonique', tileX: 365, tileY: 180 },
    athenae: { name: 'Athènes', tileX: 375, tileY: 215 },
    sparta: { name: 'Sparte', tileX: 355, tileY: 248 },
    pella: { name: 'Pella', tileX: 362, tileY: 175 },

    // ========== ASIE MINEURE ==========
    sinope: { name: 'Sinope', tileX: 395, tileY: 145 },
    pergamum: { name: 'Pergame', tileX: 388, tileY: 188 },
    ephesus: { name: 'Éphèse', tileX: 388, tileY: 205 },

    // ========== GERMANIE ==========
    mogontiacum: { name: 'Mayence', tileX: 225, tileY: 70 },

    // ========== BRITANNIE ==========
    londinium: { name: 'Londres', tileX: 158, tileY: 45 },

    // ========== SICILE ==========
    syracusae: { name: 'Syracuse', tileX: 305, tileY: 280 },

    // ========== ÎLES ==========
    panormus: { name: 'Palerme', tileX: 278, tileY: 265 }
};

// Créer le canvas avec fond transparent
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// Fond transparent (par défaut)
ctx.clearRect(0, 0, WIDTH, HEIGHT);

// Dessiner chaque ville
console.log('Génération du calque des villes...\n');

Object.entries(CITIES).forEach(([id, city]) => {
    const x = city.tileX;
    const y = city.tileY;

    // Point de la ville
    if (city.isCapital) {
        // Capitales en or avec cercle plus grand
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        // Villes normales en rouge
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#800000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Nom de la ville
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';

    // Décalage du texte pour éviter le chevauchement avec le point
    const textY = y - 8;

    ctx.strokeText(city.name, x, textY);
    ctx.fillText(city.name, x, textY);

    console.log(`  ${city.name}: (${x}, ${y})`);
});

// Sauvegarder
const outputDir = path.join(__dirname, '..', 'assets', 'maps');
const outputPath = path.join(outputDir, 'cities_overlay.png');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`\nCalque des villes généré avec succès!`);
console.log(`Fichier: ${outputPath}`);
console.log(`Dimensions: ${WIDTH}x${HEIGHT} pixels`);
console.log(`\nVous pouvez superposer ce calque sur europe_generated.png pour vérifier les positions.`);
