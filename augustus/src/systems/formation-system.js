// ==========================================
// SYSTÈME DE FORMATIONS
// ==========================================

/**
 * Types de formations disponibles
 */
export const FORMATION_TYPES = {
    // Formation romaine serrée (manipule/testudo)
    ROMAN_TIGHT: 'roman_tight',
    // Formation romaine de tirailleurs
    ROMAN_SKIRMISH: 'roman_skirmish',
    // Formation barbare en masse
    BARBARIAN_MASS: 'barbarian_mass',
    // Formation barbare élite (guerriers nobles, champions)
    BARBARIAN_ELITE: 'barbarian_elite',
    // Formation cavalerie ordonnée
    CAVALRY_LINE: 'cavalry_line',
    // Formation désordonnée (paysans, rebelles)
    MOB: 'mob',
    // Formation d'éléphants
    ELEPHANT_LINE: 'elephant_line',
    // Formation phalange grecque/macédonienne
    PHALANX: 'phalanx'
};

/**
 * Configuration des formations par type
 * randomness: variation de position (0 = parfaitement aligné)
 * baseRandomness: randomness de base (avant modification par expérience)
 */
export const FORMATION_CONFIG = {
    // Romains - formations serrées mais avec léger désordre pour les recrues
    // Sprites 32x40, espacement adapté pour éviter chevauchement total
    roman_tight: {
        columns: 10,
        rows: 6,
        spacing: 28,        // Sprites 32px de large, espacement ~28 pour léger contact
        defaultMen: 60,
        randomness: 1.5,
        baseRandomness: 1.5,
        style: 'grid'
    },
    roman_skirmish: {
        columns: 8,
        rows: 5,
        spacing: 36,        // Tirailleurs plus espacés
        defaultMen: 40,
        randomness: 3,
        baseRandomness: 3,
        style: 'grid'
    },
    // Barbares - formations plus lâches et moins ordonnées
    barbarian_mass: {
        columns: 8,
        rows: 8,
        spacing: 32,        // Masse barbare, espacement moyen
        defaultMen: 60,
        randomness: 5,
        baseRandomness: 5,
        style: 'grid'
    },
    // Barbares élite (nobles, champions) - plus ordonné que la masse
    barbarian_elite: {
        columns: 8,
        rows: 8,
        spacing: 30,        // Elite barbare, un peu plus serré
        defaultMen: 60,
        randomness: 2,
        baseRandomness: 2,
        style: 'grid'
    },
    // Cavalerie - sprites 40x48, besoin de beaucoup plus d'espace
    cavalry_line: {
        columns: 6,
        rows: 5,
        spacing: 48,        // Sprites 40px de large + marge pour chevaux
        defaultMen: 30,
        randomness: 2,
        baseRandomness: 2,
        style: 'grid'
    },
    // Éléphants - sprites 48x56, très grands
    elephant_line: {
        columns: 4,
        rows: 3,
        spacing: 65,        // Sprites 48px de large, grands animaux
        defaultMen: 12,
        randomness: 0,
        baseRandomness: 0,
        style: 'grid'
    },
    // Paysans/Rebelles - formation en masse désordonnée
    mob: {
        columns: 0,
        rows: 0,
        spacing: 30,        // Mob désorganisé
        defaultMen: 60,
        randomness: 10,
        baseRandomness: 10,
        style: 'blob',
        blobRadius: 100     // Rayon plus grand pour la masse
    },
    // Phalange grecque/macédonienne - serrée mais visible
    phalanx: {
        columns: 8,
        rows: 8,
        spacing: 24,        // Phalange serrée mais sprites distincts
        defaultMen: 64,
        randomness: 1,
        baseRandomness: 1,
        style: 'grid'
    }
};

/**
 * Mapping faction -> type de formation par défaut
 */
