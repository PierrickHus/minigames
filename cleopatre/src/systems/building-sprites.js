// ==========================================
// SYSTÈME DE SPRITES MODULAIRES POUR BÂTIMENTS
// ==========================================
// Ce système dessine les bâtiments case par case en adaptant
// le visuel selon la position relative de chaque case dans le bâtiment.
// Utilise un système d'auto-tiling basé sur les voisins.
// ==========================================

import { BUILDINGS } from '../data/index.js';

/**
 * Bitmask pour les directions des voisins
 * Utilisé pour déterminer quel sprite afficher
 */
const NEIGHBOR = {
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 4,
    LEFT: 8
};

/**
 * Palettes de couleurs pour chaque type de bâtiment
 * Chaque palette contient: base, light, dark, accent, roof
 */
const BUILDING_PALETTES = {
    // TIER 1
    hut: {
        base: '#a08060',
        light: '#c0a080',
        dark: '#705030',
        accent: '#d4a574',
        roof: '#8b6914'
    },
    house: {
        base: '#d4a574',
        light: '#e8c9a0',
        dark: '#a07850',
        accent: '#c41e3a',
        roof: '#8b4513'
    },
    well: {
        base: '#808080',
        light: '#a0a0a0',
        dark: '#505050',
        accent: '#4a90c2',
        roof: '#606060'
    },
    field: {
        base: '#8b7355',
        light: '#a08868',
        dark: '#6b5335',
        accent: '#daa520',
        roof: '#556b2f'
    },
    farm: {
        base: '#d4a574',
        light: '#e8c9a0',
        dark: '#a07850',
        accent: '#8b4513',
        roof: '#654321'
    },
    cistern: {
        base: '#a08868',
        light: '#c0a888',
        dark: '#806848',
        accent: '#4a90c2',
        roof: '#8b7355'
    },
    granary: {
        base: '#c9a66b',
        light: '#e0c090',
        dark: '#a08050',
        accent: '#daa520',
        roof: '#8b6914'
    },
    workshop: {
        base: '#8b7355',
        light: '#a08868',
        dark: '#6b5335',
        accent: '#cd853f',
        roof: '#654321'
    },
    aviary: {
        base: '#f5f5dc',
        light: '#fffff0',
        dark: '#d4c4a8',
        accent: '#87ceeb',
        roof: '#deb887'
    },
    bakery: {
        base: '#d4a574',
        light: '#f5deb3',
        dark: '#a07850',
        accent: '#ff6347',
        roof: '#8b4513'
    },

    // TIER 2
    inn: {
        base: '#8b4513',
        light: '#a0522d',
        dark: '#5c3317',
        accent: '#ffd700',
        roof: '#4a3728'
    },
    market: {
        base: '#daa520',
        light: '#ffd700',
        dark: '#b8860b',
        accent: '#c41e3a',
        roof: '#cd853f'
    },
    quarry: {
        base: '#808080',
        light: '#a0a0a0',
        dark: '#505050',
        accent: '#c0c0c0',
        roof: '#696969'
    },
    lumbermill: {
        base: '#8b4513',
        light: '#a0522d',
        dark: '#5c3317',
        accent: '#228b22',
        roof: '#3c2415'
    },
    obelisk: {
        base: '#f5f5dc',
        light: '#fffaf0',
        dark: '#d4c4a8',
        accent: '#ffd700',
        roof: '#deb887'
    },
    barracks: {
        base: '#8b0000',
        light: '#b22222',
        dark: '#5c0000',
        accent: '#c0c0c0',
        roof: '#4a0000'
    },
    temple: {
        base: '#f5f5dc',
        light: '#fffaf0',
        dark: '#d4c4a8',
        accent: '#ffd700',
        roof: '#daa520'
    },
    villa: {
        base: '#ffe4c4',
        light: '#fff8dc',
        dark: '#deb887',
        accent: '#8b0000',
        roof: '#cd853f'
    },
    baths: {
        base: '#e0e0e0',
        light: '#f5f5f5',
        dark: '#c0c0c0',
        accent: '#4a90c2',
        roof: '#b8b8b8'
    },
    library: {
        base: '#deb887',
        light: '#f5deb3',
        dark: '#bc9060',
        accent: '#8b4513',
        roof: '#a0522d'
    },
    harbor: {
        base: '#8b7355',
        light: '#a08868',
        dark: '#6b5335',
        accent: '#4a90c2',
        roof: '#5c4033'
    },
    gardens: {
        base: '#228b22',
        light: '#32cd32',
        dark: '#006400',
        accent: '#ff69b4',
        roof: '#2e8b57'
    },

    // TIER 3
    pyramid: {
        base: '#f5deb3',
        light: '#fff8dc',
        dark: '#daa520',
        accent: '#ffd700',
        roof: '#b8860b'
    },
    palace: {
        base: '#ffd700',
        light: '#ffec8b',
        dark: '#b8860b',
        accent: '#800080',
        roof: '#cd853f'
    },
    coliseum: {
        base: '#d4c4a8',
        light: '#f5f5dc',
        dark: '#b8a888',
        accent: '#8b0000',
        roof: '#a08868'
    },
    sphinx: {
        base: '#f5deb3',
        light: '#fff8dc',
        dark: '#daa520',
        accent: '#4169e1',
        roof: '#b8860b'
    },
    academy: {
        base: '#f5f5dc',
        light: '#fffaf0',
        dark: '#d4c4a8',
        accent: '#4169e1',
        roof: '#deb887'
    },
    grand_temple: {
        base: '#ffd700',
        light: '#ffec8b',
        dark: '#b8860b',
        accent: '#ff4500',
        roof: '#cd7f32'
    }
};

/**
 * Classe principale pour le rendu des sprites de bâtiments
 */
class BuildingSprites {
    constructor(tileSize = 26) {
        this.tileSize = tileSize;
        this.spriteCache = new Map();
    }

    /**
     * Détermine les voisins d'une case dans une shape
     * @param {number[][]} shape - Matrice de la forme du bâtiment
     * @param {number} x - Position X dans la shape
     * @param {number} y - Position Y dans la shape
     * @returns {number} Bitmask des voisins
     */
    getNeighborMask(shape, x, y) {
        let mask = 0;

        // Vérifier chaque direction
        if (y > 0 && shape[y - 1]?.[x] === 1) mask |= NEIGHBOR.TOP;
        if (shape[y]?.[x + 1] === 1) mask |= NEIGHBOR.RIGHT;
        if (shape[y + 1]?.[x] === 1) mask |= NEIGHBOR.BOTTOM;
        if (shape[y]?.[x - 1] === 1) mask |= NEIGHBOR.LEFT;

        return mask;
    }

