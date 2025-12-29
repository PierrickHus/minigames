/**
 * Script pour convertir l'image de référence Rome Total War
 * en carte de jeu avec notre palette de couleurs
 *
 * Usage: node convert-reference-map.js <chemin-image-source>
 * Génère: ../assets/maps/europe.png (400x300 pixels)
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Dimensions de sortie
const OUTPUT_WIDTH = 400;
const OUTPUT_HEIGHT = 300;

// Palette de couleurs de sortie (terrain -> RGB)
const OUTPUT_COLORS = {
    DEEP_WATER: { r: 10, g: 45, b: 74 },
    SHALLOW_WATER: { r: 26, g: 77, b: 110 },
    PLAINS: { r: 124, g: 179, b: 66 },
    GRASSLAND: { r: 139, g: 195, b: 74 },
    FOREST: { r: 46, g: 92, b: 46 },
    DENSE_FOREST: { r: 27, g: 67, b: 50 },
    HILLS: { r: 141, g: 110, b: 99 },
    MOUNTAINS: { r: 93, g: 64, b: 55 },
    IMPASSABLE_MOUNTAINS: { r: 62, g: 39, b: 35 },
    DESERT: { r: 230, g: 196, b: 127 },
    SAND_COAST: { r: 212, g: 184, b: 150 },
    MARSH: { r: 74, g: 103, b: 65 },
};

/**
 * Convertit RGB en HSL pour une meilleure analyse des couleurs
 */
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Analyse une couleur de l'image source et détermine le type de terrain
 * Basé sur l'analyse des couleurs de la carte Rome Total War
 */
