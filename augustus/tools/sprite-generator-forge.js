/**
 * Générateur de sprites via WebUI Forge API (Gradio)
 * Compatible avec stable-diffusion-webui-forge
 *
 * Usage:
 *   node sprite-generator-forge.js                    # Génère tous les sprites
 *   node sprite-generator-forge.js --list             # Liste les sprites à générer
 *   node sprite-generator-forge.js --stats            # Affiche les statistiques
 *   node sprite-generator-forge.js --unit infantry    # Génère seulement l'infanterie
 *   node sprite-generator-forge.js --faction roman    # Génère seulement les romains
 *   node sprite-generator-forge.js --single infantry_roman_idle_S  # Génère un seul sprite
 *   node sprite-generator-forge.js --dry-run          # Simule sans générer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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
    apiUrl: "http://127.0.0.1:7860",
    maxRetries: 3,
    retryDelay: 5000,
    savePrompts: true,
    createDirectories: true,

    // Paramètres Forge/SD spécifiques
    checkpoint: null,  // null = utiliser le modèle actuel
    vae: null,
    samplerIndex: 0,   // Index du sampler dans la liste
};

// =============================================================================
// UTILITAIRES
// =============================================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé: ${dir}`);
    }
}

function saveBase64Image(base64Data, filePath) {
    // Gérer les data URLs
    let data = base64Data;
    if (base64Data.startsWith('data:')) {
        data = base64Data.split(',')[1];
    }
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, buffer);
}

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

function generateSessionHash() {
    return crypto.randomBytes(8).toString('hex');
}

// =============================================================================
// API FORGE (GRADIO)
// =============================================================================

/**
 * Récupère les informations de l'API Forge
 */
async function getApiInfo() {
    const response = await fetch(`${CONFIG.apiUrl}/info`);
    if (!response.ok) {
        throw new Error(`API Info Error: ${response.status}`);
    }
    return await response.json();
}

/**
 * Appelle un endpoint Gradio
 */
async function callGradioApi(apiName, data) {
    const sessionHash = generateSessionHash();

    const payload = {
        data: data,
        session_hash: sessionHash
    };

    const response = await fetch(`${CONFIG.apiUrl}/api/${apiName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gradio API Error: ${response.status} - ${text}`);
    }

    return await response.json();
}

/**
 * Génère une image via l'API Forge txt2img
 * Utilise le endpoint Gradio pour la génération
 */
