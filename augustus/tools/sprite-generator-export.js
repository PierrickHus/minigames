/**
 * Export des prompts en différents formats pour utilisation externe
 *
 * Usage:
 *   node sprite-generator-export.js --json     # Export en JSON
 *   node sprite-generator-export.js --csv      # Export en CSV
 *   node sprite-generator-export.js --txt      # Export en fichiers .txt individuels
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
    NEGATIVE_PROMPT,
    generateSpriteList,
    getGenerationStats,
    GLOBAL_CONFIG
} from './sprite-generator-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = './sprites/prompts';

// =============================================================================
// EXPORT JSON
// =============================================================================

function exportToJson(outputPath = `${OUTPUT_DIR}/sprites.json`) {
    const sprites = generateSpriteList();
    const stats = getGenerationStats();

    const data = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalSprites: sprites.length,
            negativePrompt: NEGATIVE_PROMPT,
            config: GLOBAL_CONFIG,
            stats
        },
        sprites: sprites.map(s => ({
            id: s.id,
            unitType: s.unitType,
            faction: s.faction,
            animation: s.animation,
            direction: s.direction,
            filename: s.filename,
            dimensions: {
                width: s.width,
                height: s.height,
                frameWidth: s.frameWidth,
                frameHeight: s.frameHeight,
                frameCount: s.frameCount
            },
            prompt: s.prompt
        }))
    };

    ensureDir(outputPath);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ JSON exporté: ${outputPath}`);
    console.log(`   ${sprites.length} sprites`);
}

// =============================================================================
// EXPORT CSV
// =============================================================================

function exportToCsv(outputPath = `${OUTPUT_DIR}/sprites.csv`) {
    const sprites = generateSpriteList();

    const headers = [
        'id',
        'unitType',
        'faction',
        'animation',
        'direction',
        'filename',
        'width',
        'height',
        'frameWidth',
        'frameHeight',
        'frameCount',
        'prompt'
    ];

    const rows = sprites.map(s => [
        s.id,
        s.unitType,
        s.faction,
        s.animation,
        s.direction || '',
        s.filename,
        s.width,
        s.height,
        s.frameWidth,
        s.frameHeight,
        s.frameCount,
        `"${s.prompt.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    ensureDir(outputPath);
    fs.writeFileSync(outputPath, csv);
    console.log(`✅ CSV exporté: ${outputPath}`);
    console.log(`   ${sprites.length} lignes`);
}

// =============================================================================
// EXPORT TXT (fichiers individuels)
// =============================================================================

function exportToTxt(outputDir = `${OUTPUT_DIR}/individual`) {
    const sprites = generateSpriteList();

    ensureDir(`${outputDir}/placeholder.txt`);

    for (const sprite of sprites) {
        const txtPath = path.join(outputDir, sprite.filename.replace('.png', '.txt'));
        ensureDir(txtPath);

        const content = `# ${sprite.id}
# Unit: ${sprite.unitType} | Faction: ${sprite.faction} | Animation: ${sprite.animation} | Direction: ${sprite.direction || 'N/A'}
# Dimensions: ${sprite.width}x${sprite.height} (${sprite.frameCount} frames of ${sprite.frameWidth}x${sprite.frameHeight})
# Output: ${sprite.filename}

## POSITIVE PROMPT:
${sprite.prompt}

## NEGATIVE PROMPT:
${NEGATIVE_PROMPT}

## SETTINGS:
Steps: ${GLOBAL_CONFIG.steps}
CFG Scale: ${GLOBAL_CONFIG.cfgScale}
Sampler: ${GLOBAL_CONFIG.sampler}
Size: ${sprite.width}x${sprite.height}
`;

        fs.writeFileSync(txtPath, content);
    }

    console.log(`✅ TXT exportés: ${outputDir}`);
    console.log(`   ${sprites.length} fichiers`);
}

// =============================================================================
// EXPORT POUR COMFYUI (workflow JSON)
// =============================================================================

function exportToComfyUI(outputPath = `${OUTPUT_DIR}/comfyui_batch.json`) {
    const sprites = generateSpriteList();

    const workflows = sprites.map((sprite, index) => ({
        id: index,
        sprite_id: sprite.id,
        filename: sprite.filename,
        prompt: sprite.prompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: sprite.width,
        height: sprite.height,
        steps: GLOBAL_CONFIG.steps,
        cfg: GLOBAL_CONFIG.cfgScale,
        sampler: GLOBAL_CONFIG.sampler
    }));

    const data = {
        version: "1.0",
        type: "batch_generation",
        total: workflows.length,
        workflows
    };

    ensureDir(outputPath);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ ComfyUI batch exporté: ${outputPath}`);
}

// =============================================================================
// EXPORT MARKDOWN (documentation)
// =============================================================================

function exportToMarkdown(outputPath = `${OUTPUT_DIR}/SPRITES.md`) {
    const sprites = generateSpriteList();
    const stats = getGenerationStats();

    let md = `# Augustus Sprite Generation Guide

Generated: ${new Date().toISOString()}

## Statistics

- **Total sprites**: ${stats.totalSprites}
- **Estimated time**: ${stats.estimatedTime.hours} hours (at ${GLOBAL_CONFIG.variationsPerPrompt} variations each)

### By Unit Type
| Type | Count |
|------|-------|
${Object.entries(stats.byUnitType).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

### By Faction
| Faction | Count |
|---------|-------|
${Object.entries(stats.byFaction).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

### By Animation
| Animation | Count |
|-----------|-------|
${Object.entries(stats.byAnimation).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

---

## Global Negative Prompt

\`\`\`
${NEGATIVE_PROMPT}
\`\`\`

---

## Generation Settings

| Setting | Value |
|---------|-------|
| Steps | ${GLOBAL_CONFIG.steps} |
| CFG Scale | ${GLOBAL_CONFIG.cfgScale} |
| Sampler | ${GLOBAL_CONFIG.sampler} |

---

## Sprite Prompts

`;

    // Group by unit type and faction
    const grouped = {};
    for (const sprite of sprites) {
        const key = `${sprite.unitType}_${sprite.faction}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(sprite);
    }

    for (const [key, spriteGroup] of Object.entries(grouped)) {
        const [unitType, faction] = key.split('_');
        md += `### ${unitType.charAt(0).toUpperCase() + unitType.slice(1)} - ${faction.charAt(0).toUpperCase() + faction.slice(1)}\n\n`;

        for (const sprite of spriteGroup) {
            md += `#### ${sprite.animation}${sprite.direction ? ` (${sprite.direction})` : ''}\n\n`;
            md += `**ID**: \`${sprite.id}\`\n\n`;
            md += `**Dimensions**: ${sprite.width}x${sprite.height} (${sprite.frameCount} frames)\n\n`;
            md += `**Prompt**:\n\`\`\`\n${sprite.prompt}\n\`\`\`\n\n`;
            md += `---\n\n`;
        }
    }

    ensureDir(outputPath);
    fs.writeFileSync(outputPath, md);
    console.log(`✅ Markdown exporté: ${outputPath}`);
}

// =============================================================================
// UTILITAIRES
// =============================================================================

function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║              EXPORT DES PROMPTS - MULTIPLE FORMATS                 ║
╚═══════════════════════════════════════════════════════════════════╝

Usage:
  node sprite-generator-export.js [format]

Formats:
  --json          Export en JSON (sprites.json)
  --csv           Export en CSV (sprites.csv)
  --txt           Export en fichiers .txt individuels
  --comfyui       Export pour ComfyUI batch
  --markdown      Export documentation Markdown
  --all           Export tous les formats

Exemples:
  node sprite-generator-export.js --json
  node sprite-generator-export.js --all
`);
        return;
    }

    const exportAll = args.includes('--all');

    if (exportAll || args.includes('--json')) {
        exportToJson();
    }

    if (exportAll || args.includes('--csv')) {
        exportToCsv();
    }

    if (exportAll || args.includes('--txt')) {
        exportToTxt();
    }

    if (exportAll || args.includes('--comfyui')) {
        exportToComfyUI();
    }

    if (exportAll || args.includes('--markdown')) {
        exportToMarkdown();
    }

    console.log('\n🎉 Export terminé!');
}

main();