const FACTION_FORMATION_MAP = {
    // Romains - formations serrées et disciplinées
    julii: { infantry: 'roman_tight', ranged: 'roman_skirmish', skirmisher: 'roman_skirmish', cavalry: 'cavalry_line' },
    brutii: { infantry: 'roman_tight', ranged: 'roman_skirmish', skirmisher: 'roman_skirmish', cavalry: 'cavalry_line' },
    scipii: { infantry: 'roman_tight', ranged: 'roman_skirmish', skirmisher: 'roman_skirmish', cavalry: 'cavalry_line' },
    senate: { infantry: 'roman_tight', ranged: 'roman_skirmish', skirmisher: 'roman_skirmish', cavalry: 'cavalry_line' },
    // Gaulois - masses désordonnées, mais élite mieux formée
    gauls: { infantry: 'barbarian_mass', ranged: 'barbarian_mass', skirmisher: 'barbarian_mass', cavalry: 'cavalry_line', elite: 'barbarian_elite' },
    // Carthage - mercenaires variés
    carthage: { infantry: 'barbarian_mass', ranged: 'roman_skirmish', skirmisher: 'roman_skirmish', cavalry: 'cavalry_line', elephant: 'elephant_line' },
    // Macédoine - phalanges grecques
    macedon: { infantry: 'phalanx', ranged: 'roman_skirmish', skirmisher: 'roman_skirmish', cavalry: 'cavalry_line' },
    // Orientaux - phalanges et masses
    pontus: { infantry: 'phalanx', ranged: 'roman_skirmish', skirmisher: 'roman_skirmish', cavalry: 'cavalry_line' },
    // Maures - formations lâches
    mauretania: { infantry: 'barbarian_mass', ranged: 'barbarian_mass', skirmisher: 'barbarian_mass', cavalry: 'cavalry_line' },
    // Rebelles/Paysans - masse désordonnée
    rebels: { infantry: 'mob', ranged: 'mob', skirmisher: 'mob', cavalry: 'mob' }
};

/**
 * Liste des identifiants d'unités élite par faction
 */
const ELITE_UNITS = {
    gauls: ['noble_warriors', 'chosen_swordsmen', 'naked_fanatics', 'druids_guard', 'champions'],
    carthage: ['sacred_band', 'poeni_infantry'],
    macedon: ['royal_guard', 'silver_shields', 'companion_cavalry'],
    pontus: ['imitation_legionaries', 'royal_cavalry']
};

/**
 * Gère les formations et le positionnement des soldats
 */
class FormationSystem {
    constructor() {
        // Vitesse de repositionnement
        this.repositionSpeed = 0.1;
        // Seed pour le random des formations mob (par unité)
        this.mobSeeds = new Map();
    }

    /**
     * Vérifie si une unité est une unité d'élite
     */
    isEliteUnit(unit) {
        const unitId = unit.id?.toLowerCase() || '';
        const factionElites = ELITE_UNITS[unit.faction] || [];

        for (const eliteId of factionElites) {
            if (unitId.includes(eliteId)) return true;
        }
        return false;
    }

    /**
     * Obtient le type de formation pour une unité selon sa faction
     */
    getFormationType(unit) {
        const factionMap = FACTION_FORMATION_MAP[unit.faction];
        if (factionMap) {
            // Vérifier si c'est une unité élite
            if (this.isEliteUnit(unit) && factionMap.elite) {
                return factionMap.elite;
            }

            const formationType = factionMap[unit.type];
            if (formationType) return formationType;
        }

        // Fallback par type d'unité
        switch (unit.type) {
            case 'infantry': return 'barbarian_mass';
            case 'ranged':
            case 'skirmisher': return 'roman_skirmish';
            case 'cavalry': return 'cavalry_line';
            case 'elephant': return 'elephant_line';
            default: return 'barbarian_mass';
        }
    }

    /**
     * Obtient la configuration de formation pour une unité
     * Prend en compte l'expérience pour modifier le désordre
     */
    getFormationConfig(unit) {
        const formationType = typeof unit === 'string' ? unit : this.getFormationType(unit);
        const baseConfig = FORMATION_CONFIG[formationType] || FORMATION_CONFIG.barbarian_mass;

        // Si c'est juste un string ou pas d'unité, retourner la config de base
        if (typeof unit === 'string' || !unit) {
            return baseConfig;
        }

        // Copier la config pour modifier le randomness selon l'expérience
        const config = { ...baseConfig };

        // L'expérience réduit le désordre (0 = recrue, 5+ = vétéran)
        const experience = unit.experience || 0;
        // Réduction: 0% à exp 0, jusqu'à 60% à exp 5+
        const experienceReduction = Math.min(experience / 5, 1) * 0.6;

        // Appliquer la réduction de randomness selon l'expérience
        if (config.baseRandomness > 0) {
            config.randomness = config.baseRandomness * (1 - experienceReduction);
        }

        // Pour les blobs, aussi réduire le rayon et l'augmenter l'espacement
        if (config.style === 'blob' && experience > 2) {
            // Les vétérans se regroupent mieux
            config.blobRadius = config.blobRadius * (1 - experienceReduction * 0.3);
        }

        return config;
    }