    /**
     * Détermine le type de case selon ses voisins
     * @param {number} mask - Bitmask des voisins
     * @returns {string} Type de case (corner_tl, edge_t, center, etc.)
     */
    getTileType(mask) {
        const hasTop = (mask & NEIGHBOR.TOP) !== 0;
        const hasRight = (mask & NEIGHBOR.RIGHT) !== 0;
        const hasBottom = (mask & NEIGHBOR.BOTTOM) !== 0;
        const hasLeft = (mask & NEIGHBOR.LEFT) !== 0;

        // Case isolée (1x1)
        if (mask === 0) return 'single';

        // Coins
        if (!hasTop && !hasLeft && hasRight && hasBottom) return 'corner_tl';
        if (!hasTop && !hasRight && hasLeft && hasBottom) return 'corner_tr';
        if (!hasBottom && !hasLeft && hasRight && hasTop) return 'corner_bl';
        if (!hasBottom && !hasRight && hasLeft && hasTop) return 'corner_br';

        // Bords
        if (!hasTop && hasBottom) return 'edge_t';
        if (!hasBottom && hasTop) return 'edge_b';
        if (!hasLeft && hasRight) return 'edge_l';
        if (!hasRight && hasLeft) return 'edge_r';

        // Terminaisons (bout de ligne)
        if (hasTop && !hasRight && !hasBottom && !hasLeft) return 'end_b';
        if (!hasTop && hasRight && !hasBottom && !hasLeft) return 'end_l';
        if (!hasTop && !hasRight && hasBottom && !hasLeft) return 'end_t';
        if (!hasTop && !hasRight && !hasBottom && hasLeft) return 'end_r';

        // Centre
        return 'center';
    }

    /**
     * Dessine une case de bâtiment
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} buildingId - ID du type de bâtiment
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     * @param {string} tileType - Type de case (corner_tl, edge_t, center, etc.)
     * @param {boolean} constructing - En construction ou non
     */
    drawTile(ctx, buildingId, x, y, tileType, constructing = false) {
        const palette = BUILDING_PALETTES[buildingId] || BUILDING_PALETTES.house;
        const size = this.tileSize;
        const padding = 1;
        const innerSize = size - padding * 2;

        ctx.save();

        if (constructing) {
            ctx.globalAlpha = 0.5;
        }

        // Appeler le renderer spécifique au bâtiment
        const renderer = this.getBuildingRenderer(buildingId);
        renderer.call(this, ctx, x + padding, y + padding, innerSize, tileType, palette);

        ctx.restore();
    }

    /**
     * Retourne le renderer approprié pour un type de bâtiment
     * @param {string} buildingId - ID du bâtiment
     * @returns {Function} Fonction de rendu
     */
    getBuildingRenderer(buildingId) {
        const renderers = {
            // Tier 1
            hut: this.renderHut,
            house: this.renderHouse,
            well: this.renderWell,
            field: this.renderField,
            farm: this.renderFarm,
            cistern: this.renderCistern,
            granary: this.renderGranary,
            workshop: this.renderWorkshop,
            aviary: this.renderAviary,
            bakery: this.renderBakery,

            // Tier 2
            inn: this.renderInn,
            market: this.renderMarket,
            quarry: this.renderQuarry,
            lumbermill: this.renderLumbermill,
            obelisk: this.renderObelisk,
            barracks: this.renderBarracks,
            temple: this.renderTemple,
            villa: this.renderVilla,
            baths: this.renderBaths,
            library: this.renderLibrary,
            harbor: this.renderHarbor,
            gardens: this.renderGardens,

            // Tier 3
            pyramid: this.renderPyramid,
            palace: this.renderPalace,
            coliseum: this.renderColiseum,
            sphinx: this.renderSphinx,
            academy: this.renderAcademy,
            grand_temple: this.renderGrandTemple
        };

        return renderers[buildingId] || this.renderGeneric;
    }

    // ==========================================
    // UTILITAIRES DE DESSIN
    // ==========================================

    /**
     * Dessine un mur/base avec bordures adaptatives
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} size - Taille de la case
     * @param {string} tileType - Type de case
     * @param {object} palette - Palette de couleurs
     * @param {number} borderWidth - Largeur de bordure
     */
    drawAdaptiveWall(ctx, x, y, size, tileType, palette, borderWidth = 2) {
        // Fond principal
        ctx.fillStyle = palette.base;
        ctx.fillRect(x, y, size, size);

        // Bordures selon le type de case
        ctx.fillStyle = palette.dark;
        const bw = borderWidth;

        // Bordure haute (si pas de voisin en haut)
        if (['single', 'corner_tl', 'corner_tr', 'edge_t', 'end_t', 'end_l', 'end_r'].includes(tileType)) {
            ctx.fillRect(x, y, size, bw);
        }

        // Bordure basse (si pas de voisin en bas)
        if (['single', 'corner_bl', 'corner_br', 'edge_b', 'end_b', 'end_l', 'end_r'].includes(tileType)) {
            ctx.fillRect(x, y + size - bw, size, bw);
        }

        // Bordure gauche (si pas de voisin à gauche)
        if (['single', 'corner_tl', 'corner_bl', 'edge_l', 'end_l', 'end_t', 'end_b'].includes(tileType)) {
            ctx.fillRect(x, y, bw, size);
        }

        // Bordure droite (si pas de voisin à droite)
        if (['single', 'corner_tr', 'corner_br', 'edge_r', 'end_r', 'end_t', 'end_b'].includes(tileType)) {
            ctx.fillRect(x + size - bw, y, bw, size);
        }

        // Effet de lumière (coins internes pour l'effet 3D)
        ctx.fillStyle = palette.light;
        if (['single', 'corner_tl', 'edge_t', 'edge_l', 'end_t', 'end_l'].includes(tileType)) {
            ctx.fillRect(x + bw, y + bw, bw, bw);
        }
    }

    /**
     * Dessine un toit triangulaire/angulaire
     */
    drawRoof(ctx, x, y, size, tileType, palette) {
        const roofHeight = size * 0.35;

        ctx.fillStyle = palette.roof;

        // Toit selon la position
        if (['single', 'corner_tl', 'corner_tr', 'edge_t', 'end_t'].includes(tileType)) {
            ctx.beginPath();
            ctx.moveTo(x, y + roofHeight);
            ctx.lineTo(x + size / 2, y);
            ctx.lineTo(x + size, y + roofHeight);
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * Dessine une fenêtre
     */
    drawWindow(ctx, x, y, width, height, palette) {
        // Cadre
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

        // Vitre
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(x, y, width, height);

        // Reflet
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x, y, width * 0.4, height * 0.4);
    }

    /**
     * Dessine une porte
     */
    drawDoor(ctx, x, y, width, height, palette) {
        // Cadre
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x - 1, y, width + 2, height + 1);

        // Porte
        ctx.fillStyle = palette.accent;
        ctx.fillRect(x, y, width, height);

        // Poignée
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + width * 0.8, y + height * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==========================================
    // RENDERERS SPÉCIFIQUES PAR BÂTIMENT
    // ==========================================

    /**
     * Hutte - Simple abri en terre/paille
     */
    renderHut(ctx, x, y, size, tileType, palette) {
        // Base circulaire
        ctx.fillStyle = palette.base;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size * 0.6, size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Bordure
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Toit en paille (cône)
        ctx.fillStyle = palette.roof;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.1, y + size * 0.5);
        ctx.lineTo(x + size / 2, y - size * 0.1);
        ctx.lineTo(x + size * 0.9, y + size * 0.5);
        ctx.closePath();
        ctx.fill();

        // Texture paille
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            const startX = x + size * 0.2 + i * size * 0.15;
            ctx.beginPath();
            ctx.moveTo(startX, y + size * 0.45 - i * 2);
            ctx.lineTo(x + size / 2, y);
            ctx.stroke();
        }

