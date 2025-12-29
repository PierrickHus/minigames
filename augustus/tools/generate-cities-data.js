/**
 * Script pour générer les données des villes
 *
 * Génère:
 * - europe_cities.png : 1 pixel par ville (couleur unique)
 * - europe_cities.json : mapping couleur -> infos de la ville
 *
 * Usage: node generate-cities-data.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Dimensions de la carte
const WIDTH = 400;
const HEIGHT = 300;

// Données complètes des villes
// Coordonnées basées sur generate-map-image.js
const CITIES = {
    // ========== ITALIE ==========
    roma: {
        name: 'Rome',
        tileX: 260,  // Latium (x: 260, y: 190)
        tileY: 185,
        faction: 'julii',
        population: 50000,
        isCapital: true,
        coastal: false,
        terrain: 'plains',
        buildings: ['forum', 'temple_jupiter', 'barracks', 'walls'],
        garrison: { hastati: 2, principes: 1, equites: 1 }
    },
    capua: {
        name: 'Capoue',
        tileX: 268,  // Campanie (x: 272, y: 210)
        tileY: 205,
        faction: 'scipii',
        population: 15000,
        isCapital: false,
        coastal: false,
        terrain: 'plains',
        buildings: ['forum', 'barracks'],
        garrison: { hastati: 1 }
    },
    tarentum: {
        name: 'Tarente',
        tileX: 305,  // Talon de la botte (Pouilles)
        tileY: 200,
        faction: 'brutii',
        population: 12000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['forum', 'port'],
        garrison: { hastati: 1 }
    },
    mediolanum: {
        name: 'Milan',
        tileX: 238,  // Lombardie (x: 238, y: 100)
        tileY: 105,
        faction: 'rebels',
        population: 8000,
        isCapital: false,
        coastal: false,
        terrain: 'plains',
        buildings: ['village'],
        garrison: { warband: 2 }
    },
    ravenna: {
        name: 'Ravenne',
        tileX: 272,  // Émilie est (x: 270, y: 138)
        tileY: 140,
        faction: 'rebels',
        population: 6000,
        isCapital: false,
        coastal: true,
        terrain: 'marsh',
        buildings: ['village', 'port'],
        garrison: { warband: 1 }
    },

    // ========== GAULE ==========
    lugdunum: {
        name: 'Lyon',
        tileX: 175,  // Centre Gaule, confluence Rhône
        tileY: 95,
        faction: 'gauls',
        population: 10000,
        isCapital: true,
        coastal: false,
        terrain: 'hills',
        buildings: ['oppidum', 'smith'],
        garrison: { warband: 3, cavalry: 1 }
    },
    massilia: {
        name: 'Marseille',
        tileX: 175,  // Provence est (x: 175, y: 122)
        tileY: 120,
        faction: 'rebels',
        population: 12000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['forum', 'port', 'market'],
        garrison: { hoplites: 1 }
    },
    narbo: {
        name: 'Narbonne',
        tileX: 130,  // Languedoc (x: 120, y: 120)
        tileY: 118,
        faction: 'rebels',
        population: 7000,
        isCapital: false,
        coastal: true,
        terrain: 'plains',
        buildings: ['village', 'port'],
        garrison: { warband: 1 }
    },
    lutetia: {
        name: 'Lutèce',
        tileX: 165,  // Nord France (x: 170, y: 38)
        tileY: 50,
        faction: 'gauls',
        population: 5000,
        isCapital: false,
        coastal: false,
        terrain: 'plains',
        buildings: ['village'],
        garrison: { warband: 2 }
    },

    // ========== HISPANIE ==========
    carthago_nova: {
        name: 'Carthagène',
        tileX: 90,   // Murcie (x: 80, y: 180)
        tileY: 175,
        faction: 'carthage',
        population: 15000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['forum', 'port', 'barracks'],
        garrison: { infantry: 2, elephants: 1 }
    },
    tarraco: {
        name: 'Tarragone',
        tileX: 105,  // Catalogne (x: 110, y: 125)
        tileY: 135,
        faction: 'rebels',
        population: 8000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['village', 'port'],
        garrison: { warband: 1 }
    },
    corduba: {
        name: 'Cordoue',
        tileX: 45,   // Plateau central sud
        tileY: 160,
        faction: 'rebels',
        population: 10000,
        isCapital: false,
        coastal: false,
        terrain: 'plains',
        buildings: ['village', 'mine'],
        garrison: { warband: 2 }
    },

    // ========== AFRIQUE DU NORD ==========
    carthago: {
        name: 'Carthage',
        tileX: 200,  // Africa/Tunisie (x: 195, y: 228)
        tileY: 230,
        faction: 'carthage',
        population: 40000,
        isCapital: true,
        coastal: true,
        terrain: 'desert',
        buildings: ['palace', 'temple', 'port', 'barracks', 'walls', 'market'],
        garrison: { infantry: 3, sacred_band: 1, elephants: 2, cavalry: 2 }
    },
    tingis: {
        name: 'Tanger',
        tileX: 22,   // Maroc nord (x: 20, y: 192)
        tileY: 195,
        faction: 'numidia',
        population: 8000,
        isCapital: false,
        coastal: true,
        terrain: 'desert',
        buildings: ['village', 'port'],
        garrison: { cavalry: 2 }
    },
    cirta: {
        name: 'Cirta',
        tileX: 130,  // Numidie (x: 150, y: 218)
        tileY: 215,
        faction: 'numidia',
        population: 6000,
        isCapital: true,
        coastal: false,
        terrain: 'desert',
        buildings: ['oppidum'],
        garrison: { cavalry: 3 }
    },
    alexandria: {
        name: 'Alexandrie',
        tileX: 395,  // Égypte (bord droit)
        tileY: 290,
        faction: 'egypt',
        population: 35000,
        isCapital: true,
        coastal: true,
        terrain: 'desert',
        buildings: ['palace', 'library', 'port', 'lighthouse', 'barracks'],
        garrison: { phalanx: 2, cavalry: 1 }
    },

    // ========== GRÈCE / MACÉDOINE ==========
    thessalonica: {
        name: 'Thessalonique',
        tileX: 358,  // Macédoine (x: 358, y: 178)
        tileY: 178,
        faction: 'macedon',
        population: 18000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['forum', 'port', 'barracks'],
        garrison: { phalanx: 2 }
    },
    athenae: {
        name: 'Athènes',
        tileX: 375,  // Attique (x: 382, y: 218)
        tileY: 212,
        faction: 'greek_cities',
        population: 25000,
        isCapital: true,
        coastal: true,
        terrain: 'hills',
        buildings: ['acropolis', 'agora', 'port', 'academy'],
        garrison: { hoplites: 2, peltasts: 1 }
    },
    sparta: {
        name: 'Sparte',
        tileX: 352,  // Péloponnèse/Laconie (x: 358, y: 268)
        tileY: 255,
        faction: 'greek_cities',
        population: 10000,
        isCapital: false,
        coastal: false,
        terrain: 'mountains',
        buildings: ['barracks', 'training_ground'],
        garrison: { spartan_hoplites: 2 }
    },
    pella: {
        name: 'Pella',
        tileX: 362,  // Macédoine nord (x: 358, y: 175)
        tileY: 172,
        faction: 'macedon',
        population: 15000,
        isCapital: true,
        coastal: false,
        terrain: 'plains',
        buildings: ['palace', 'barracks', 'stables'],
        garrison: { phalanx: 2, companion_cavalry: 1 }
    },

    // ========== ASIE MINEURE ==========
    sinope: {
        name: 'Sinope',
        tileX: 398,  // Pont (bord Mer Noire) (x: 398, y: 145)
        tileY: 140,
        faction: 'pontus',
        population: 12000,
        isCapital: true,
        coastal: true,
        terrain: 'hills',
        buildings: ['palace', 'port', 'barracks'],
        garrison: { infantry: 2, cavalry: 1 }
    },
    pergamum: {
        name: 'Pergame',
        tileX: 390,  // Mysie (x: 388, y: 172)
        tileY: 175,
        faction: 'rebels',
        population: 15000,
        isCapital: false,
        coastal: false,
        terrain: 'hills',
        buildings: ['acropolis', 'library'],
        garrison: { hoplites: 1 }
    },
    ephesus: {
        name: 'Éphèse',
        tileX: 388,  // Lydie (x: 385, y: 195)
        tileY: 195,
        faction: 'seleucid',
        population: 18000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['temple_artemis', 'port', 'market'],
        garrison: { phalanx: 1, cavalry: 1 }
    },

    // ========== GERMANIE ==========
    mogontiacum: {
        name: 'Mayence',
        tileX: 222,  // Rhénanie (x: 220, y: 72)
        tileY: 75,
        faction: 'germans',
        population: 4000,
        isCapital: false,
        coastal: false,
        terrain: 'forest',
        buildings: ['village'],
        garrison: { warband: 2 }
    },

    // ========== BRITANNIE ==========
    londinium: {
        name: 'Londres',
        tileX: 155,  // Sud Grande-Bretagne (x: 165, y: 52)
        tileY: 48,
        faction: 'britons',
        population: 3000,
        isCapital: true,
        coastal: true,
        terrain: 'plains',
        buildings: ['village'],
        garrison: { warband: 2, chariots: 1 }
    },

    // ========== SICILE ==========
    syracusae: {
        name: 'Syracuse',
        tileX: 302,  // Est Sicile (x: 308, y: 282)
        tileY: 278,
        faction: 'greek_cities',
        population: 20000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['forum', 'port', 'walls', 'theater'],
        garrison: { hoplites: 2 }
    },

    // ========== ÎLES ==========
    panormus: {
        name: 'Palerme',
        tileX: 275,  // Nord Sicile (x: 280, y: 262)
        tileY: 265,
        faction: 'carthage',
        population: 8000,
        isCapital: false,
        coastal: true,
        terrain: 'hills',
        buildings: ['port', 'barracks'],
        garrison: { infantry: 1 }
    }
};

// Générer une couleur unique pour chaque ville
function generateUniqueColors(cities) {
    const cityIds = Object.keys(cities);
    const colors = {};

    cityIds.forEach((id, index) => {
        // Générer des couleurs bien distinctes
        // On utilise des valeurs RGB espacées pour éviter les confusions
        const r = ((index * 37) % 200) + 50;  // 50-250
        const g = ((index * 73) % 200) + 50;  // 50-250
        const b = ((index * 113) % 200) + 50; // 50-250

        colors[id] = { r, g, b };
    });

    return colors;
}

// Créer le canvas
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// Fond transparent
ctx.clearRect(0, 0, WIDTH, HEIGHT);

// Générer les couleurs
const cityColors = generateUniqueColors(CITIES);

// Créer le JSON de mapping
const citiesJson = {};

console.log('Génération des données des villes...\n');

Object.entries(CITIES).forEach(([id, city]) => {
    const color = cityColors[id];
    const hexColor = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;

    // Dessiner le pixel de la ville
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(city.tileX, city.tileY, 1, 1);

    // Ajouter au JSON (sans les coordonnées, elles sont dans l'image)
    citiesJson[hexColor] = {
        id: id,
        name: city.name,
        faction: city.faction,
        population: city.population,
        isCapital: city.isCapital || false,
        coastal: city.coastal,
        terrain: city.terrain,
        buildings: city.buildings || [],
        garrison: city.garrison || {}
    };

    console.log(`  ${city.name}: (${city.tileX}, ${city.tileY}) -> ${hexColor}`);
});

// Sauvegarder les fichiers
const outputDir = path.join(__dirname, '..', 'assets', 'maps');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Image PNG
const pngPath = path.join(outputDir, 'europe_cities.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(pngPath, buffer);

// JSON
const jsonPath = path.join(outputDir, 'europe_cities.json');
fs.writeFileSync(jsonPath, JSON.stringify(citiesJson, null, 2));

console.log(`\nFichiers générés avec succès!`);
console.log(`  Image: ${pngPath}`);
console.log(`  JSON:  ${jsonPath}`);
console.log(`\nNombre de villes: ${Object.keys(CITIES).length}`);