    /**
     * Génère un nombre pseudo-aléatoire basé sur une seed
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Calcule les positions des soldats dans une formation
     * @param {Object} unit - L'unité
     * @param {number} centerX - Position X centrale de l'unité
     * @param {number} centerY - Position Y centrale de l'unité
     * @param {number} facing - Direction de l'unité en radians (0 = droite)
     * @returns {Array} Liste des positions { x, y, row, col, isBorder }
     */
    calculateFormationPositions(unit, centerX, centerY, facing = 0) {
        const config = this.getFormationConfig(unit);
        const maxSoldiers = unit.currentMen || config.defaultMen;

        if (config.style === 'blob') {
            return this.calculateBlobPositions(unit, centerX, centerY, facing, config, maxSoldiers);
        }

        return this.calculateGridPositions(unit, centerX, centerY, facing, config, maxSoldiers);
    }

    /**
     * Calcule les positions en grille (formations ordonnées)
     */
    calculateGridPositions(unit, centerX, centerY, facing, config, maxSoldiers) {
        const positions = [];
        const { columns, rows, spacing, randomness } = config;

        const formationWidth = (columns - 1) * spacing;
        const formationDepth = (rows - 1) * spacing;

        const startX = -formationWidth / 2;
        const startY = -formationDepth / 2;

        const cos = Math.cos(facing);
        const sin = Math.sin(facing);

        let soldierIndex = 0;
        for (let row = 0; row < rows && soldierIndex < maxSoldiers; row++) {
            for (let col = 0; col < columns && soldierIndex < maxSoldiers; col++) {
                // Position locale avec randomness
                const randX = randomness > 0 ? (this.seededRandom(soldierIndex * 17 + 1) - 0.5) * randomness * 2 : 0;
                const randY = randomness > 0 ? (this.seededRandom(soldierIndex * 31 + 2) - 0.5) * randomness * 2 : 0;

                const localX = startX + col * spacing + randX;
                const localY = startY + row * spacing + randY;

                const rotatedX = localX * cos - localY * sin;
                const rotatedY = localX * sin + localY * cos;

                const isBorder = row === 0 || row === rows - 1 || col === 0 || col === columns - 1;

                positions.push({
                    x: centerX + rotatedX,
                    y: centerY + rotatedY,
                    row: row,
                    col: col,
                    isBorder: isBorder,
                    localX: localX,
                    localY: localY
                });

                soldierIndex++;
            }
        }

        return positions;
    }

    /**
     * Calcule les positions en blob (formation ronde désordonnée pour paysans/rebelles)
     */
    calculateBlobPositions(unit, centerX, centerY, facing, config, maxSoldiers) {
        const positions = [];
        const { blobRadius, spacing, randomness } = config;

        // Utiliser une seed stable pour cette unité
        const unitSeed = unit.id ? unit.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 12345;

        for (let i = 0; i < maxSoldiers; i++) {
            // Distribution en spirale avec randomness
            const angle = i * 2.4 + this.seededRandom(unitSeed + i * 7) * 0.5; // Golden angle avec variation
            const radius = Math.sqrt(i / maxSoldiers) * blobRadius + this.seededRandom(unitSeed + i * 13) * randomness;

            const localX = Math.cos(angle) * radius;
            const localY = Math.sin(angle) * radius;

            // Rotation selon facing
            const cos = Math.cos(facing);
            const sin = Math.sin(facing);
            const rotatedX = localX * cos - localY * sin;
            const rotatedY = localX * sin + localY * cos;

            // Distance du centre pour déterminer si bordure
            const distFromCenter = Math.sqrt(localX * localX + localY * localY);
            const isBorder = distFromCenter > blobRadius * 0.7;

            positions.push({
                x: centerX + rotatedX,
                y: centerY + rotatedY,
                row: Math.floor(i / 8), // Approximation pour compatibilité
                col: i % 8,
                isBorder: isBorder,
                localX: localX,
                localY: localY
            });
        }

        return positions;
    }