        // Entrée
        ctx.fillStyle = '#3d2914';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size * 0.75, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Maison - Habitation classique en briques
     */
    renderHouse(ctx, x, y, size, tileType, palette) {
        this.drawAdaptiveWall(ctx, x, y + size * 0.3, size, tileType, palette);

        // Toit
        if (['single', 'corner_tl', 'corner_tr', 'edge_t', 'end_t', 'end_l', 'end_r'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 2, y + size * 0.35);
            ctx.lineTo(x + size / 2, y);
            ctx.lineTo(x + size + 2, y + size * 0.35);
            ctx.closePath();
            ctx.fill();

            // Bordure toit
            ctx.strokeStyle = palette.dark;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Fenêtre (au centre ou selon position)
        if (['single', 'corner_tl', 'edge_l', 'end_l'].includes(tileType)) {
            this.drawWindow(ctx, x + size * 0.35, y + size * 0.45, size * 0.3, size * 0.25, palette);
        }

        // Porte (en bas)
        if (['single', 'corner_bl', 'edge_b', 'end_b'].includes(tileType)) {
            this.drawDoor(ctx, x + size * 0.35, y + size * 0.65, size * 0.3, size * 0.35, palette);
        }
    }

    /**
     * Puits - Structure circulaire en pierre
     */
    renderWell(ctx, x, y, size, tileType, palette) {
        // Base en pierre
        ctx.fillStyle = palette.base;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Bordure
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Trou d'eau au centre
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Reflet dans l'eau
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(x + size * 0.4, y + size * 0.4, size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Petit toit/poulie
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x + size * 0.25, y, size * 0.5, 3);

        // Poteaux
        ctx.fillRect(x + size * 0.25, y, 2, size * 0.35);
        ctx.fillRect(x + size * 0.73, y, 2, size * 0.35);
    }

    /**
     * Champ - Zone de culture
     */
    renderField(ctx, x, y, size, tileType, palette) {
        // Sol labouré
        ctx.fillStyle = palette.base;
        ctx.fillRect(x, y, size, size);

        // Sillons
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const yPos = y + 3 + i * (size - 6) / 4;
            ctx.beginPath();
            ctx.moveTo(x + 2, yPos);
            ctx.lineTo(x + size - 2, yPos);
            ctx.stroke();
        }

        // Plantes (blé)
        ctx.fillStyle = '#90EE90';
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const px = x + 4 + col * (size - 8) / 3;
                const py = y + 6 + row * (size - 8) / 3;

                // Tige
                ctx.fillRect(px, py, 1, 4);

                // Épi
                ctx.fillStyle = palette.accent;
                ctx.beginPath();
                ctx.ellipse(px + 0.5, py - 1, 1.5, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#90EE90';
            }
        }
    }

    /**
     * Ferme - Bâtiment agricole avec enclos
     */
    renderFarm(ctx, x, y, size, tileType, palette) {
        // Sol/enclos
        ctx.fillStyle = '#c9a66b';
        ctx.fillRect(x, y, size, size);

        // Bordure d'enclos
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 2;

        // Dessiner les clôtures selon les bords exposés
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.beginPath();
            ctx.moveTo(x, y + 1);
            ctx.lineTo(x + size, y + 1);
            ctx.stroke();
        }
        if (['single', 'corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.beginPath();
            ctx.moveTo(x, y + size - 1);
            ctx.lineTo(x + size, y + size - 1);
            ctx.stroke();
        }
        if (['single', 'corner_tl', 'corner_bl', 'edge_l'].includes(tileType)) {
            ctx.beginPath();
            ctx.moveTo(x + 1, y);
            ctx.lineTo(x + 1, y + size);
            ctx.stroke();
        }
        if (['single', 'corner_tr', 'corner_br', 'edge_r'].includes(tileType)) {
            ctx.beginPath();
            ctx.moveTo(x + size - 1, y);
            ctx.lineTo(x + size - 1, y + size);
            ctx.stroke();
        }

        // Petit bâtiment (sur la case en haut à gauche)
        if (['single', 'corner_tl'].includes(tileType)) {
            ctx.fillStyle = palette.base;
            ctx.fillRect(x + 3, y + 3, size * 0.6, size * 0.5);
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 3 + size * 0.5);
            ctx.lineTo(x + 3 + size * 0.3, y);
            ctx.lineTo(x + 4 + size * 0.6, y + 3 + size * 0.5);
            ctx.closePath();
            ctx.fill();
        }

        // Animaux ou végétation sur les autres cases
        if (!['corner_tl'].includes(tileType) || tileType === 'single') {
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🐔', x + size / 2, y + size * 0.6);
        }
    }

    /**
     * Citerne - Réservoir d'eau
     */
    renderCistern(ctx, x, y, size, tileType, palette) {
        // Structure rectangulaire
        this.drawAdaptiveWall(ctx, x, y, size, tileType, palette, 3);

        // Surface d'eau
        ctx.fillStyle = palette.accent;
        ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

        // Vagues
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 8 + i * 5);
            ctx.quadraticCurveTo(x + size / 2, y + 6 + i * 5, x + size - 5, y + 8 + i * 5);
            ctx.stroke();
        }
    }

    /**
     * Grenier - Stockage de grains
     */
    renderGranary(ctx, x, y, size, tileType, palette) {
        // Base
        this.drawAdaptiveWall(ctx, x, y + size * 0.2, size, tileType, palette);

        // Toit pointu (si bord haut)
        if (['single', 'corner_tl', 'corner_tr', 'edge_t', 'end_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 1, y + size * 0.25);
            ctx.lineTo(x + size / 2, y - size * 0.1);
            ctx.lineTo(x + size + 1, y + size * 0.25);
            ctx.closePath();
            ctx.fill();
        }

        // Porte de grange (sur bord bas)
        if (['single', 'corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.moveTo(x + size * 0.2, y + size);
            ctx.lineTo(x + size * 0.2, y + size * 0.5);
            ctx.lineTo(x + size / 2, y + size * 0.35);
            ctx.lineTo(x + size * 0.8, y + size * 0.5);
            ctx.lineTo(x + size * 0.8, y + size);
            ctx.closePath();
            ctx.fill();
        }

        // Grains visibles
        ctx.fillStyle = '#f4a460';
        if (['single', 'center', 'edge_l', 'edge_r'].includes(tileType)) {
            for (let i = 0; i < 8; i++) {
                const gx = x + 5 + Math.random() * (size - 10);
                const gy = y + size * 0.4 + Math.random() * (size * 0.4);
                ctx.beginPath();
                ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Atelier - Lieu de fabrication
     */
    renderWorkshop(ctx, x, y, size, tileType, palette) {
        // Structure
        this.drawAdaptiveWall(ctx, x, y + size * 0.15, size, tileType, palette);

        // Toit plat avec auvent
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.fillRect(x - 2, y + size * 0.15, size + 4, size * 0.12);
        }

        // Établi/outils
        if (['single', 'corner_tl', 'edge_l'].includes(tileType)) {
            // Établi
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x + 3, y + size * 0.5, size * 0.5, size * 0.15);

            // Outils accrochés
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(x + size * 0.7, y + size * 0.35, 2, 8);
            ctx.fillRect(x + size * 0.8, y + size * 0.35, 2, 6);
        }

        // Grande ouverture/porte
        if (['single', 'corner_bl', 'edge_b', 'end_b'].includes(tileType)) {
            ctx.fillStyle = '#3d2914';
            ctx.fillRect(x + size * 0.15, y + size * 0.55, size * 0.7, size * 0.45);
        }
    }

    /**
     * Volière - Cage à oiseaux
     */
    renderAviary(ctx, x, y, size, tileType, palette) {
        // Structure en dôme/cage
        ctx.fillStyle = palette.base;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size * 0.6, size * 0.42, 0, Math.PI, true);
        ctx.lineTo(x + size * 0.08, y + size * 0.95);
        ctx.lineTo(x + size * 0.92, y + size * 0.95);
        ctx.closePath();
        ctx.fill();

        // Barreaux
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const bx = x + size * 0.2 + i * size * 0.15;
            ctx.beginPath();
            ctx.moveTo(bx, y + size * 0.25);
            ctx.lineTo(bx, y + size * 0.9);
            ctx.stroke();
        }

        // Toit en dôme
        ctx.fillStyle = palette.roof;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size * 0.35, size * 0.35, Math.PI, 0);
        ctx.fill();

        // Oiseau
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🕊️', x + size / 2, y + size * 0.65);
    }

    /**
     * Boulangerie - Four à pain
     */
    renderBakery(ctx, x, y, size, tileType, palette) {
        // Structure
        this.drawAdaptiveWall(ctx, x, y + size * 0.25, size, tileType, palette);

        // Cheminée/four (bord haut)
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            // Four en forme de dôme
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size * 0.3, size * 0.35, Math.PI, 0);
            ctx.fill();

            // Bouche du four
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size * 0.35, size * 0.15, Math.PI, 0);
            ctx.fill();

            // Flammes
            ctx.fillStyle = '#ff4500';
            ctx.beginPath();
            ctx.moveTo(x + size * 0.4, y + size * 0.35);
            ctx.lineTo(x + size / 2, y + size * 0.2);
            ctx.lineTo(x + size * 0.6, y + size * 0.35);
            ctx.fill();
        }

        // Étal de pains (bord bas)
        if (['single', 'corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = '#deb887';
            ctx.fillRect(x + 3, y + size * 0.7, size - 6, size * 0.25);

            // Pains
            ctx.fillStyle = '#d2691e';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(x + 6 + i * 7, y + size * 0.8, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Auberge - Lieu de repos
     */
    renderInn(ctx, x, y, size, tileType, palette) {
        // Structure en bois
        this.drawAdaptiveWall(ctx, x, y + size * 0.25, size, tileType, palette);

        // Toit (si bord haut)
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 2, y + size * 0.3);
            ctx.lineTo(x + size / 2, y - size * 0.05);
            ctx.lineTo(x + size + 2, y + size * 0.3);
            ctx.closePath();
            ctx.fill();
        }

        // Enseigne (coin haut gauche)
        if (['corner_tl', 'single'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x + size * 0.7, y + size * 0.35, size * 0.2, size * 0.15);
            ctx.font = '8px Arial';
            ctx.fillText('🍺', x + size * 0.8, y + size * 0.48);
        }

        // Fenêtres illuminées
        if (['center', 'edge_l', 'edge_r', 'corner_bl', 'corner_br'].includes(tileType)) {
            ctx.fillStyle = '#ffd700';
            ctx.globalAlpha = 0.7;
            this.drawWindow(ctx, x + size * 0.3, y + size * 0.45, size * 0.15, size * 0.2, palette);
            this.drawWindow(ctx, x + size * 0.55, y + size * 0.45, size * 0.15, size * 0.2, palette);
            ctx.globalAlpha = 1;
        }

        // Porte (coin bas)
        if (['corner_bl', 'single'].includes(tileType)) {
            this.drawDoor(ctx, x + size * 0.35, y + size * 0.6, size * 0.3, size * 0.4, palette);
        }
    }

    /**
     * Marché - Place de commerce
     */
    renderMarket(ctx, x, y, size, tileType, palette) {
        // Sol pavé
        ctx.fillStyle = '#c9a66b';
        ctx.fillRect(x, y, size, size);

        // Motif pavé
        ctx.strokeStyle = '#a08050';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.strokeRect(x + 2 + i * 8, y + 2 + j * 8, 7, 7);
            }
        }

        // Étal avec tissu coloré
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + size * 0.4);
        ctx.lineTo(x + size - 2, y + size * 0.4);
        ctx.lineTo(x + size - 2, y + size * 0.25);
        ctx.lineTo(x + 2, y + size * 0.25);
        ctx.closePath();
        ctx.fill();

        // Auvent
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.base;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x + size - 3, y + size * 0.2);
            ctx.lineTo(x + 3, y + size * 0.2);
            ctx.closePath();
            ctx.fill();

            // Rayures
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 3 + i * 6, y + 2);
                ctx.lineTo(x + 5 + i * 6, y + size * 0.18);
                ctx.stroke();
            }
        }

        // Marchandises
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        const goods = ['🍎', '🧀', '🍞', '🥕'];
        goods.forEach((g, i) => {
            ctx.fillText(g, x + 5 + i * 6, y + size * 0.35);
        });
    }

    /**
     * Carrière - Extraction de pierre
     */
    renderQuarry(ctx, x, y, size, tileType, palette) {
        // Fosse/trou
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x, y, size, size);

        // Bords rocheux
        ctx.fillStyle = palette.base;

        // Dessiner les bords exposés comme des rochers
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(x + 3 + i * 6, y + 3, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (['single', 'corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(x + 3 + i * 6, y + size - 3, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Pierres extraites
        ctx.fillStyle = palette.light;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y + size * 0.4);
        ctx.lineTo(x + size * 0.5, y + size * 0.3);
        ctx.lineTo(x + size * 0.7, y + size * 0.45);
        ctx.lineTo(x + size * 0.6, y + size * 0.6);
        ctx.lineTo(x + size * 0.35, y + size * 0.55);
        ctx.closePath();
        ctx.fill();

        // Outil (pioche)
        if (['single', 'corner_tl'].includes(tileType)) {
            ctx.font = '10px Arial';
            ctx.fillText('⛏️', x + size * 0.75, y + size * 0.8);
        }
    }

    /**
     * Scierie - Transformation du bois
     */
    renderLumbermill(ctx, x, y, size, tileType, palette) {
        // Structure en bois
        this.drawAdaptiveWall(ctx, x, y + size * 0.2, size, tileType, palette);

        // Toit
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.fillRect(x - 2, y + size * 0.15, size + 4, size * 0.1);
        }

        // Roue à eau (côté)
        if (['single', 'corner_tl', 'corner_bl', 'edge_l'].includes(tileType)) {
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 3, y + size * 0.6, size * 0.2, 0, Math.PI * 2);
            ctx.stroke();

            // Rayons
            for (let i = 0; i < 4; i++) {
                const angle = i * Math.PI / 2 + Date.now() / 1000;
                ctx.beginPath();
                ctx.moveTo(x + 3, y + size * 0.6);
                ctx.lineTo(
                    x + 3 + Math.cos(angle) * size * 0.2,
                    y + size * 0.6 + Math.sin(angle) * size * 0.2
                );
                ctx.stroke();
            }
        }

        // Bûches empilées
        if (['single', 'corner_br', 'edge_r', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = '#8b4513';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2 - i; j++) {
                    ctx.beginPath();
                    ctx.arc(x + size * 0.7 + j * 5, y + size * 0.85 - i * 4, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#5c3317';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Obélisque - Monument vertical
     */
    renderObelisk(ctx, x, y, size, tileType, palette) {
        const isTop = ['single', 'corner_tl', 'corner_tr', 'edge_t', 'end_t'].includes(tileType);
        const isBottom = ['corner_bl', 'corner_br', 'edge_b', 'end_b'].includes(tileType);

        // Base si en bas
        if (isBottom || tileType === 'single') {
            ctx.fillStyle = palette.dark;
            ctx.fillRect(x + size * 0.1, y + size * 0.7, size * 0.8, size * 0.3);
        }

        // Corps de l'obélisque
        ctx.fillStyle = palette.base;
        const topWidth = isTop ? size * 0.15 : size * 0.35;
        const bottomWidth = isBottom ? size * 0.35 : size * 0.35;

        ctx.beginPath();
        ctx.moveTo(x + size / 2 - bottomWidth, y + size);
        ctx.lineTo(x + size / 2 - topWidth, y);
        ctx.lineTo(x + size / 2 + topWidth, y);
        ctx.lineTo(x + size / 2 + bottomWidth, y + size);
        ctx.closePath();
        ctx.fill();

        // Pointe dorée (si top)
        if (isTop) {
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.moveTo(x + size / 2, y - size * 0.1);
            ctx.lineTo(x + size / 2 - size * 0.1, y + size * 0.15);
            ctx.lineTo(x + size / 2 + size * 0.1, y + size * 0.15);
            ctx.closePath();
            ctx.fill();
        }

        // Hiéroglyphes
        ctx.fillStyle = palette.accent;
        ctx.font = '6px Arial';
        ctx.textAlign = 'center';
        const symbols = ['𓂀', '𓃭', '𓆣', '𓇋'];
        symbols.forEach((s, i) => {
            if (i < 2 || !isTop) {
                ctx.fillText(s, x + size / 2, y + size * 0.3 + i * 5);
            }
        });
    }

    /**
     * Caserne - Bâtiment militaire
     */
    renderBarracks(ctx, x, y, size, tileType, palette) {
        // Structure fortifiée
        this.drawAdaptiveWall(ctx, x, y, size, tileType, palette, 3);

        // Créneaux (si bord haut)
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.base;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + 2 + i * 6, y - 3, 4, 5);
            }
        }

        // Bannière (coin)
        if (['corner_tl', 'single'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x + size * 0.75, y + 5, 2, size * 0.4);
            ctx.beginPath();
            ctx.moveTo(x + size * 0.77, y + 5);
            ctx.lineTo(x + size * 0.95, y + 10);
            ctx.lineTo(x + size * 0.77, y + 15);
            ctx.fill();
        }

        // Boucliers/armes accrochés
        if (['center', 'edge_l', 'edge_r'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size * 0.5, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = palette.light;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Porte fortifiée (bord bas)
        if (['corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = '#3d2914';
            ctx.fillRect(x + size * 0.25, y + size * 0.5, size * 0.5, size * 0.5);

            // Grille
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x + size * 0.35 + i * 4, y + size * 0.5);
                ctx.lineTo(x + size * 0.35 + i * 4, y + size);
                ctx.stroke();
            }
        }
    }

    /**
     * Temple - Lieu de culte
     */
    renderTemple(ctx, x, y, size, tileType, palette) {
        // Colonnes et structure
        const isTop = ['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType);
        const isBottom = ['corner_bl', 'corner_br', 'edge_b'].includes(tileType);

        // Sol en marbre
        ctx.fillStyle = palette.light;
        ctx.fillRect(x, y, size, size);

        // Colonnes
        ctx.fillStyle = palette.base;
        if (['single', 'corner_tl', 'corner_bl', 'edge_l'].includes(tileType)) {
            ctx.fillRect(x + 2, y + (isTop ? size * 0.3 : 0), 4, size * (isTop ? 0.7 : (isBottom ? 0.7 : 1)));
        }
        if (['single', 'corner_tr', 'corner_br', 'edge_r'].includes(tileType)) {
            ctx.fillRect(x + size - 6, y + (isTop ? size * 0.3 : 0), 4, size * (isTop ? 0.7 : (isBottom ? 0.7 : 1)));
        }

        // Fronton triangulaire (si top)
        if (isTop) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 2, y + size * 0.35);
            ctx.lineTo(x + size / 2, y);
            ctx.lineTo(x + size + 2, y + size * 0.35);
            ctx.closePath();
            ctx.fill();

            // Décoration du fronton
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size * 0.2, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Escaliers (si bottom)
        if (isBottom) {
            ctx.fillStyle = palette.dark;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + 2 - i, y + size - 4 - i * 3, size - 4 + i * 2, 2);
            }
        }

        // Autel/statue au centre
        if (tileType === 'center' || tileType === 'single') {
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x + size * 0.35, y + size * 0.4, size * 0.3, size * 0.4);
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏺', x + size / 2, y + size * 0.55);
        }
    }

    /**
     * Villa - Grande résidence
     */
    renderVilla(ctx, x, y, size, tileType, palette) {
        // Structure principale
        this.drawAdaptiveWall(ctx, x, y + size * 0.2, size, tileType, palette);

        // Toit en tuiles
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 3, y + size * 0.25);
            ctx.lineTo(x + size / 2, y - size * 0.05);
            ctx.lineTo(x + size + 3, y + size * 0.25);
            ctx.closePath();
            ctx.fill();

            // Tuiles
            ctx.strokeStyle = palette.dark;
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 3 + i * 5, y + size * 0.2 - i);
                ctx.lineTo(x + size / 2, y + size * 0.05);
                ctx.stroke();
            }
        }

        // Balcon/terrasse (côtés)
        if (['edge_l', 'edge_r', 'center'].includes(tileType)) {
            ctx.fillStyle = palette.light;
            ctx.fillRect(x + 2, y + size * 0.35, size - 4, 3);
        }

        // Fenêtres décorées
        if (['single', 'corner_tl', 'corner_tr', 'edge_t', 'center'].includes(tileType)) {
            ctx.fillStyle = '#87ceeb';
            ctx.fillRect(x + size * 0.25, y + size * 0.4, size * 0.2, size * 0.25);
            ctx.fillRect(x + size * 0.55, y + size * 0.4, size * 0.2, size * 0.25);

            // Rideaux
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x + size * 0.25, y + size * 0.4, size * 0.05, size * 0.25);
            ctx.fillRect(x + size * 0.55, y + size * 0.4, size * 0.05, size * 0.25);
        }

        // Entrée avec colonnes (bas)
        if (['corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = palette.light;
            ctx.fillRect(x + size * 0.2, y + size * 0.5, 3, size * 0.5);
            ctx.fillRect(x + size * 0.77, y + size * 0.5, 3, size * 0.5);

            this.drawDoor(ctx, x + size * 0.35, y + size * 0.6, size * 0.3, size * 0.4, palette);
        }
    }

    /**
     * Thermes - Bains publics
     */
    renderBaths(ctx, x, y, size, tileType, palette) {
        // Sol en marbre
        ctx.fillStyle = palette.base;
        ctx.fillRect(x, y, size, size);

        // Bordure décorative
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 2;

        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.beginPath();
            ctx.moveTo(x, y + 2);
            ctx.lineTo(x + size, y + 2);
            ctx.stroke();
        }

        // Bassin d'eau
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, size - 8, size - 8, 3);
        ctx.fill();

        // Vagues/vapeur
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 8 + i * 5);
            ctx.quadraticCurveTo(x + size / 2, y + 6 + i * 5, x + size - 6, y + 8 + i * 5);
            ctx.stroke();
        }

        // Colonnes autour (coins)
        if (['corner_tl', 'single'].includes(tileType)) {
            ctx.fillStyle = palette.light;
            ctx.fillRect(x + 1, y + 1, 3, size * 0.4);
        }
        if (['corner_tr'].includes(tileType)) {
            ctx.fillStyle = palette.light;
            ctx.fillRect(x + size - 4, y + 1, 3, size * 0.4);
        }
    }

    /**
     * Bibliothèque - Centre du savoir
     */
    renderLibrary(ctx, x, y, size, tileType, palette) {
        // Structure
        this.drawAdaptiveWall(ctx, x, y + size * 0.15, size, tileType, palette);

        // Toit avec fronton
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 1, y + size * 0.2);
            ctx.lineTo(x + size / 2, y - size * 0.05);
            ctx.lineTo(x + size + 1, y + size * 0.2);
            ctx.closePath();
            ctx.fill();
        }

        // Étagères de livres
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x + 3, y + size * 0.3, size - 6, 2);
        ctx.fillRect(x + 3, y + size * 0.5, size - 6, 2);
        ctx.fillRect(x + 3, y + size * 0.7, size - 6, 2);

        // Livres colorés
        const colors = ['#8b0000', '#00008b', '#006400', '#4b0082', '#8b4513'];
        for (let shelf = 0; shelf < 3; shelf++) {
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = colors[(shelf + i) % colors.length];
                ctx.fillRect(x + 4 + i * 4, y + size * (0.32 + shelf * 0.2), 3, size * 0.15);
            }
        }

        // Grande fenêtre (pour la lumière)
        if (['single', 'corner_tl', 'edge_l'].includes(tileType)) {
            ctx.fillStyle = '#87ceeb';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x + size * 0.8, y + size * 0.45, size * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Port - Zone portuaire
     */
    renderHarbor(ctx, x, y, size, tileType, palette) {
        // Quai en bois
        ctx.fillStyle = palette.base;
        ctx.fillRect(x, y, size, size);

        // Planches
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + 4 + i * 5);
            ctx.lineTo(x + size, y + 4 + i * 5);
            ctx.stroke();
        }

        // Eau en bas
        if (['corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x, y + size * 0.7, size, size * 0.3);

            // Vagues
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(x, y + size * 0.8);
            ctx.quadraticCurveTo(x + size / 2, y + size * 0.75, x + size, y + size * 0.8);
            ctx.stroke();
        }

        // Poteaux d'amarrage
        if (['corner_tl', 'corner_tr', 'edge_t', 'single'].includes(tileType)) {
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(x + 3, y + 2, 4, size * 0.3);
            ctx.fillRect(x + size - 7, y + 2, 4, size * 0.3);
        }

        // Cordages
        if (['edge_l', 'edge_r', 'center'].includes(tileType)) {
            ctx.strokeStyle = '#daa520';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 5, y);
            ctx.quadraticCurveTo(x + size / 2, y + size * 0.3, x + size - 5, y);
            ctx.stroke();
        }

        // Bateau (centre ou coin)
        if (['single', 'corner_tr', 'center'].includes(tileType)) {
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⛵', x + size / 2, y + size * 0.5);
        }
    }

    /**
     * Jardins suspendus - Espace vert luxuriant
     */
    renderGardens(ctx, x, y, size, tileType, palette) {
        // Sol fertile
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x, y, size, size);

        // Herbe
        ctx.fillStyle = palette.base;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

        // Terrasses si multi-cases
        if (['corner_tl', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.dark;
            ctx.fillRect(x, y, size, 3);
        }

        // Plantes et fleurs
        ctx.fillStyle = palette.light;
        for (let i = 0; i < 6; i++) {
            const px = x + 4 + (i % 3) * 7;
            const py = y + 5 + Math.floor(i / 3) * 9;

            // Buisson
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fleurs colorées
        ctx.fillStyle = palette.accent;
        for (let i = 0; i < 4; i++) {
            const fx = x + 6 + i * 5;
            const fy = y + size * 0.6 + (i % 2) * 4;
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fontaine au centre
        if (tileType === 'center' || tileType === 'single') {
            ctx.fillStyle = '#4a90c2';
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Jet d'eau
            ctx.strokeStyle = '#87ceeb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + size / 2, y + size / 2);
            ctx.lineTo(x + size / 2, y + size * 0.25);
            ctx.stroke();
        }

        // Arbre (coins)
        if (['corner_tl', 'corner_br'].includes(tileType)) {
            ctx.fillStyle = '#228b22';
            ctx.beginPath();
            ctx.arc(x + size * 0.8, y + size * 0.3, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x + size * 0.78, y + size * 0.45, 3, size * 0.3);
        }
    }

    /**
     * Pyramide - Monument emblématique
     */
    renderPyramid(ctx, x, y, size, tileType, palette) {
        // Déterminer la position relative
        const isTopEdge = ['edge_t', 'corner_tl', 'corner_tr'].includes(tileType);
        const isBottomEdge = ['edge_b', 'corner_bl', 'corner_br'].includes(tileType);
        const isLeftEdge = ['edge_l', 'corner_tl', 'corner_bl'].includes(tileType);
        const isRightEdge = ['edge_r', 'corner_tr', 'corner_br'].includes(tileType);

        // Base sableuse
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x, y, size, size);

        // Face de la pyramide
        ctx.fillStyle = palette.base;

        // Gradient pour l'effet 3D
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, palette.light);
        gradient.addColorStop(1, palette.dark);
        ctx.fillStyle = gradient;

        // Dessiner un trapèze qui se rétrécit vers le haut
        const shrinkFactor = 0.15;
        const topInset = isTopEdge ? size * shrinkFactor : 0;
        const bottomInset = isBottomEdge ? size * shrinkFactor : 0;
        const leftInset = isLeftEdge ? size * shrinkFactor : 0;
        const rightInset = isRightEdge ? size * shrinkFactor : 0;

        ctx.beginPath();
        ctx.moveTo(x + leftInset, y + topInset);
        ctx.lineTo(x + size - rightInset, y + topInset);
        ctx.lineTo(x + size - rightInset, y + size - bottomInset);
        ctx.lineTo(x + leftInset, y + size - bottomInset);
        ctx.closePath();
        ctx.fill();

        // Lignes de blocs
        ctx.strokeStyle = palette.dark;
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 4; i++) {
            const yPos = y + i * size / 4;
            ctx.beginPath();
            ctx.moveTo(x + (isLeftEdge ? i * 2 : 0), yPos);
            ctx.lineTo(x + size - (isRightEdge ? i * 2 : 0), yPos);
            ctx.stroke();
        }

        // Sommet doré (si c'est une case du haut au centre)
        if (tileType === 'edge_t' || tileType === 'single') {
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.moveTo(x + size * 0.3, y);
            ctx.lineTo(x + size / 2, y - size * 0.2);
            ctx.lineTo(x + size * 0.7, y);
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * Palais Royal - Résidence luxueuse
     */
    renderPalace(ctx, x, y, size, tileType, palette) {
        // Structure dorée
        this.drawAdaptiveWall(ctx, x, y + size * 0.15, size, tileType, palette, 2);

        // Toit à plusieurs niveaux
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            // Premier niveau
            ctx.fillStyle = palette.roof;
            ctx.fillRect(x - 2, y + size * 0.12, size + 4, size * 0.08);

            // Dôme central
            if (tileType === 'edge_t' || tileType === 'single') {
                ctx.fillStyle = palette.accent;
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size * 0.1, size * 0.25, Math.PI, 0);
                ctx.fill();

                // Flèche
                ctx.fillStyle = palette.light;
                ctx.beginPath();
                ctx.moveTo(x + size / 2 - 2, y - size * 0.05);
                ctx.lineTo(x + size / 2, y - size * 0.2);
                ctx.lineTo(x + size / 2 + 2, y - size * 0.05);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Colonnes dorées
        ctx.fillStyle = palette.light;
        if (['single', 'corner_tl', 'corner_bl', 'edge_l'].includes(tileType)) {
            ctx.fillRect(x + 3, y + size * 0.25, 3, size * 0.55);
        }
        if (['single', 'corner_tr', 'corner_br', 'edge_r'].includes(tileType)) {
            ctx.fillRect(x + size - 6, y + size * 0.25, 3, size * 0.55);
        }

        // Fenêtres en ogive
        if (['center', 'edge_l', 'edge_r'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.moveTo(x + size * 0.35, y + size * 0.7);
            ctx.lineTo(x + size * 0.35, y + size * 0.4);
            ctx.arc(x + size / 2, y + size * 0.4, size * 0.15, Math.PI, 0);
            ctx.lineTo(x + size * 0.65, y + size * 0.7);
            ctx.closePath();
            ctx.fill();
        }

        // Grande entrée (bas centre)
        if (['edge_b'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.6);

            // Arche
            ctx.fillStyle = palette.light;
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size * 0.4, size * 0.3, Math.PI, 0);
            ctx.fill();
        }

        // Bannières (coins)
        if (['corner_tl', 'corner_tr'].includes(tileType)) {
            ctx.fillStyle = palette.accent;
            const flagX = tileType === 'corner_tl' ? x + size * 0.85 : x + size * 0.1;
            ctx.fillRect(flagX, y + size * 0.25, 2, size * 0.4);
            ctx.beginPath();
            ctx.moveTo(flagX + 2, y + size * 0.25);
            ctx.lineTo(flagX + size * 0.15, y + size * 0.35);
            ctx.lineTo(flagX + 2, y + size * 0.45);
            ctx.fill();
        }
    }

    /**
     * Colisée - Arène ovale
     */
    renderColiseum(ctx, x, y, size, tileType, palette) {
        // Arène centrale (sable)
        ctx.fillStyle = '#daa520';
        ctx.fillRect(x + 3, y + 3, size - 6, size - 6);

        // Murs/gradins
        ctx.fillStyle = palette.base;

        // Dessiner les arches selon la position
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            // Mur du haut avec arches
            ctx.fillRect(x, y, size, size * 0.25);
            ctx.fillStyle = palette.dark;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(x + 5 + i * 8, y + size * 0.2, 3, Math.PI, 0);
                ctx.fill();
            }
        }

        if (['single', 'corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = palette.base;
            ctx.fillRect(x, y + size * 0.75, size, size * 0.25);
            ctx.fillStyle = palette.dark;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(x + 5 + i * 8, y + size * 0.8, 3, 0, Math.PI);
                ctx.fill();
            }
        }

        if (['single', 'corner_tl', 'corner_bl', 'edge_l'].includes(tileType)) {
            ctx.fillStyle = palette.base;
            ctx.fillRect(x, y, size * 0.25, size);
        }

        if (['single', 'corner_tr', 'corner_br', 'edge_r'].includes(tileType)) {
            ctx.fillStyle = palette.base;
            ctx.fillRect(x + size * 0.75, y, size * 0.25, size);
        }

        // Entrée principale (bas)
        if (tileType === 'edge_b') {
            ctx.fillStyle = '#3d2914';
            ctx.fillRect(x + size * 0.3, y + size * 0.7, size * 0.4, size * 0.3);
        }

        // Gladiateurs au centre
        if (tileType === 'center' || tileType === 'single') {
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚔️', x + size / 2, y + size / 2);
        }
    }

    /**
     * Sphinx - Statue mythique
     */
    renderSphinx(ctx, x, y, size, tileType, palette) {
        // Socle de sable
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x, y + size * 0.7, size, size * 0.3);

        // Corps du sphinx selon la position
        if (['edge_l', 'corner_tl', 'corner_bl', 'single'].includes(tileType)) {
            // Tête (gauche)
            ctx.fillStyle = palette.base;

            // Visage
            ctx.beginPath();
            ctx.moveTo(x, y + size * 0.2);
            ctx.lineTo(x + size * 0.8, y + size * 0.3);
            ctx.lineTo(x + size * 0.8, y + size * 0.7);
            ctx.lineTo(x, y + size * 0.7);
            ctx.closePath();
            ctx.fill();

            // Coiffe (nemes)
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size * 0.5, y);
            ctx.lineTo(x + size * 0.7, y + size * 0.25);
            ctx.lineTo(x, y + size * 0.2);
            ctx.closePath();
            ctx.fill();

            // Oeil
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(x + size * 0.3, y + size * 0.4, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (['edge_r', 'corner_tr', 'corner_br'].includes(tileType)) {
            // Queue (droite)
            ctx.fillStyle = palette.base;
            ctx.beginPath();
            ctx.moveTo(x, y + size * 0.4);
            ctx.lineTo(x + size, y + size * 0.5);
            ctx.lineTo(x + size, y + size * 0.7);
            ctx.lineTo(x, y + size * 0.7);
            ctx.closePath();
            ctx.fill();

            // Touffe de queue
            ctx.fillStyle = palette.dark;
            ctx.beginPath();
            ctx.arc(x + size * 0.9, y + size * 0.55, 4, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Corps central
            ctx.fillStyle = palette.base;
            ctx.fillRect(x, y + size * 0.35, size, size * 0.35);

            // Pattes avant
            ctx.fillRect(x + size * 0.2, y + size * 0.5, size * 0.15, size * 0.2);
            ctx.fillRect(x + size * 0.65, y + size * 0.5, size * 0.15, size * 0.2);
        }
    }

    /**
     * Académie - Centre d'enseignement
     */
    renderAcademy(ctx, x, y, size, tileType, palette) {
        // Structure en marbre
        this.drawAdaptiveWall(ctx, x, y + size * 0.2, size, tileType, palette);

        // Fronton grec (haut)
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 2, y + size * 0.25);
            ctx.lineTo(x + size / 2, y - size * 0.05);
            ctx.lineTo(x + size + 2, y + size * 0.25);
            ctx.closePath();
            ctx.fill();

            // Symbole de sagesse
            ctx.fillStyle = palette.accent;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🦉', x + size / 2, y + size * 0.18);
        }

        // Colonnes
        ctx.fillStyle = palette.light;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 4 + i * 8, y + size * 0.3, 3, size * 0.5);
        }

        // Étudiants/philosophes (centre)
        if (tileType === 'center' || tileType === 'single') {
            ctx.font = '8px Arial';
            ctx.fillText('📚', x + size * 0.3, y + size * 0.65);
            ctx.fillText('🎓', x + size * 0.7, y + size * 0.65);
        }

        // Escaliers (bas)
        if (['corner_bl', 'corner_br', 'edge_b'].includes(tileType)) {
            ctx.fillStyle = palette.dark;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + 2 - i, y + size - 3 - i * 2, size - 4 + i * 2, 2);
            }
        }
    }

    /**
     * Grand Temple - Temple majestueux
     */
    renderGrandTemple(ctx, x, y, size, tileType, palette) {
        // Base dorée
        ctx.fillStyle = palette.dark;
        ctx.fillRect(x, y + size * 0.15, size, size * 0.85);

        // Murs dorés
        ctx.fillStyle = palette.base;
        ctx.fillRect(x + 2, y + size * 0.2, size - 4, size * 0.75);

        // Toit pyramidal (haut)
        if (['single', 'corner_tl', 'corner_tr', 'edge_t'].includes(tileType)) {
            ctx.fillStyle = palette.roof;
            ctx.beginPath();
            ctx.moveTo(x - 3, y + size * 0.2);
            ctx.lineTo(x + size / 2, y - size * 0.15);
            ctx.lineTo(x + size + 3, y + size * 0.2);
            ctx.closePath();
            ctx.fill();

            // Flamme sacrée
            if (tileType === 'edge_t' || tileType === 'single') {
                ctx.fillStyle = palette.accent;
                ctx.beginPath();
                ctx.moveTo(x + size / 2 - 4, y);
                ctx.quadraticCurveTo(x + size / 2, y - size * 0.3, x + size / 2 + 4, y);
                ctx.fill();
            }
        }

        // Colonnes massives
        ctx.fillStyle = palette.light;
        if (['single', 'corner_tl', 'corner_bl', 'edge_l'].includes(tileType)) {
            ctx.fillRect(x + 3, y + size * 0.25, 4, size * 0.6);
        }
        if (['single', 'corner_tr', 'corner_br', 'edge_r'].includes(tileType)) {
            ctx.fillRect(x + size - 7, y + size * 0.25, 4, size * 0.6);
        }

        // Autel central
        if (tileType === 'center' || tileType === 'edge_b') {
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x + size * 0.3, y + size * 0.5, size * 0.4, size * 0.3);

            // Feu sur l'autel
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔥', x + size / 2, y + size * 0.55);
        }

        // Hiéroglyphes sur les murs
        ctx.fillStyle = palette.accent;
        ctx.font = '6px Arial';
        const symbols = ['☥', '𓂀', '☀️'];
        if (['edge_l', 'edge_r', 'center'].includes(tileType)) {
            symbols.forEach((s, i) => {
                ctx.fillText(s, x + size / 2, y + size * (0.35 + i * 0.15));
            });
        }

        // Entrée monumentale (bas)
        if (['corner_bl', 'corner_br'].includes(tileType)) {
            ctx.fillStyle = '#3d2914';
            ctx.fillRect(x + size * 0.2, y + size * 0.5, size * 0.6, size * 0.5);

            // Décoration de porte
            ctx.fillStyle = palette.accent;
            ctx.fillRect(x + size * 0.2, y + size * 0.5, size * 0.6, 3);
        }
    }

    /**
     * Renderer générique pour les bâtiments non définis
     */
    renderGeneric(ctx, x, y, size, tileType, palette) {
        this.drawAdaptiveWall(ctx, x, y, size, tileType, palette);

        // Icône au centre
        ctx.fillStyle = palette.accent;
        ctx.font = `${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + size / 2, y + size / 2);
    }

    /**
     * Dessine un bâtiment complet avec toutes ses cases
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {string} buildingId - ID du type de bâtiment
     * @param {number} startX - Position X de départ en pixels
     * @param {number} startY - Position Y de départ en pixels
     * @param {number[][]} shape - Matrice de forme du bâtiment
     * @param {boolean} constructing - En construction ou non
     * @param {Function} [getGlobalNeighbor] - Vérifie si un voisin du même type existe (gx, gy, direction, buildingId) => boolean
     * @param {number} [gridStartX] - Position X de départ dans la grille globale
     * @param {number} [gridStartY] - Position Y de départ dans la grille globale
     */
    drawBuilding(ctx, buildingId, startX, startY, shape, constructing = false, getGlobalNeighbor = null, gridStartX = 0, gridStartY = 0) {
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx] === 1) {
                    // Calculer le masque de voisins internes (dans la shape)
                    let neighborMask = this.getNeighborMask(shape, dx, dy);

                    // Si on a une fonction de vérification globale, ajuster le masque
                    // pour que les bâtiments identiques adjacents puissent fusionner
                    if (getGlobalNeighbor) {
                        const gx = gridStartX + dx;
                        const gy = gridStartY + dy;

                        // Pour chaque direction où on n'a PAS de voisin interne,
                        // vérifier s'il y a un bâtiment identique adjacent
                        if (!(neighborMask & NEIGHBOR.TOP) && getGlobalNeighbor(gx, gy, 'top', buildingId)) {
                            neighborMask |= NEIGHBOR.TOP;
                        }
                        if (!(neighborMask & NEIGHBOR.RIGHT) && getGlobalNeighbor(gx, gy, 'right', buildingId)) {
                            neighborMask |= NEIGHBOR.RIGHT;
                        }
                        if (!(neighborMask & NEIGHBOR.BOTTOM) && getGlobalNeighbor(gx, gy, 'bottom', buildingId)) {
                            neighborMask |= NEIGHBOR.BOTTOM;
                        }
                        if (!(neighborMask & NEIGHBOR.LEFT) && getGlobalNeighbor(gx, gy, 'left', buildingId)) {
                            neighborMask |= NEIGHBOR.LEFT;
                        }
                    }

                    const tileType = this.getTileType(neighborMask);

                    const x = startX + dx * this.tileSize;
                    const y = startY + dy * this.tileSize;

                    this.drawTile(ctx, buildingId, x, y, tileType, constructing);
                }
            }
        }
    }
}

export default BuildingSprites;
export { BUILDING_PALETTES, NEIGHBOR };