function classifyPixel(r, g, b) {
    const hsl = rgbToHsl(r, g, b);
    const brightness = (r + g + b) / 3;

    // === IGNORER LES BORDURES ROUGES ===
    if ((hsl.h < 20 || hsl.h > 340) && hsl.s > 40 && r > 120) {
        if (brightness > 150) return OUTPUT_COLORS.SAND_COAST;
        if (brightness > 100) return OUTPUT_COLORS.HILLS;
        return OUTPUT_COLORS.MOUNTAINS;
    }

    // === EAU - PRIORITÉ TRÈS HAUTE ===
    // La mer dans RTW est cyan/turquoise - DOIT être détectée AVANT le vert

    // Méthode 1: Détection directe par ratio RGB
    // L'eau a typiquement: b >= g, et r est le plus bas
    // OU g et b sont proches et tous deux > r
    if (r < g && r < b) {
        // R est le canal le plus faible = probablement eau ou forêt
        // Si b est proche de g ou supérieur, c'est de l'eau
        if (b >= g * 0.9) {
            if (hsl.l > 55) return OUTPUT_COLORS.SHALLOW_WATER;
            if (hsl.l > 35) return OUTPUT_COLORS.DEEP_WATER;
        }
        // Si g >> b, c'est du vert (forêt)
    }

    // Méthode 2: Par teinte HSL - Bleu et Cyan
    // Bleu pur (h ~ 200-260)
    if (hsl.h >= 190 && hsl.h <= 260) {
        if (hsl.l > 50) return OUTPUT_COLORS.SHALLOW_WATER;
        return OUTPUT_COLORS.DEEP_WATER;
    }

    // Cyan / Turquoise (h ~ 150-190) - Zone critique!
    if (hsl.h >= 150 && hsl.h < 190) {
        // C'est de l'eau si bleu est significatif par rapport au vert
        if (b >= g * 0.85) {
            if (hsl.l > 55) return OUTPUT_COLORS.SHALLOW_WATER;
            if (hsl.l > 30) return OUTPUT_COLORS.DEEP_WATER;
        }
    }

    // Méthode 3: Détection spécifique du cyan clair de RTW
    // Cyan clair typique: r~100-150, g~150-200, b~150-200
    if (g > 130 && b > 130 && r < 160 && Math.abs(g - b) < 50) {
        if (b >= g * 0.9) {
            return hsl.l > 55 ? OUTPUT_COLORS.SHALLOW_WATER : OUTPUT_COLORS.DEEP_WATER;
        }
    }

    // === DÉSERT / SABLE - Teintes jaune-orange-beige ===
    // Jaune-orange : h ~ 30-55
    if (hsl.h >= 25 && hsl.h <= 55) {
        // Très saturé et lumineux = désert
        if (hsl.l > 65 && hsl.s > 30) {
            return OUTPUT_COLORS.DESERT;
        }
        // Moins saturé = côte sableuse / terrain aride
        if (hsl.l > 55) {
            return OUTPUT_COLORS.SAND_COAST;
        }
        // Plus sombre = collines arides
        if (hsl.l > 35) {
            return OUTPUT_COLORS.HILLS;
        }
    }

    // Beige/tan : h ~ 20-40, faible saturation
    if (hsl.h >= 15 && hsl.h <= 45 && hsl.s < 50 && hsl.l > 50) {
        if (hsl.l > 70) return OUTPUT_COLORS.DESERT;
        return OUTPUT_COLORS.SAND_COAST;
    }

    // === FORÊTS - Teintes vertes ===
    // Vert : h ~ 60-160
    if (hsl.h >= 60 && hsl.h <= 160) {
        // Vert très foncé = forêt dense
        if (hsl.l < 30) {
            return OUTPUT_COLORS.DENSE_FOREST;
        }
        // Vert foncé = forêt
        if (hsl.l < 45) {
            return OUTPUT_COLORS.FOREST;
        }
        // Vert moyen-clair = prairie/plaine
        if (hsl.l < 55) {
            // Plus saturé = prairie
            if (hsl.s > 40) return OUTPUT_COLORS.GRASSLAND;
            // Moins saturé = peut-être marais
            return OUTPUT_COLORS.MARSH;
        }
        // Vert clair = plaines
        return OUTPUT_COLORS.PLAINS;
    }

    // === MONTAGNES / COLLINES - Teintes marron/gris ===
    // Marron : h ~ 0-30, saturation moyenne
    if (hsl.h >= 0 && hsl.h <= 35 && hsl.s >= 15 && hsl.s <= 60) {
        // Très foncé = montagnes impassables
        if (hsl.l < 25) {
            return OUTPUT_COLORS.IMPASSABLE_MOUNTAINS;
        }
        // Foncé = montagnes
        if (hsl.l < 40) {
            return OUTPUT_COLORS.MOUNTAINS;
        }
        // Moyen = collines
        if (hsl.l < 55) {
            return OUTPUT_COLORS.HILLS;
        }
        // Clair = côte sableuse ou plaines arides
        return OUTPUT_COLORS.SAND_COAST;
    }

    // === GRIS (faible saturation) - Probablement montagnes ===
    if (hsl.s < 15) {
        if (hsl.l < 25) return OUTPUT_COLORS.IMPASSABLE_MOUNTAINS;
        if (hsl.l < 40) return OUTPUT_COLORS.MOUNTAINS;
        if (hsl.l < 55) return OUTPUT_COLORS.HILLS;
        // Gris clair = peut-être neige ou zone neutre
        return OUTPUT_COLORS.HILLS;
    }

    // === FALLBACK basé sur la dominance de couleur ===
    const maxChannel = Math.max(r, g, b);

    if (maxChannel === b && b > 80) {
        // Bleu dominant
        return brightness > 120 ? OUTPUT_COLORS.SHALLOW_WATER : OUTPUT_COLORS.DEEP_WATER;
    }

    if (maxChannel === g) {
        // Vert dominant
        if (brightness < 80) return OUTPUT_COLORS.DENSE_FOREST;
        if (brightness < 120) return OUTPUT_COLORS.FOREST;
        return OUTPUT_COLORS.GRASSLAND;
    }

    if (maxChannel === r) {
        // Rouge dominant (mais pas bordure)
        if (brightness > 180) return OUTPUT_COLORS.DESERT;
        if (brightness > 140) return OUTPUT_COLORS.SAND_COAST;
        if (brightness > 100) return OUTPUT_COLORS.HILLS;
        return OUTPUT_COLORS.MOUNTAINS;
    }

    // Défaut
    return OUTPUT_COLORS.PLAINS;
}

/**
 * Fonction principale
 */