    /**
     * Recalcule les positions après des pertes et comble les trous
     * @param {Object} unit - L'unité
     * @param {Array} deadIndices - Indices des soldats morts
     */
    repositionAfterCasualties(unit, deadIndices) {
        if (!unit.soldiers || deadIndices.length === 0) return;

        // Obtenir les soldats vivants
        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        if (aliveSoldiers.length === 0) return;

        // Recalculer la formation optimale
        const config = this.getFormationConfig(unit.type);
        const aliveCount = aliveSoldiers.length;

        // Ajuster le nombre de colonnes si nécessaire (formation plus compacte)
        let newColumns = config.columns;
        let newRows = Math.ceil(aliveCount / newColumns);

        // S'assurer qu'on a assez de places
        while (newColumns * newRows < aliveCount && newRows < config.rows) {
            newRows++;
        }

        // Générer les nouvelles positions
        const positions = this.calculateFormationPositions(
            { ...unit, currentMen: aliveCount, type: unit.type },
            unit.x,
            unit.y,
            unit.facing || 0
        );

        // Assigner les nouvelles positions aux soldats vivants
        let posIndex = 0;
        for (const soldier of aliveSoldiers) {
            if (posIndex < positions.length) {
                const newPos = positions[posIndex];

                // Définir la nouvelle position cible
                soldier.formationX = newPos.x;
                soldier.formationY = newPos.y;
                soldier.row = newPos.row;
                soldier.col = newPos.col;
                soldier.isBorder = newPos.isBorder;
                soldier.isRepositioning = true;

                posIndex++;
            }
        }
    }

    /**
     * Met à jour le repositionnement des soldats
     * @param {number} deltaTime - Temps écoulé
     */
    updateRepositioning(deltaTime) {
        // Cette méthode est appelée par SoldierManager.updateAnimations()
        // Le mouvement réel est géré dans SoldierManager.updateSoldierMovement()
    }

    /**
     * Calcule la direction de l'unité vers une cible
     * @param {Object} unit - L'unité
     * @returns {number} Angle en radians
     */
    calculateUnitFacing(unit) {
        if (unit.target) {
            // Face vers la cible en combat
            return Math.atan2(
                unit.target.y - unit.y,
                unit.target.x - unit.x
            );
        }

        if (unit.targetX !== null && unit.targetX !== undefined) {
            // Face vers la destination
            return Math.atan2(
                unit.targetY - unit.y,
                unit.targetX - unit.x
            );
        }

        // Direction par défaut selon le camp
        return unit.side === 'attacker' ? 0 : Math.PI;
    }

    /**
     * Obtient le rayon de collision de la formation
     * @param {Object} unit - L'unité
     * @returns {number} Rayon en pixels
     */
    getFormationRadius(unit) {
        const config = this.getFormationConfig(unit.type);
        const width = config.columns * config.spacing;
        const depth = config.rows * config.spacing;
        return Math.max(width, depth) / 2;
    }

    /**
     * Obtient les dimensions de la formation
     * @param {Object} unit - L'unité
     * @returns {Object} { width, height }
     */
    getFormationDimensions(unit) {
        const config = this.getFormationConfig(unit.type);
        return {
            width: config.columns * config.spacing,
            height: config.rows * config.spacing
        };
    }

    /**
     * Vérifie si un point est dans la formation
     * @param {Object} unit - L'unité
     * @param {number} x - Position X à tester
     * @param {number} y - Position Y à tester
     * @returns {boolean}
     */
    isPointInFormation(unit, x, y) {
        const radius = this.getFormationRadius(unit);
        const dist = Math.hypot(x - unit.x, y - unit.y);
        return dist <= radius;
    }