async function generateImageForge(prompt, negativePrompt, width, height, seed = -1) {
    const sessionHash = generateSessionHash();

    // Forge utilise un système de queue
    // On doit d'abord joindre la queue, puis récupérer le résultat

    // Les paramètres correspondent aux composants de l'UI Forge
    // L'ordre et le contenu peuvent varier selon la version
    const payload = {
        data: [
            prompt,                    // Prompt positif
            negativePrompt,            // Prompt négatif
            [],                        // Styles
            CONFIG.steps,              // Steps
            CONFIG.samplerIndex,       // Sampler index
            false,                     // Restore faces
            false,                     // Tiling
            1,                         // Batch count
            1,                         // Batch size
            CONFIG.cfgScale,           // CFG Scale
            seed,                      // Seed
            -1,                        // Variation seed
            0,                         // Variation strength
            0,                         // Resize seed from height
            0,                         // Resize seed from width
            false,                     // Checkbox
            height,                    // Height
            width,                     // Width
            false,                     // High res fix
            0.7,                       // Denoising strength
            0,                         // First pass width
            0,                         // First pass height
            0.7,                       // HR scale
            "",                        // HR upscaler
            0,                         // HR second pass steps
            0,                         // HR resize x
            0,                         // HR resize y
            [],                        // HR checkpoint
            [],                        // HR sampler
            "",                        // HR prompt
            "",                        // HR negative prompt
            "Use same checkpoint",     // HR checkpoint dropdown
            "Use same sampler",        // HR sampler dropdown
            0,                         // HR cfg scale
            0,                         // HR distilled cfg scale
            [],                        // Override settings
            [],                        // Override settings restore afterwards
            [],                        // Scripts
            [],                        // Script args
            0,                         // Main UI
            false                      // Always discard next to last sigma
        ],
        session_hash: sessionHash,
        fn_index: 0  // Index de la fonction txt2img
    };

    // Envoyer la requête à la queue
    const queueResponse = await fetch(`${CONFIG.apiUrl}/queue/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!queueResponse.ok) {
        throw new Error(`Queue join error: ${queueResponse.status}`);
    }

    // Attendre le résultat via SSE (Server-Sent Events)
    return new Promise((resolve, reject) => {
        const eventSource = new EventSource(
            `${CONFIG.apiUrl}/queue/data?session_hash=${sessionHash}`
        );

        let timeout = setTimeout(() => {
            eventSource.close();
            reject(new Error('Generation timeout'));
        }, 300000); // 5 minutes timeout

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.msg === 'process_completed') {
                clearTimeout(timeout);
                eventSource.close();

                if (data.output && data.output.data) {
                    // Les images sont dans output.data
                    const images = data.output.data[0];
                    if (images && images.length > 0) {
                        resolve({
                            image: images[0].image || images[0],
                            seed: data.output.data[1] || seed
                        });
                    } else {
                        reject(new Error('No images in response'));
                    }
                } else {
                    reject(new Error('Invalid response format'));
                }
            } else if (data.msg === 'process_failed') {
                clearTimeout(timeout);
                eventSource.close();
                reject(new Error(`Generation failed: ${JSON.stringify(data)}`));
            }
        };

        eventSource.onerror = (error) => {
            clearTimeout(timeout);
            eventSource.close();
            reject(new Error(`SSE Error: ${error.message || 'Unknown error'}`));
        };
    });
}

/**
 * Méthode alternative: utiliser /run/ endpoint directement
 */
async function generateImageForgeSimple(prompt, negativePrompt, width, height, seed = -1) {
    const sessionHash = generateSessionHash();

    // Essayer avec le endpoint /run/txt2img ou similaire
    // La structure exacte dépend de la version de Forge

    const response = await fetch(`${CONFIG.apiUrl}/run/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data: [
                prompt,
                negativePrompt,
                CONFIG.steps,
                CONFIG.cfgScale,
                width,
                height,
                seed
            ],
            session_hash: sessionHash
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Generation error: ${response.status} - ${text}`);
    }

    const result = await response.json();
    return result;
}

/**
 * Télécharge une image depuis une URL Forge
 */
async function downloadForgeImage(imageUrl) {
    // Si c'est déjà une data URL base64
    if (imageUrl.startsWith('data:')) {
        return imageUrl.split(',')[1];
    }

    // Si c'est une URL relative ou absolue
    const fullUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `${CONFIG.apiUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

    const response = await fetch(fullUrl);
    if (!response.ok) {
        throw new Error(`Image download error: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
}

/**
 * Vérifie si l'API est accessible
 */
async function checkApiConnection() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/info`, {
            method: 'GET',
            signal: AbortSignal.timeout(10000)
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// =============================================================================
// GÉNÉRATION ALTERNATIVE VIA FORMULAIRE
// =============================================================================

/**
 * Génère une image via l'API Queue de Forge
 * Utilise /queue/join avec api_name pour déclencher la génération
 */
async function generateViaQueueApi(prompt, negativePrompt, width, height, seed = -1) {
    const sessionHash = generateSessionHash();

    // Structure simplifiée - on remplit avec null et ne définit que les essentiels
    const data = new Array(137).fill(null);

    // Paramètres essentiels
    data[1] = prompt;               // Prompt
    data[2] = negativePrompt;       // Negative prompt
    data[3] = [];                   // Styles
    data[4] = 1;                    // Batch count
    data[5] = 1;                    // Batch size
    data[6] = CONFIG.cfgScale;      // CFG Scale
    data[7] = 3.5;                  // Distilled CFG Scale
    data[8] = height;               // Height
    data[9] = width;                // Width
    data[27] = CONFIG.steps;        // Sampling steps
    data[28] = "Euler";             // Sampling method (plus compatible)
    data[33] = seed;                // Seed

    // Étape 1: Joindre la queue avec api_name
    log(`Envoi à la queue Forge (session: ${sessionHash})...`, 'info');

    const joinResponse = await fetch(`${CONFIG.apiUrl}/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: data,
            fn_index: 255,  // txt2img function index in Forge
            session_hash: sessionHash
        })
    });

    if (!joinResponse.ok) {
        const text = await joinResponse.text();
        throw new Error(`Queue join error: ${joinResponse.status} - ${text}`);
    }

    const { event_id } = await joinResponse.json();
    log(`Event ID: ${event_id}, attente du résultat...`, 'info');

    // Étape 2: Écouter les événements SSE
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
            reject(new Error('Generation timeout (5 minutes)'));
        }, 300000);

        fetch(`${CONFIG.apiUrl}/queue/data?session_hash=${sessionHash}`, {
            signal: controller.signal
        }).then(async (response) => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parser les événements SSE ligne par ligne
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Garder la dernière ligne incomplète

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.msg === 'process_starts') {
                                log('Génération en cours...', 'progress');
                            }

                            if (data.msg === 'process_completed') {
                                clearTimeout(timeout);

                                if (data.success && data.output && data.output.data) {
                                    const outputData = data.output.data;
                                    // outputData[0] est la galerie d'images
                                    const gallery = outputData[0];

                                    if (Array.isArray(gallery) && gallery.length > 0) {
                                        const firstImage = gallery[0];
                                        // Forge retourne {image: {path, url, ...}, caption}
                                        let imageUrl;
                                        if (firstImage.image && firstImage.image.url) {
                                            imageUrl = firstImage.image.url;
                                        } else if (firstImage.image && firstImage.image.path) {
                                            imageUrl = firstImage.image.path;
                                        } else if (firstImage.url) {
                                            imageUrl = firstImage.url;
                                        } else if (typeof firstImage === 'string') {
                                            imageUrl = firstImage;
                                        } else {
                                            imageUrl = firstImage.image || firstImage;
                                        }

                                        log(`Image générée: ${imageUrl}`, 'success');
                                        resolve({
                                            image: imageUrl,
                                            seed: seed
                                        });
                                        return;
                                    }
                                }

                                // Vérifier s'il y a une erreur HTML dans data[3]
                                const errorHtml = data.output?.data?.[3];
                                if (errorHtml && errorHtml.includes('error')) {
                                    reject(new Error('Forge error: ' + errorHtml.slice(0, 200)));
                                    return;
                                }

                                reject(new Error('No image in response: ' + JSON.stringify(data.output?.data?.[0])));
                                return;
                            }

                            if (data.msg === 'process_failed') {
                                clearTimeout(timeout);
                                reject(new Error('Generation failed: ' + JSON.stringify(data)));
                                return;
                            }
                        } catch (e) {
                            // Ignorer les erreurs de parsing JSON
                        }
                    }
                }
            }
        }).catch(err => {
            clearTimeout(timeout);
            if (err.name !== 'AbortError') {
                reject(err);
            }
        });
    });
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

    if (CONFIG.savePrompts) {
        const promptPath = outputPath.replace('.png', '_prompt.txt');
        fs.writeFileSync(promptPath, `POSITIVE:\n${spriteConfig.prompt}\n\nNEGATIVE:\n${NEGATIVE_PROMPT}`);
    }

    const results = [];

    for (let i = 0; i < variations; i++) {
        let retries = 0;
        let success = false;

        while (retries < CONFIG.maxRetries && !success) {
            try {
                log(`Génération ${spriteConfig.id} (variation ${i + 1}/${variations})...`, 'progress');

                // Essayer différentes méthodes
                let result;

                result = await generateViaQueueApi(
                    spriteConfig.prompt,
                    NEGATIVE_PROMPT,
                    spriteConfig.width,
                    spriteConfig.height
                );

                // Télécharger/décoder l'image
                let imageData;
                if (typeof result.image === 'string') {
                    if (result.image.startsWith('data:') || result.image.startsWith('/9j/') || result.image.startsWith('iVBOR')) {
                        imageData = result.image;
                    } else {
                        imageData = await downloadForgeImage(result.image);
                    }
                } else if (result.image && result.image.url) {
                    imageData = await downloadForgeImage(result.image.url);
                } else {
                    throw new Error('Unknown image format');
                }

                const variantPath = variations > 1
                    ? outputPath.replace('.png', `_v${i + 1}.png`)
                    : outputPath;

                saveBase64Image(imageData, variantPath);

                results.push({
                    path: variantPath,
                    seed: result.seed
                });

                log(`Sauvegardé: ${variantPath}`, 'success');
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
            log('Assurez-vous que Forge WebUI est lancé', 'info');
            return;
        }
        log('Connexion API Forge OK', 'success');
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

        const percent = Math.round(((completed + failed) / sprites.length) * 100);
        log(`Progression: ${completed + failed}/${sprites.length} (${percent}%)`, 'progress');

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
║         GÉNÉRATEUR DE SPRITES - WEBUI FORGE                        ║
╚═══════════════════════════════════════════════════════════════════╝

Usage:
  node sprite-generator-forge.js [options]

Options:
  --help, -h              Affiche cette aide
  --list                  Liste tous les sprites à générer
  --stats                 Affiche les statistiques de génération
  --dry-run               Simule la génération sans appeler l'API
  --test                  Teste la connexion à l'API Forge

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
  node sprite-generator-forge.js --test
  node sprite-generator-forge.js --stats
  node sprite-generator-forge.js --list --unit infantry
  node sprite-generator-forge.js --dry-run --faction roman
  node sprite-generator-forge.js --single infantry_roman_idle_S --variations 1
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

async function testConnection() {
    log('Test de connexion à Forge WebUI...', 'info');

    try {
        const connected = await checkApiConnection();
        if (!connected) {
            log(`Impossible de se connecter à ${CONFIG.apiUrl}`, 'error');
            return;
        }
        log('Connexion OK', 'success');

        // Récupérer les infos de l'API
        const info = await getApiInfo();
        log(`API Forge détectée`, 'success');

        // Lister les endpoints disponibles
        const endpoints = Object.keys(info.named_endpoints || {});
        log(`Endpoints disponibles: ${endpoints.length}`, 'info');

        // Chercher txt2img ou similaire
        const txt2imgEndpoints = endpoints.filter(e =>
            e.toLowerCase().includes('txt2img') ||
            e.toLowerCase().includes('generate') ||
            e.toLowerCase().includes('predict')
        );

        if (txt2imgEndpoints.length > 0) {
            log(`Endpoints de génération trouvés: ${txt2imgEndpoints.join(', ')}`, 'success');
        } else {
            log('Aucun endpoint de génération standard trouvé', 'warning');
            log('Endpoints similaires:', 'info');
            endpoints.slice(0, 10).forEach(e => console.log(`  - ${e}`));
        }

    } catch (error) {
        log(`Erreur: ${error.message}`, 'error');
    }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    const args = process.argv.slice(2);

    const options = {
        help: args.includes('--help') || args.includes('-h'),
        list: args.includes('--list'),
        stats: args.includes('--stats'),
        dryRun: args.includes('--dry-run'),
        test: args.includes('--test'),
        unitType: null,
        faction: null,
        animation: null,
        singleId: null
    };

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

    if (options.help) {
        printHelp();
    } else if (options.test) {
        await testConnection();
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
    console.error(error);
    process.exit(1);
});