async function convertMap(inputPath) {
    console.log('Chargement de l\'image source...');

    const sourceImage = await loadImage(inputPath);
    console.log(`Image source: ${sourceImage.width}x${sourceImage.height}`);

    const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(sourceImage, 0, 0);

    const sourceData = sourceCtx.getImageData(0, 0, sourceImage.width, sourceImage.height);

    const outputCanvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
    const outputCtx = outputCanvas.getContext('2d');

    // Marges minimales pour couper seulement les bordures rouges
    const marginLeft = Math.floor(sourceImage.width * 0.02);
    const marginRight = Math.floor(sourceImage.width * 0.02);
    const marginTop = Math.floor(sourceImage.height * 0.02);
    const marginBottom = Math.floor(sourceImage.height * 0.02);

    const sourceW = sourceImage.width - marginLeft - marginRight;
    const sourceH = sourceImage.height - marginTop - marginBottom;

    console.log(`Zone utile: ${sourceW}x${sourceH}`);
    console.log('Conversion en cours...');

    // Échantillonnage avec moyenne pondérée
    const sampleRadius = Math.max(2, Math.floor(sourceW / OUTPUT_WIDTH / 3));

    for (let y = 0; y < OUTPUT_HEIGHT; y++) {
        for (let x = 0; x < OUTPUT_WIDTH; x++) {
            const srcX = Math.floor(marginLeft + (x / OUTPUT_WIDTH) * sourceW);
            const srcY = Math.floor(marginTop + (y / OUTPUT_HEIGHT) * sourceH);

            // Échantillonner plusieurs pixels et faire la moyenne
            let totalR = 0, totalG = 0, totalB = 0, count = 0;

            for (let sy = -sampleRadius; sy <= sampleRadius; sy++) {
                for (let sx = -sampleRadius; sx <= sampleRadius; sx++) {
                    // Distance du centre (pondération gaussienne)
                    const dist = Math.sqrt(sx*sx + sy*sy);
                    if (dist > sampleRadius) continue;

                    const weight = 1 - (dist / (sampleRadius + 1));

                    const px = Math.min(sourceImage.width - 1, Math.max(0, srcX + sx));
                    const py = Math.min(sourceImage.height - 1, Math.max(0, srcY + sy));
                    const i = (py * sourceImage.width + px) * 4;

                    totalR += sourceData.data[i] * weight;
                    totalG += sourceData.data[i + 1] * weight;
                    totalB += sourceData.data[i + 2] * weight;
                    count += weight;
                }
            }

            const avgR = Math.round(totalR / count);
            const avgG = Math.round(totalG / count);
            const avgB = Math.round(totalB / count);

            const terrainColor = classifyPixel(avgR, avgG, avgB);

            outputCtx.fillStyle = `rgb(${terrainColor.r}, ${terrainColor.g}, ${terrainColor.b})`;
            outputCtx.fillRect(x, y, 1, 1);
        }

        if (y % 50 === 0) {
            console.log(`  ${Math.round(y / OUTPUT_HEIGHT * 100)}%`);
        }
    }

    console.log('  100%');

    // Post-traitement : lisser les pixels isolés
    console.log('Lissage des pixels isolés...');
    const outputData = outputCtx.getImageData(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    for (let y = 1; y < OUTPUT_HEIGHT - 1; y++) {
        for (let x = 1; x < OUTPUT_WIDTH - 1; x++) {
            const i = (y * OUTPUT_WIDTH + x) * 4;
            const r = outputData.data[i], g = outputData.data[i+1], b = outputData.data[i+2];

            // Compter les voisins similaires
            let sameCount = 0;
            const neighbors = [];

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const ni = ((y + dy) * OUTPUT_WIDTH + (x + dx)) * 4;
                    const nr = outputData.data[ni], ng = outputData.data[ni+1], nb = outputData.data[ni+2];

                    if (r === nr && g === ng && b === nb) {
                        sameCount++;
                    }
                    neighbors.push({ r: nr, g: ng, b: nb });
                }
            }

            // Si pixel isolé (moins de 2 voisins similaires), prendre la couleur majoritaire
            if (sameCount < 2) {
                const colorCounts = {};
                for (const n of neighbors) {
                    const key = `${n.r},${n.g},${n.b}`;
                    colorCounts[key] = (colorCounts[key] || 0) + 1;
                }

                let maxCount = 0, maxColor = null;
                for (const [key, count] of Object.entries(colorCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        maxColor = key.split(',').map(Number);
                    }
                }

                if (maxColor && maxCount >= 3) {
                    outputData.data[i] = maxColor[0];
                    outputData.data[i+1] = maxColor[1];
                    outputData.data[i+2] = maxColor[2];
                }
            }
        }
    }

    outputCtx.putImageData(outputData, 0, 0);

    // Sauvegarder
    const outputDir = path.join(__dirname, '..', 'assets', 'maps');
    const outputPath = path.join(outputDir, 'europe.png');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const buffer = outputCanvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`\nCarte générée avec succès!`);
    console.log(`Fichier: ${outputPath}`);
    console.log(`Dimensions: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} pixels`);
    console.log(`Taille: ${Math.round(buffer.length / 1024)} Ko`);
}

// Exécuter
const inputPath = process.argv[2];
if (!inputPath) {
    console.error('Usage: node convert-reference-map.js <chemin-image-source>');
    process.exit(1);
}

if (!fs.existsSync(inputPath)) {
    console.error(`Erreur: Le fichier "${inputPath}" n'existe pas.`);
    process.exit(1);
}

convertMap(inputPath).catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
});