    /**
     * Trouve le soldat le plus proche d'un point
     * @param {Object} unit - L'unité
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @returns {Object|null} Le soldat le plus proche ou null
     */
    findClosestSoldier(unit, x, y) {
        if (!unit.soldiers) return null;

        let closest = null;
        let minDist = Infinity;

        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive) continue;

            const dist = Math.hypot(soldier.x - x, soldier.y - y);
            if (dist < minDist) {
                minDist = dist;
                closest = soldier;
            }
        }

        return closest;
    }

    /**
     * Obtient les soldats de front (premier rang)
     * @param {Object} unit - L'unité
     * @returns {Array} Soldats du premier rang
     */
    getFrontRankSoldiers(unit) {
        if (!unit.soldiers) return [];
        return unit.soldiers.filter(s => s.isAlive && s.row === 0);
    }

    /**
     * Obtient les soldats de bordure
     * @param {Object} unit - L'unité
     * @param {string} side - 'left', 'right', 'front', 'rear'
     * @returns {Array} Soldats de la bordure spécifiée
     */
    getBorderSoldiers(unit, side) {
        if (!unit.soldiers) return [];

        const config = this.getFormationConfig(unit.type);

        return unit.soldiers.filter(s => {
            if (!s.isAlive) return false;

            switch (side) {
                case 'front': return s.row === 0;
                case 'rear': return s.row === config.rows - 1;
                case 'left': return s.col === 0;
                case 'right': return s.col === config.columns - 1;
                default: return s.isBorder;
            }
        });
    }

    /**
     * Calcule le centre de masse de la formation (soldats vivants)
     * @param {Object} unit - L'unité
     * @returns {Object} { x, y }
     */
    getFormationCenter(unit) {
        if (!unit.soldiers) return { x: unit.x, y: unit.y };

        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        if (aliveSoldiers.length === 0) return { x: unit.x, y: unit.y };

        let sumX = 0, sumY = 0;
        for (const soldier of aliveSoldiers) {
            sumX += soldier.x;
            sumY += soldier.y;
        }

        return {
            x: sumX / aliveSoldiers.length,
            y: sumY / aliveSoldiers.length
        };
    }

    /**
     * Réorganise la formation en fonction des pertes (formation plus compacte)
     * @param {Object} unit - L'unité
     */
    compactFormation(unit) {
        if (!unit.soldiers) return;

        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        const config = this.getFormationConfig(unit.type);

        // Calculer la nouvelle disposition optimale
        const aliveCount = aliveSoldiers.length;
        if (aliveCount === 0) return;

        // Réduire les colonnes si on a moins de soldats
        let newColumns = Math.min(config.columns, aliveCount);
        let newRows = Math.ceil(aliveCount / newColumns);

        // Recalculer les positions avec la nouvelle disposition
        const newSpacing = config.spacing;
        const formationWidth = (newColumns - 1) * newSpacing;
        const formationDepth = (newRows - 1) * newSpacing;

        const startX = -formationWidth / 2;
        const startY = -formationDepth / 2;

        const cos = Math.cos(unit.facing || 0);
        const sin = Math.sin(unit.facing || 0);

        let soldierIndex = 0;
        for (let row = 0; row < newRows && soldierIndex < aliveCount; row++) {
            const colsInRow = Math.min(newColumns, aliveCount - row * newColumns);
            const rowOffset = (newColumns - colsInRow) * newSpacing / 2; // Centrer les rangs incomplets

            for (let col = 0; col < colsInRow && soldierIndex < aliveCount; col++) {
                const soldier = aliveSoldiers[soldierIndex];

                const localX = startX + col * newSpacing + rowOffset;
                const localY = startY + row * newSpacing;

                const rotatedX = localX * cos - localY * sin;
                const rotatedY = localX * sin + localY * cos;

                soldier.formationX = unit.x + rotatedX;
                soldier.formationY = unit.y + rotatedY;
                soldier.row = row;
                soldier.col = col;
                soldier.isBorder = row === 0 || row === newRows - 1 || col === 0 || col === colsInRow - 1;
                soldier.isRepositioning = true;

                soldierIndex++;
            }
        }
    }
}

export default FormationSystem;
