/**
 * Générateur de sprites via Stable Diffusion API (Automatic1111)
 *
 * Usage:
 *   node sprite-generator.js                    # Génère tous les sprites
 *   node sprite-generator.js --list             # Liste les sprites à générer
 *   node sprite-generator.js --stats            # Affiche les statistiques
 *   node sprite-generator.js --unit infantry    # Génère seulement l'infanterie
 *   node sprite-generator.js --faction roman    # Génère seulement les romains
 *   node sprite-generator.js --single infantry_roman_idle_S  # Génère un seul sprite
 *   node sprite-generator.js --dry-run          # Simule sans générer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
    GLOBAL_CONFIG,
    NEGATIVE_PROMPT,
    generateSpriteList,
    getGenerationStats
} from './sprite-generator-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    ...GLOBAL_CONFIG,
    // Override si nécessaire
    maxRetries: 3,
    retryDelay: 5000,
    savePrompts: true,  // Sauvegarder les prompts dans des fichiers .txt
    createDirectories: true
};

// =============================================================================
// UTILITAIRES
// =============================================================================

/**
 * Pause async
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crée les dossiers nécessaires
 */
function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé: ${dir}`);
    }
}

/**
 * Sauvegarde une image en base64
 */
function saveBase64Image(base64Data, filePath) {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
}

/**
 * Log avec timestamp
 */
function log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        progress: '🔄'
    };
    console.log(`[${timestamp}] ${icons[type] || ''} ${message}`);
}

// =============================================================================
// API STABLE DIFFUSION
// =============================================================================

/**
 * Appelle l'API Automatic1111 pour générer une image
 */
async function generateImage(prompt, width, height, seed = -1) {
    const payload = {
        prompt: prompt,
        negative_prompt: NEGATIVE_PROMPT,
        steps: CONFIG.steps,
        cfg_scale: CONFIG.cfgScale,
        sampler_name: CONFIG.sampler,
        width: width,
        height: height,
        seed: seed,
        batch_size: 1,
        n_iter: 1,
        restore_faces: false,
        tiling: false
    };

    const response = await fetch(`${CONFIG.apiUrl}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
        image: data.images[0],
        info: JSON.parse(data.info),
        seed: JSON.parse(data.info).seed
    };
}

/**
 * Vérifie si l'API est accessible
 */
async function checkApiConnection() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/sdapi/v1/sd-models`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// =============================================================================
// GÉNÉRATION DE SPRITES
// =============================================================================

/**
 * Génère un sprite unique avec plusieurs variations
 */
async function generateSprite(spriteConfig, options = {}) {
    const { dryRun = false, variations = CONFIG.variationsPerPrompt } = options;

    const outputPath = path.join(CONFIG.outputDir, spriteConfig.filename);

    if (dryRun) {
        log(`[DRY-RUN] ${spriteConfig.id} → ${outputPath}`, 'info');
        return { success: true, dryRun: true };
    }

    ensureDirectoryExists(outputPath);

    // Sauvegarder le prompt
    if (CONFIG.savePrompts) {
        const promptPath = outputPath.replace('.png', '_prompt.txt');
        fs.writeFileSync(promptPath, spriteConfig.prompt);
    }

    const results = [];

    for (let i = 0; i < variations; i++) {
        let retries = 0;
        let success = false;

        while (retries < CONFIG.maxRetries && !success) {
            try {
                log(`Génération ${spriteConfig.id} (variation ${i + 1}/${variations})...`, 'progress');

                const result = await generateImage(
                    spriteConfig.prompt,
                    spriteConfig.width,
                    spriteConfig.height
                );

                // Sauvegarder l'image
                const variantPath = variations > 1
                    ? outputPath.replace('.png', `_v${i + 1}.png`)
                    : outputPath;

                saveBase64Image(result.image, variantPath);

                results.push({
                    path: variantPath,
                    seed: result.seed
                });

                log(`Sauvegardé: ${variantPath} (seed: ${result.seed})`, 'success');
                success = true;

            } catch (error) {
                retries++;
                log(`Erreur (tentative ${retries}/${CONFIG.maxRetries}): ${error.message}`, 'error');

                if (retries < CONFIG.maxRetries) {
                    await sleep(CONFIG.retryDelay);
                }
            }
        }

        if (!success) {
            log(`Échec définitif pour ${spriteConfig.id} variation ${i + 1}`, 'error');
        }

        // Délai entre les générations
        if (i < variations - 1) {
            await sleep(CONFIG.delayBetweenRequests);
        }
    }

    return {
        success: results.length > 0,
        results,
        spriteConfig
    };
}

/**
 * Génère tous les sprites selon les filtres
 */
async function generateAllSprites(options = {}) {
    const {
        unitType = null,
        faction = null,
        animation = null,
        singleId = null,
        dryRun = false
    } = options;

    let sprites = generateSpriteList();

    // Appliquer les filtres
    if (singleId) {
        sprites = sprites.filter(s => s.id === singleId);
    } else {
        if (unitType) {
            sprites = sprites.filter(s => s.unitType === unitType);
        }
        if (faction) {
            sprites = sprites.filter(s => s.faction === faction);
        }
        if (animation) {
            sprites = sprites.filter(s => s.animation === animation);
        }
    }

    if (sprites.length === 0) {
        log('Aucun sprite ne correspond aux filtres', 'warning');
        return;
    }

    log(`Début de la génération de ${sprites.length} sprites...`, 'info');

    if (!dryRun) {
        const apiOk = await checkApiConnection();
        if (!apiOk) {
            log(`Impossible de se connecter à l'API: ${CONFIG.apiUrl}`, 'error');
            log('Assurez-vous que Automatic1111 est lancé avec --api', 'info');
            return;
        }
        log('Connexion API OK', 'success');
    }

    const startTime = Date.now();
    let completed = 0;
    let failed = 0;

    for (const sprite of sprites) {
        const result = await generateSprite(sprite, { dryRun });

        if (result.success) {
            completed++;
        } else {
            failed++;
        }

        // Progression
        const percent = Math.round(((completed + failed) / sprites.length) * 100);
        log(`Progression: ${completed + failed}/${sprites.length} (${percent}%)`, 'progress');

        // Délai entre les sprites
        if (!dryRun) {
            await sleep(CONFIG.delayBetweenRequests);
        }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log(`Terminé! ${completed} réussis, ${failed} échoués en ${elapsed}s`, 'success');
}

// =============================================================================
// COMMANDES CLI
// =============================================================================

function printHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║              GÉNÉRATEUR DE SPRITES - STABLE DIFFUSION              ║
╚═══════════════════════════════════════════════════════════════════╝

Usage:
  node sprite-generator.js [options]

Options:
  --help, -h              Affiche cette aide
  --list                  Liste tous les sprites à générer
  --stats                 Affiche les statistiques de génération
  --dry-run               Simule la génération sans appeler l'API

Filtres:
  --unit <type>           Filtre par type d'unité (infantry, cavalry, ranged, elephant)
  --faction <id>          Filtre par faction (roman, gaul, carthage, macedon, eastern, rebel)
  --animation <name>      Filtre par animation (idle, walk, attack, death)
  --single <id>           Génère un seul sprite par son ID

Configuration:
  --api-url <url>         URL de l'API (défaut: http://127.0.0.1:7860)
  --output <dir>          Dossier de sortie
  --variations <n>        Nombre de variations par sprite (défaut: 4)

Exemples:
  node sprite-generator.js --stats
  node sprite-generator.js --list --unit infantry
  node sprite-generator.js --dry-run --faction roman
  node sprite-generator.js --single infantry_roman_idle_S
  node sprite-generator.js --unit cavalry --faction gaul
`);
}

function printStats() {
    const stats = getGenerationStats();

    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    STATISTIQUES DE GÉNÉRATION                      ║
╚═══════════════════════════════════════════════════════════════════╝

📊 Total de sprites à générer: ${stats.totalSprites}

Par type d'unité:
${Object.entries(stats.byUnitType).map(([k, v]) => `  • ${k}: ${v}`).join('\n')}

Par faction:
${Object.entries(stats.byFaction).map(([k, v]) => `  • ${k}: ${v}`).join('\n')}

Par animation:
${Object.entries(stats.byAnimation).map(([k, v]) => `  • ${k}: ${v}`).join('\n')}

⏱️  Temps estimé (${CONFIG.variationsPerPrompt} variations/sprite):
  • ${stats.estimatedTime.minutes} minutes
  • ${stats.estimatedTime.hours} heures
`);
}

function printList(options = {}) {
    let sprites = generateSpriteList();

    if (options.unitType) {
        sprites = sprites.filter(s => s.unitType === options.unitType);
    }
    if (options.faction) {
        sprites = sprites.filter(s => s.faction === options.faction);
    }
    if (options.animation) {
        sprites = sprites.filter(s => s.animation === options.animation);
    }

    console.log(`\n📋 Liste des sprites (${sprites.length}):\n`);

    for (const sprite of sprites) {
        console.log(`  ${sprite.id}`);
        console.log(`    → ${sprite.filename}`);
        console.log(`    → ${sprite.width}x${sprite.height} (${sprite.frameCount} frames)`);
        console.log('');
    }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    const args = process.argv.slice(2);

    // Parse arguments
    const options = {
        help: args.includes('--help') || args.includes('-h'),
        list: args.includes('--list'),
        stats: args.includes('--stats'),
        dryRun: args.includes('--dry-run'),
        unitType: null,
        faction: null,
        animation: null,
        singleId: null
    };

    // Parse value arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--unit' && args[i + 1]) {
            options.unitType = args[i + 1];
        }
        if (args[i] === '--faction' && args[i + 1]) {
            options.faction = args[i + 1];
        }
        if (args[i] === '--animation' && args[i + 1]) {
            options.animation = args[i + 1];
        }
        if (args[i] === '--single' && args[i + 1]) {
            options.singleId = args[i + 1];
        }
        if (args[i] === '--api-url' && args[i + 1]) {
            CONFIG.apiUrl = args[i + 1];
        }
        if (args[i] === '--output' && args[i + 1]) {
            CONFIG.outputDir = args[i + 1];
        }
        if (args[i] === '--variations' && args[i + 1]) {
            CONFIG.variationsPerPrompt = parseInt(args[i + 1], 10);
        }
    }

    // Execute command
    if (options.help) {
        printHelp();
    } else if (options.stats) {
        printStats();
    } else if (options.list) {
        printList(options);
    } else {
        await generateAllSprites(options);
    }
}

main().catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
});
