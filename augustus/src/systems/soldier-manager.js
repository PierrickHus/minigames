// ==========================================
// GESTIONNAIRE DES SOLDATS INDIVIDUELS
// ==========================================

import { BATTLE_ANIM_CONFIG } from '../data/battle-sprite-definitions.js';

/**
 * Configuration des stats de base par type d'unité
 * attackRange réduit pour forcer le vrai contact au corps à corps
 */
const SOLDIER_STATS = {
    infantry: { hp: 3, attack: 2, defense: 1, speed: 1, attackRange: 8, isRanged: false },
    ranged: { hp: 2, attack: 2, defense: 0, speed: 1, attackRange: 120, isRanged: true }, // Javelots longue portée
    skirmisher: { hp: 2, attack: 2, defense: 0, speed: 1.2, attackRange: 100, isRanged: true }, // Vélites
    cavalry: { hp: 4, attack: 3, defense: 1, speed: 1.8, attackRange: 10, isRanged: false },
    elephant: { hp: 10, attack: 5, defense: 3, speed: 0.8, attackRange: 12, isRanged: false }
};

/**
 * Styles de combat par faction
 * - disciplined: Maintient la ligne, combat en formation (Romains)
 * - aggressive: Charge dans l'ennemi, brise la formation (Barbares)
 * - defensive: Tient position, contre-attaque (Phalanges)
 */
const COMBAT_STYLES = {
    julii: 'disciplined',
    brutii: 'disciplined',
    scipii: 'disciplined',
    senate: 'disciplined',
    gauls: 'aggressive',
    carthage: 'aggressive',
    macedon: 'defensive',
    pontus: 'defensive',
    mauretania: 'aggressive',
    rebels: 'aggressive'
};

/**
 * Configuration des collisions entre soldats
 * Système de physique fluide permettant aux formations de se mélanger au contact
 */
const SOLDIER_COLLISION = {
    radius: 6,                    // Rayon de collision (réduit pour plus de densité)
    minDistance: 10,              // Distance minimale entre soldats alliés
    enemyMinDistance: 8,          // Distance minimale au combat (très proche!)

    // Forces physiques
    separationForce: 0.3,         // Force séparation alliés (faible = plus serré)
    enemyPushForce: 0.6,          // Force poussée ennemis (modéré)
    formationPullForce: 0.15,     // Force de rappel formation (faible = plus libre)

    // Paramètres de bousculade
    crowdPushMultiplier: 1.5,     // Multiplicateur si poussé par plusieurs soldats
    backlinePushForce: 0.4,       // Force des soldats de derrière qui poussent
    momentumTransfer: 0.7,        // Transfert de momentum lors des collisions

    // Masses par type
    massMultiplier: {
        infantry: 1.0,
        ranged: 0.7,
        skirmisher: 0.6,
        cavalry: 2.5,
        elephant: 5.0
    },

    // Résistance à la poussée selon le style de combat
    pushbackResistance: {
        disciplined: 0.7,
        defensive: 0.9,
        aggressive: 0.4
    },

    // Impact de charge (conservé pour compatibilité)
    chargeImpact: 2.5
};

/**
 * Configuration du mouvement fluide et de la mêlée
 * Contrôle comment les formations se mélangent au combat
 */
const FLUID_MOVEMENT_CONFIG = {
    // Distance avant que les soldats commencent à "charger" dans la mêlée
    meleeEngageDistance: 60,

    // Les soldats ignorent leur formation quand en mêlée
    meleeFormationIgnoreRadius: 30,

    // Vitesse de pénétration dans une formation ennemie
    penetrationSpeed: 0.5,

    // Force avec laquelle les rangs arrière poussent vers l'avant
    backPressure: 0.3,

    // Distance max de combat rapproché
    combatDistance: 15,

    // Intervalle de mise à jour des collisions (tous les N soldats)
    collisionBatchSize: 50,

    // Taille des cellules de la grille spatiale pour optimisation
    spatialGridCellSize: 32,

    // Friction appliquée à la vélocité chaque frame
    velocityFriction: 0.85,

    // Force d'attraction vers l'ennemi en mêlée
    meleeAttractionForce: 0.4,

    // Seuil de vélocité minimum avant d'être considéré immobile
    velocityThreshold: 0.1
};

/**
 * Configuration du système d'encerclement
 * Le nombre max d'attaquants dépend de l'espace physique autour de la cible
 */
const ENCIRCLEMENT_CONFIG = {
    // Rayon d'espace qu'occupe un attaquant autour de sa cible (en degrés d'arc)
    attackerArcSize: {
        infantry: 60,      // Un fantassin occupe ~60° d'arc
        ranged: 60,
        skirmisher: 60,
        cavalry: 90,       // Un cavalier occupe plus d'espace (~90°)
        elephant: 120      // Un éléphant occupe beaucoup d'espace (~120°)
    },
    // Distance maximale pour être considéré "en combat" avec une cible
    engagementRadius: 15,
    // Bonus/malus quand encerclé
    encirclementPenalty: {
        2: 0.1,    // 2 attaquants : -10% défense
        3: 0.25,   // 3 attaquants : -25% défense
        4: 0.4,    // 4 attaquants : -40% défense
        5: 0.5     // 5+ attaquants : -50% défense
    }
};

/**
 * Configuration du dilemme soldat engagé vs groupe
 * Gère les forces contradictoires entre rester au combat et rejoindre la formation
 */
const COHESION_CONFIG = {
    // Distance à partir de laquelle la force de cohésion commence à s'appliquer
    cohesionStartDistance: 30,
    // Distance à laquelle la force de cohésion est maximale
    cohesionMaxDistance: 150,
    // Force de cohésion maximale (0-1, où 1 = force totale vers le groupe)
    maxCohesionStrength: 0.4,
    // Vitesse de dérive vers le groupe pendant le combat (pixels/tick)
    combatDriftSpeed: 0.3,
    // Distance à laquelle un désengagement mutuel est possible
    mutualDisengageDistance: 80,
    // Malus de dégâts quand on tourne le dos (multiplicateur)
    backTurnedDamageMultiplier: 2.0,
    // Réduction de défense quand on tourne le dos
    backTurnedDefenseMultiplier: 0.2,
    // Vitesse de recul défensif (fraction de la vitesse normale)
    defensiveRetreatSpeedRatio: 0.3
};

/**
 * Configuration du système de charge (cavalerie et éléphants)
 * Définit les paramètres pour les charges de cavalerie avec traversée,
 * knockback et dégâts d'impact
 */
const CHARGE_CONFIG = {
    // Seuil de vitesse pour être considéré "en charge" (% de la vitesse max)
    chargeSpeedThreshold: 0.7,
    // Distance minimale parcourue pour activer la charge
    minChargeDistance: 40,
    // Dégâts de base de la charge (multipliés par le stat charge)
    baseChargeDamage: 3,
    // Pénétration d'armure de la charge (ignore ce % d'armure)
    chargeArmorPenetration: 0.5,
    // Force de knockback de base
    baseKnockbackForce: 15,
    // Ralentissement par impact (% de vitesse perdue par soldat traversé)
    speedLossPerImpact: 0.15,
    // Vitesse minimale pour continuer la charge (% de la vitesse max)
    minChargeSpeed: 0.3,
    // Fatigue ajoutée aux soldats impactés
    impactFatigue: 20,
    // Perte de moral des soldats impactés
    impactMoraleLoss: 10,
    // Résistance de formation selon le type
    formationResistance: {
        phalanx: 2.0,        // Phalanges très résistantes de front
        roman_tight: 1.5,    // Romains résistants
        barbarian_mass: 0.8, // Barbares moins résistants
        cavalry_line: 0.6,   // Cavalerie vulnérable aux charges
        mob: 0.4             // Populace très vulnérable
    },
    // Bonus de résistance si l'unité fait face à la charge
    facingResistanceBonus: 1.5,
    // Malus de résistance si attaqué de dos
    rearResistanceMalus: 0.3
};

/**
 * Configuration du système de fatigue
 * La fatigue affecte les performances des soldats (attaque, défense, vitesse)
 * Elle augmente avec le combat, la course, l'encerclement et diminue au repos
 */
const FATIGUE_CONFIG = {
    // Fatigue maximale
    maxFatigue: 100,

    // Sources de fatigue (par tick de combat ou par seconde)
    fatigueSources: {
        attackGiven: 2,       // Par coup donné
        attackReceived: 3,    // Par coup reçu/bloqué
        running: 0.05,        // Par tick en course
        charging: 0.1,        // Par tick en charge
        encircled: 0.1,       // Par tick si 2+ attaquants (en plus par attaquant)
        chargeImpact: 5       // Par impact de charge subi
    },

    // Récupération de fatigue
    fatigueRecovery: {
        idle: 0.15,           // Par tick au repos
        walking: 0.05,        // Par tick en marche lente
        inCombat: 0           // Pas de récupération en combat
    },

    // Seuils et effets de fatigue
    fatigueEffects: {
        // Seuil 0-30 : Fatigue légère
        light: {
            threshold: 30,
            attackMod: 0.9,    // -10% attaque
            defenseMod: 0.9,   // -10% défense
            speedMod: 1.0      // Pas d'effet sur vitesse
        },
        // Seuil 30-60 : Fatigue modérée
        moderate: {
            threshold: 60,
            attackMod: 0.75,   // -25% attaque
            defenseMod: 0.75,  // -25% défense
            speedMod: 0.8      // -20% vitesse
        },
        // Seuil 60-80 : Fatigue sévère
        severe: {
            threshold: 80,
            attackMod: 0.5,    // -50% attaque
            defenseMod: 0.5,   // -50% défense
            speedMod: 0.5      // -50% vitesse
        },
        // Seuil 80+ : Épuisé
        exhausted: {
            threshold: 100,
            attackMod: 0.25,   // -75% attaque (peut à peine frapper)
            defenseMod: 0.3,   // -70% défense
            speedMod: 0.3      // -70% vitesse
        }
    }
};

/**
 * Configuration des abilities de combat
 * Chaque ability peut etre automatique (declenchee par le systeme) ou activable (par le joueur)
 */
const ABILITY_CONFIG = {
    /**
     * Pilum - Tir de javelot automatique avant le contact
     * Les legionnaires romains lancent leur pilum une fois a l'approche de l'ennemi
     */
    pilum: {
        triggerDistance: 40,
        damage: 3,
        armorPenetration: 0.3,
        cooldown: 0,
        affectedTypes: ['infantry', 'cavalry']
    },

    /**
     * Testudo - Formation defensive activable (tortue romaine)
     * Double la defense, triple contre les projectiles, mais ralentit fortement
     */
    testudo: {
        defenseBonus: 2.0,
        rangedDefenseBonus: 3.0,
        speedMalus: 0.3,
        duration: 0,
        formationType: 'roman'
    },

    /**
     * Warcry - Cri de guerre automatique au debut du combat
     * Reduit le moral ennemi, booste le moral et l'attaque temporairement
     */
    warcry: {
        triggerOnEngage: true,
        moraleDamageToEnemy: 10,
        selfMoraleBonus: 5,
        attackBonus: 1.3,
        duration: 5000,
        cooldown: 30000
    },

    /**
     * Phalanx - Formation en mur de piques activable
     * Tres resistant aux charges frontales, vulnerable sur les flancs
     */
    phalanx: {
        defenseBonus: 1.5,
        chargeResistance: 3.0,
        attackMalus: 0.7,
        speedMalus: 0.2,
        flankedVulnerability: 2.0,
        duration: 0
    },

    /**
     * Spear Wall - Contre-charge automatique contre cavalerie/elephants
     * Les lanciers infligent des degats bonus quand charges par des montures
     */
    spear_wall: {
        chargeCounterDamage: 5,
        triggerOnCharge: true,
        affectedTypes: ['cavalry', 'elephant']
    },

    /**
     * Berserk - Rage declenchee a faible moral
     * Augmente l'attaque mais reduit la defense, ignore la fatigue
     */
    berserk: {
        triggerMoraleThreshold: 30,
        attackBonus: 1.5,
        defenseMalus: 0.5,
        ignoreFatigue: true,
        duration: 10000
    }
};

/**
 * Configuration des rôles spéciaux (chef, porte-drapeau)
 */
const SPECIAL_ROLES = {
    leader: {
        hpBonus: 3,           // HP supplémentaires
        attackBonus: 2,       // Attaque supplémentaire
        defenseBonus: 2,      // Défense supplémentaire
        moraleAura: 5,        // Bonus de moral aux soldats proches
        formationBonus: 0.3   // Réduction du randomness de formation (30%)
    },
    standardBearer: {
        hpBonus: 1,           // HP supplémentaires
        attackBonus: 0,       // N'attaque pas vraiment
        defenseBonus: 1,      // Se défend quand même
        moraleAura: 10,       // Bonus de moral important
        avoidsCombat: true    // Évite le combat autant que possible
    }
};

/**
 * Gère les soldats individuels dans une bataille
 */
class SoldierManager {
    constructor(battleSystem) {
        this.battle = battleSystem;

        // Timing d'animation
        this.animationTime = 0;
        this.lastFrameTime = 0;

        // Cooldown global pour le combat
        this.combatTickRate = 500; // ms entre chaque tick de combat
        this.lastCombatTick = 0;
    }

    /**
     * Crée les soldats pour une unité de bataille
     * @param {Object} unit - L'unité de bataille
     * @param {Object} formationSystem - Le système de formation
     * @returns {Array} Liste des soldats créés
     */
    createSoldiersForUnit(unit, formationSystem) {
        const soldiers = [];
        const positions = formationSystem.calculateFormationPositions(
            unit,
            unit.x,
            unit.y,
            unit.facing || 0
        );

        // Stats de base selon le type d'unité
        const baseStats = SOLDIER_STATS[unit.type] || SOLDIER_STATS.infantry;
        // Bonus des stats de l'unité
        const unitBonus = {
            hp: Math.floor((unit.stats?.defense || 0) / 2),
            attack: Math.floor((unit.stats?.attack || 0) / 5),
            defense: Math.floor((unit.stats?.armor || 0) / 3)
        };

        // Déterminer les positions du leader et du porte-drapeau
        // IMPORTANT: Avec la nouvelle orientation des formations:
        // - row 0 = premier rang (devant)
        // - col = position latérale (gauche à droite)
        // Leader: centre de la première rangée (row 0, colonne centrale)
        // Porte-drapeau: deuxième rangée, même colonne
        const config = formationSystem.getFormationConfig(unit);
        const centerCol = Math.floor(config.columns / 2);

        // Leader à row=0, col=centre
        const leaderIndex = 0 * config.columns + centerCol;
        // Porte-drapeau à row=1, col=centre (si assez de soldats)
        const standardBearerIndex = 1 * config.columns + centerCol;

        for (let i = 0; i < positions.length && i < unit.currentMen; i++) {
            const pos = positions[i];

            // Déterminer le rôle du soldat
            let role = 'soldier';
            if (i === leaderIndex) {
                role = 'leader';
            } else if (i === standardBearerIndex && unit.currentMen > config.columns) {
                role = 'standardBearer';
            }

            soldiers.push(this.createSoldier(i, pos, unit, baseStats, unitBonus, role));
        }

        unit.soldiers = soldiers;
        unit.deadBodies = [];

        // Stocker la référence au leader actuel
        unit.leader = soldiers.find(s => s.role === 'leader') || null;
        unit.standardBearer = soldiers.find(s => s.role === 'standardBearer') || null;

        return soldiers;
    }

    /**
     * Crée un soldat individuel avec HP et stats
     * @param {string} role - 'soldier', 'leader', ou 'standardBearer'
     */
    createSoldier(index, position, unit, baseStats, unitBonus, role = 'soldier') {
        // Appliquer les bonus selon le rôle
        const roleConfig = SPECIAL_ROLES[role] || {};
        const hpBonus = roleConfig.hpBonus || 0;
        const attackBonus = roleConfig.attackBonus || 0;
        const defenseBonus = roleConfig.defenseBonus || 0;

        const maxHp = baseStats.hp + unitBonus.hp + hpBonus;

        // L'expérience du soldat (les leaders et porte-drapeaux sont plus expérimentés)
        const baseExperience = unit.experience || 0;
        const soldierExperience = role === 'leader' ? baseExperience + 2 :
                                  role === 'standardBearer' ? baseExperience + 1 : baseExperience;

        return {
            index: index,
            unitId: unit.id,
            unit: unit, // Référence directe à l'unité parente
            x: position.x,
            y: position.y,

            // Rôle spécial
            role: role,
            experience: soldierExperience,

            // Position dans la formation
            row: position.row,
            col: position.col,
            formationX: position.x,
            formationY: position.y,
            isBorder: position.isBorder,

            // Direction et animation
            direction: this.getUnitDirection(unit),
            overrideFacing: null,
            isTurning: false,

            // État d'animation
            animState: 'idle',
            animFrame: 0,
            animTime: Math.random() * 1000,

            // Stats de combat individuelles
            maxHp: maxHp,
            hp: maxHp,
            attack: baseStats.attack + unitBonus.attack + attackBonus,
            defense: baseStats.defense + unitBonus.defense + defenseBonus,
            attackRange: baseStats.attackRange,
            attackCooldown: 0,
            attackSpeed: 800 + Math.random() * 200, // Variation individuelle

            // État
            isAlive: true,
            state: 'idle', // idle, moving, fighting, returning, dead

            // Combat individuel - système multi-cibles
            combatTarget: null,      // Cible principale (pour riposte prioritaire)
            engagedWith: [],         // Liste de tous les ennemis en combat avec ce soldat
            isEngaged: false,        // En train de se battre
            lastRiposteTarget: null, // Dernier ennemi contre-attaqué (pour alterner)
            avoidsCombat: roleConfig.avoidsCombat || false, // Porte-drapeau évite le combat

            // Système de désengagement
            disengageMode: 'none',   // 'none' | 'backing' | 'fleeing' | 'mutual'
            retreatDirection: null,  // Direction de recul {x, y} normalisée

            // Système de charge (cavalerie/éléphants)
            isCharging: false,       // En train de charger
            chargeStartPos: null,    // Position de début de charge {x, y}
            chargeSpeed: 0,          // Vitesse actuelle de charge
            chargeTargetUnit: null,  // Unité ciblée par la charge
            impactedSoldiers: [],    // Soldats déjà impactés pendant cette charge

            // Système de fatigue
            fatigue: 0,              // Fatigue actuelle (0-100)

            // Mouvement
            moveSpeed: baseStats.speed * (0.9 + Math.random() * 0.2),
            isMoving: false,
            isRepositioning: false,

            // Physique fluide pour système de mêlée
            velocity: { x: 0, y: 0 },    // Vélocité actuelle
            momentum: 0,                  // Momentum accumulé
            inMelee: false,              // En mêlée (formation ignorée partiellement)
            pushedBy: [],                // Soldats qui le poussent ce tick
            lastPushTime: 0,             // Dernier push reçu
            nearestEnemyDist: Infinity,  // Distance à l'ennemi le plus proche

            // Abilities actives sur ce soldat
            abilities: {
                pilumThrown: false,
                warcryActive: false,
                warcryEndTime: 0,
                berserkActive: false,
                berserkEndTime: 0
            }
        };
    }

    /**
     * Obtient la direction d'une unité
     */
    getUnitDirection(unit) {
        if (unit.facing !== undefined) {
            return this.battle.battleSpriteManager?.angleToDirection(unit.facing) || 'S';
        }
        return unit.side === 'attacker' ? 'E' : 'W';
    }

    /**
     * Met à jour le temps d'animation
     */
    updateAnimationTime(timestamp) {
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = timestamp;
        }
        const delta = timestamp - this.lastFrameTime;
        this.animationTime += delta;
        this.lastFrameTime = timestamp;
        return delta;
    }

    /**
     * Met à jour tous les soldats (animations, combat, mouvement)
     * @param {number} deltaTime - Temps écoulé en ms
     */
    updateAnimations(deltaTime) {
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];

        // Mettre à jour le tick de combat
        this.lastCombatTick += deltaTime;
        const shouldProcessCombat = this.lastCombatTick >= this.combatTickRate;
        if (shouldProcessCombat) {
            this.lastCombatTick = 0;
        }

        for (const unit of allUnits) {
            if (!unit.soldiers) continue;

            // Vérifier si l'unité doit fuir (moral à 0)
            this.checkUnitRouting(unit);

            // Vérifier si l'unité est interceptée par des ennemis
            this.checkFormationInterception(unit);

            // Vérifier si l'unité était en combat et que le combat est terminé
            this.checkCombatEnd(unit);

            for (const soldier of unit.soldiers) {
                if (!soldier.isAlive) continue;

                // Mettre à jour le temps d'animation
                soldier.animTime += deltaTime;
                soldier.attackCooldown = Math.max(0, soldier.attackCooldown - deltaTime);

                // Mettre à jour selon l'état du soldat
                switch (soldier.state) {
                    case 'routing':
                        this.updateRoutingSoldier(soldier, unit, deltaTime);
                        break;
                    case 'fighting':
                        this.updateFightingSoldier(soldier, unit, shouldProcessCombat);
                        break;
                    case 'charging':
                        this.updateChargingSoldier(soldier, unit, deltaTime);
                        break;
                    case 'moving':
                        this.updateMovingSoldier(soldier, unit, deltaTime);
                        break;
                    case 'returning':
                        this.updateReturningSoldier(soldier, deltaTime);
                        break;
                    default: // idle
                        this.updateIdleSoldier(soldier, unit);
                        break;
                }

                // Mettre à jour la fatigue du soldat
                this.updateFatigue(soldier);

                // Traiter les abilities automatiques
                this.processAbilities(soldier, deltaTime);

                // Mettre à jour l'animation visuelle
                this.updateSoldierAnimState(soldier, unit);
            }
        }

        // Chercher des combats entre soldats proches
        if (shouldProcessCombat) {
            this.findAndEngageCombats();
        }
    }

    /**
     * Vérifie si une unité doit fuir en fonction de son moral
     * Gère aussi la régénération du moral et le retour au combat
     */
    checkUnitRouting(unit) {
        const currentMorale = unit.morale || 100;

        // Si le moral est à 0 ou moins, l'unité fuit
        if (currentMorale <= 0 && unit.state !== 'routing') {
            unit.state = 'routing';

            // Déterminer la direction de fuite (opposée au centre de masse des ennemis)
            const enemies = unit.side === 'attacker' ? this.battle.defenderUnits : this.battle.attackerUnits;
            const aliveEnemies = enemies.filter(e => e.currentMen > 0);

            if (aliveEnemies.length > 0) {
                // Calculer le centre de masse des ennemis
                let enemyCenterX = 0;
                let enemyCenterY = 0;
                aliveEnemies.forEach(e => {
                    enemyCenterX += e.x;
                    enemyCenterY += e.y;
                });
                enemyCenterX /= aliveEnemies.length;
                enemyCenterY /= aliveEnemies.length;

                // Direction de fuite = opposée au centre des ennemis
                const dx = unit.x - enemyCenterX;
                const dy = unit.y - enemyCenterY;
                unit.routingAngle = Math.atan2(dy, dx);
            } else {
                // Pas d'ennemi, fuir vers le bord de la carte
                unit.routingAngle = unit.side === 'attacker' ? Math.PI : 0; // Gauche ou droite
            }

            // Tous les soldats passent en état routing
            if (unit.soldiers) {
                for (const soldier of unit.soldiers) {
                    if (soldier.isAlive && soldier.state !== 'fighting') {
                        soldier.state = 'routing';
                    }
                }
            }
        }
        // Si l'unité est en fuite, régénérer progressivement le moral
        else if (unit.state === 'routing') {
            // Régénération du moral quand l'unité fuit
            // Plus l'unité est loin des ennemis, plus elle récupère vite
            const enemies = unit.side === 'attacker' ? this.battle.defenderUnits : this.battle.attackerUnits;
            const aliveEnemies = enemies.filter(e => e.currentMen > 0);

            let minEnemyDist = Infinity;
            if (aliveEnemies.length > 0) {
                aliveEnemies.forEach(e => {
                    const dist = Math.hypot(e.x - unit.x, e.y - unit.y);
                    if (dist < minEnemyDist) minEnemyDist = dist;
                });
            }

            // Bonus de régénération si loin des ennemis (> 200 pixels)
            const distanceBonus = minEnemyDist > 200 ? 2 : 1;
            const moraleRegen = 0.5 * distanceBonus; // 0.5 à 1 point de moral par tick

            unit.morale = Math.min(100, (unit.morale || 0) + moraleRegen);

            // Si le moral remonte au-dessus de 30, l'unité se rallie
            if (unit.morale >= 30) {
                unit.state = 'idle';

                // Les soldats sortent de l'état routing et retournent en formation
                if (unit.soldiers) {
                    for (const soldier of unit.soldiers) {
                        if (soldier.isAlive && soldier.state === 'routing') {
                            soldier.state = 'returning';
                        }
                    }
                }
            }
        }
    }

    /**
     * Vérifie si une formation en déplacement est interceptée par des ennemis
     * Si interceptée, la formation se réoriente pour faire face aux attaquants
     * @param {Object} unit - L'unité à vérifier
     */
    checkFormationInterception(unit) {
        // Ne vérifier que les unités en mouvement qui ne sont pas déjà en combat
        if (unit.state !== 'moving' && unit.state !== 'attacking') return;
        if (!unit.soldiers) return;

        const enemies = unit.side === 'attacker' ? this.battle.defenderUnits : this.battle.attackerUnits;
        const aliveEnemies = enemies.filter(e => e.currentMen > 0);

        // Vérifier si des soldats ennemis sont à portée d'engagement
        let closestThreat = null;
        let closestThreatDist = Infinity;
        let engagedSoldiersCount = 0;

        for (const enemyUnit of aliveEnemies) {
            if (!enemyUnit.soldiers) continue;

            const unitDist = Math.hypot(enemyUnit.x - unit.x, enemyUnit.y - unit.y);

            // Si une unité ennemie est très proche (< 100 pixels)
            if (unitDist < 100 && unitDist < closestThreatDist) {
                closestThreat = enemyUnit;
                closestThreatDist = unitDist;
            }
        }

        // Compter les soldats déjà engagés en combat
        if (unit.soldiers) {
            engagedSoldiersCount = unit.soldiers.filter(s =>
                s.isAlive && s.state === 'fighting' && s.combatTarget?.isAlive
            ).length;
        }

        // Si intercepté et des soldats sont en combat, réorienter la formation
        if (closestThreat && engagedSoldiersCount > 0) {
            // Marquer l'unité comme interceptée
            unit.isIntercepted = true;
            unit.interceptingEnemy = closestThreat;

            // Si l'unité était en train d'attaquer une autre cible, continuer
            // Sinon, se réorienter pour faire face à l'intercepteur
            if (unit.state === 'moving') {
                // Calculer l'angle vers l'ennemi intercepteur
                const angleToThreat = Math.atan2(
                    closestThreat.y - unit.y,
                    closestThreat.x - unit.x
                );

                // Réorienter progressivement la formation vers la menace
                unit.facing = angleToThreat;

                // Mettre l'unité en mode défensif
                unit.state = 'defending';

                // Recalculer les positions de formation avec la nouvelle orientation
                if (this.battle.formationSystem) {
                    this.battle.formationSystem.updateFormationFacing(unit, angleToThreat);
                }
            }
        } else if (unit.isIntercepted && engagedSoldiersCount === 0) {
            // Plus de soldats en combat, l'interception est terminée
            unit.isIntercepted = false;
            unit.interceptingEnemy = null;

            // Compacter la formation après le combat
            if (this.battle.formationSystem) {
                this.battle.formationSystem.compactFormationAfterCombat(unit);
            }

            // Si l'unité était en mode défensif, revenir à l'état précédent
            if (unit.state === 'defending') {
                // Reprendre le mouvement ou l'attaque initiale
                if (unit.targetX !== null && unit.targetY !== null) {
                    unit.state = 'moving';
                } else if (unit.target) {
                    unit.state = 'attacking';
                } else {
                    unit.state = 'idle';
                }
            }
        }
    }

    /**
     * Vérifie si une unité a terminé son combat et doit se réorganiser
     * @param {Object} unit - L'unité à vérifier
     */
    checkCombatEnd(unit) {
        // Ne vérifier que les unités qui étaient en combat/attaque
        if (unit.state !== 'attacking' && unit.state !== 'defending') return;

        // Compter les soldats encore en combat
        const fightingSoldiers = unit.soldiers.filter(s =>
            s.isAlive && (s.state === 'fighting' || s.state === 'charging')
        ).length;

        // Si aucun soldat n'est en combat et que l'unité a un marqueur de combat terminé
        if (fightingSoldiers === 0) {
            // Vérifier si l'unité a déjà été compactée récemment
            if (!unit.lastCompactionTime || Date.now() - unit.lastCompactionTime > 2000) {
                // Compacter la formation
                if (this.battle.formationSystem) {
                    this.battle.formationSystem.compactFormationAfterCombat(unit);
                    unit.lastCompactionTime = Date.now();
                }
            }
        }
    }

    /**
     * Met à jour un soldat en fuite
     * Les soldats en fuite courent dans la direction opposée aux ennemis
     * Mais se défendent s'ils sont attaqués
     */
    updateRoutingSoldier(soldier, unit, deltaTime) {
        // Si le soldat est attaqué, il se défend brièvement
        if (soldier.combatTarget?.isAlive) {
            // Continuer le combat défensif
            this.updateFightingSoldier(soldier, unit, false);
            return;
        }

        // Fuir dans la direction de fuite de l'unité
        const routingAngle = unit.routingAngle || 0;
        const routingSpeed = soldier.moveSpeed * 1.5 * deltaTime * 0.1; // 50% plus rapide que la marche normale

        const dx = Math.cos(routingAngle) * routingSpeed;
        const dy = Math.sin(routingAngle) * routingSpeed;

        soldier.x += dx;
        soldier.y += dy;

        // Mettre à jour la direction visuelle
        soldier.direction = this.battle.battleSpriteManager?.angleToDirection(routingAngle) || soldier.direction;

        // Les soldats en fuite ne maintiennent pas la formation
        soldier.formationX = soldier.x;
        soldier.formationY = soldier.y;
    }

    /**
     * Compte le nombre d'attaquants sur une cible
     * Utilise la liste engagedWith de la cible
     * @param {Object} target - Le soldat cible
     * @returns {number} Nombre d'attaquants
     */
    countAttackersOnTarget(target) {
        if (!target || !target.engagedWith) return 0;
        return target.engagedWith.filter(e => e && e.isAlive).length;
    }

    /**
     * Vérifie si un soldat peut attaquer une cible en fonction de l'espace disponible
     * Basé sur l'encerclement : chaque attaquant occupe un arc autour de la cible
     * @param {Object} attacker - Le soldat qui veut attaquer
     * @param {Object} target - Le soldat cible
     * @returns {boolean} True si l'attaquant peut s'engager
     */
    canAttackTarget(attacker, target) {
        if (!target || !target.isAlive) return false;

        // Calculer l'arc occupé par le type d'attaquant
        const attackerType = attacker.unit?.type || 'infantry';
        const arcSize = ENCIRCLEMENT_CONFIG.attackerArcSize[attackerType] || 60;

        // Calculer le nombre max d'attaquants (360° / arcSize)
        const maxAttackers = Math.floor(360 / arcSize);

        // Compter les attaquants actuels sur cette cible
        const currentAttackers = this.countAttackersOnTarget(target);

        if (currentAttackers >= maxAttackers) {
            return false;
        }

        // Vérifier si l'angle d'approche est libre
        return this.isApproachAngleFree(attacker, target, arcSize);
    }

    /**
     * Vérifie si l'angle d'approche vers une cible est libre
     * @param {Object} attacker - Le soldat qui veut attaquer
     * @param {Object} target - Le soldat cible
     * @param {number} requiredArc - L'arc en degrés nécessaire pour attaquer
     * @returns {boolean} True si l'angle est libre
     */
    isApproachAngleFree(attacker, target, requiredArc) {
        // Calculer l'angle d'approche de l'attaquant
        const approachAngle = Math.atan2(attacker.y - target.y, attacker.x - target.x);
        const approachAngleDeg = (approachAngle * 180 / Math.PI + 360) % 360;

        // Récupérer tous les attaquants actuels sur cette cible
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];

        for (const unit of allUnits) {
            if (!unit.soldiers) continue;

            for (const soldier of unit.soldiers) {
                if (!soldier.isAlive || soldier === attacker) continue;
                if (soldier.combatTarget !== target) continue;

                // Calculer l'angle de cet attaquant
                const otherAngle = Math.atan2(soldier.y - target.y, soldier.x - target.x);
                const otherAngleDeg = (otherAngle * 180 / Math.PI + 360) % 360;

                // Calculer la différence d'angle
                let angleDiff = Math.abs(approachAngleDeg - otherAngleDeg);
                if (angleDiff > 180) angleDiff = 360 - angleDiff;

                // L'arc de l'autre attaquant selon son type
                const otherType = soldier.unit?.type || 'infantry';
                const otherArc = ENCIRCLEMENT_CONFIG.attackerArcSize[otherType] || 60;

                // Vérifier si les arcs se chevauchent
                const minDistance = (requiredArc + otherArc) / 2;
                if (angleDiff < minDistance) {
                    return false; // L'angle est bloqué
                }
            }
        }

        return true;
    }

    /**
     * Calcule le malus de défense dû à l'encerclement
     * @param {Object} soldier - Le soldat encerclé
     * @returns {number} Multiplicateur de défense (1.0 = normal, 0.5 = -50%)
     */
    getEncirclementDefenseMultiplier(soldier) {
        const attackerCount = this.countAttackersOnTarget(soldier);

        if (attackerCount <= 1) return 1.0;

        const penalties = ENCIRCLEMENT_CONFIG.encirclementPenalty;
        const penaltyKey = Math.min(attackerCount, 5);
        const penalty = penalties[penaltyKey] || 0;

        return 1.0 - penalty;
    }

    // ==========================================
    // SYSTÈME DE FATIGUE
    // ==========================================

    /**
     * Calcule les modificateurs de stats basés sur la fatigue
     * Les modificateurs sont interpolés linéairement entre les seuils
     * pour une transition fluide des effets
     * @param {Object} soldier - Le soldat
     * @returns {Object} Modificateurs {attack, defense, speed, level}
     */
    getFatigueModifiers(soldier) {
        const fatigue = soldier.fatigue || 0;
        const effects = FATIGUE_CONFIG.fatigueEffects;

        // Trouver le niveau de fatigue approprié et interpoler
        if (fatigue >= effects.exhausted.threshold) {
            return {
                attack: effects.exhausted.attackMod,
                defense: effects.exhausted.defenseMod,
                speed: effects.exhausted.speedMod,
                level: 'exhausted'
            };
        } else if (fatigue >= effects.severe.threshold) {
            // Interpolation entre severe et exhausted
            const ratio = (fatigue - effects.severe.threshold) / (effects.exhausted.threshold - effects.severe.threshold);
            return {
                attack: effects.severe.attackMod - ratio * (effects.severe.attackMod - effects.exhausted.attackMod),
                defense: effects.severe.defenseMod - ratio * (effects.severe.defenseMod - effects.exhausted.defenseMod),
                speed: effects.severe.speedMod - ratio * (effects.severe.speedMod - effects.exhausted.speedMod),
                level: 'severe'
            };
        } else if (fatigue >= effects.moderate.threshold) {
            const ratio = (fatigue - effects.moderate.threshold) / (effects.severe.threshold - effects.moderate.threshold);
            return {
                attack: effects.moderate.attackMod - ratio * (effects.moderate.attackMod - effects.severe.attackMod),
                defense: effects.moderate.defenseMod - ratio * (effects.moderate.defenseMod - effects.severe.defenseMod),
                speed: effects.moderate.speedMod - ratio * (effects.moderate.speedMod - effects.severe.speedMod),
                level: 'moderate'
            };
        } else if (fatigue >= effects.light.threshold) {
            const ratio = (fatigue - effects.light.threshold) / (effects.moderate.threshold - effects.light.threshold);
            return {
                attack: effects.light.attackMod - ratio * (effects.light.attackMod - effects.moderate.attackMod),
                defense: effects.light.defenseMod - ratio * (effects.light.defenseMod - effects.moderate.defenseMod),
                speed: effects.light.speedMod - ratio * (effects.light.speedMod - effects.moderate.speedMod),
                level: 'light'
            };
        }

        // Pas de fatigue significative
        return { attack: 1.0, defense: 1.0, speed: 1.0, level: 'fresh' };
    }

    /**
     * Ajoute de la fatigue à un soldat
     * @param {Object} soldier - Le soldat
     * @param {string} source - Source de fatigue (clé de FATIGUE_CONFIG.fatigueSources)
     * @param {number} multiplier - Multiplicateur optionnel (ex: nombre d'attaquants)
     */
    addFatigue(soldier, source, multiplier = 1) {
        const fatigueAmount = (FATIGUE_CONFIG.fatigueSources[source] || 0) * multiplier;
        soldier.fatigue = Math.min(FATIGUE_CONFIG.maxFatigue, (soldier.fatigue || 0) + fatigueAmount);
    }

    /**
     * Récupère de la fatigue pour un soldat selon son état
     * @param {Object} soldier - Le soldat
     * @param {string} state - État actuel ('idle', 'walking', 'inCombat')
     */
    recoverFatigue(soldier, state) {
        const recoveryAmount = FATIGUE_CONFIG.fatigueRecovery[state] || 0;
        soldier.fatigue = Math.max(0, (soldier.fatigue || 0) - recoveryAmount);
    }

    /**
     * Met à jour la fatigue d'un soldat selon son état actuel
     * Gère l'accumulation et la récupération de fatigue
     * @param {Object} soldier - Le soldat
     */
    updateFatigue(soldier) {
        if (!soldier.isAlive) return;

        switch (soldier.state) {
            case 'idle':
                this.recoverFatigue(soldier, 'idle');
                break;

            case 'moving':
            case 'returning':
                // Marche normale - légère récupération
                this.recoverFatigue(soldier, 'walking');
                break;

            case 'charging':
                // Charge - augmente la fatigue
                this.addFatigue(soldier, 'charging');
                break;

            case 'fighting':
                // Combat - pas de récupération, fatigue d'encerclement
                const attackerCount = this.countAttackersOnTarget(soldier);
                if (attackerCount >= 2) {
                    // Fatigue supplémentaire par attaquant au-delà de 1
                    this.addFatigue(soldier, 'encircled', attackerCount - 1);
                }
                break;

            case 'routing':
                // Fuite = course
                this.addFatigue(soldier, 'running');
                break;
        }
    }

    /**
     * Calcule la force de cohésion qui tire un soldat vers sa formation
     * @param {Object} soldier - Le soldat
     * @returns {Object|null} Force {x, y, strength, distance} ou null si pas de force
     */
    calculateCohesionForce(soldier) {
        // Distance à la position de formation
        const dx = soldier.formationX - soldier.x;
        const dy = soldier.formationY - soldier.y;
        const dist = Math.hypot(dx, dy);

        // Pas de force si trop proche
        if (dist < COHESION_CONFIG.cohesionStartDistance) {
            return null;
        }

        // Force proportionnelle à la distance (normalisée entre 0 et maxCohesionStrength)
        const normalizedDist = Math.min(
            (dist - COHESION_CONFIG.cohesionStartDistance) /
            (COHESION_CONFIG.cohesionMaxDistance - COHESION_CONFIG.cohesionStartDistance),
            1.0
        );
        const strength = normalizedDist * COHESION_CONFIG.maxCohesionStrength;

        // Direction normalisée vers la formation
        return {
            x: dx / dist,
            y: dy / dist,
            strength: strength,
            distance: dist
        };
    }

    /**
     * Vérifie si deux soldats peuvent se désengager mutuellement
     * (quand leurs groupes s'éloignent dans des directions opposées)
     * @param {Object} soldier - Le soldat
     * @param {Object} enemy - L'ennemi engagé
     * @returns {boolean} True si désengagement mutuel possible
     */
    checkMutualDisengage(soldier, enemy) {
        if (!soldier.unit || !enemy.unit) return false;

        // Calculer la distance entre les formations des deux soldats
        const soldierToFormation = Math.hypot(
            soldier.formationX - soldier.x,
            soldier.formationY - soldier.y
        );
        const enemyToFormation = Math.hypot(
            enemy.formationX - enemy.x,
            enemy.formationY - enemy.y
        );

        // Si les deux sont loin de leur formation, désengagement mutuel possible
        const bothFarFromFormation =
            soldierToFormation > COHESION_CONFIG.mutualDisengageDistance &&
            enemyToFormation > COHESION_CONFIG.mutualDisengageDistance;

        if (!bothFarFromFormation) return false;

        // Vérifier que les formations s'éloignent l'une de l'autre
        const formationDistance = Math.hypot(
            soldier.formationX - enemy.formationX,
            soldier.formationY - enemy.formationY
        );
        const currentDistance = Math.hypot(soldier.x - enemy.x, enemy.y - soldier.y);

        // Les formations sont plus éloignées que les soldats = elles s'éloignent
        return formationDistance > currentDistance * 1.5;
    }

    /**
     * Tente de désengager un soldat de son combat
     * @param {Object} soldier - Le soldat qui veut se désengager
     * @param {string} mode - Mode de désengagement: 'backing' (recul défensif) ou 'fleeing' (fuite)
     * @returns {boolean} True si le désengagement a commencé
     */
    attemptDisengage(soldier, mode = 'backing') {
        if (soldier.engagedWith.length === 0) return true;

        // Vérifier le désengagement mutuel avec tous les ennemis
        let canMutualDisengage = true;
        for (const enemy of soldier.engagedWith) {
            if (!this.checkMutualDisengage(soldier, enemy)) {
                canMutualDisengage = false;
                break;
            }
        }

        if (canMutualDisengage) {
            // Désengagement mutuel: pas de pénalité
            soldier.disengageMode = 'mutual';

            // L'ennemi se désengage aussi
            for (const enemy of soldier.engagedWith) {
                enemy.disengageMode = 'mutual';
                enemy.engagedWith = enemy.engagedWith.filter(e => e !== soldier);
                if (enemy.combatTarget === soldier) {
                    enemy.combatTarget = enemy.engagedWith.length > 0 ? enemy.engagedWith[0] : null;
                }
            }

            soldier.engagedWith = [];
            soldier.combatTarget = null;
            soldier.state = 'returning';
            soldier.isEngaged = false;
            return true;
        }

        // Sinon, désengagement forcé
        soldier.disengageMode = mode;

        // Calculer la direction de recul (vers la formation)
        const dx = soldier.formationX - soldier.x;
        const dy = soldier.formationY - soldier.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            soldier.retreatDirection = { x: dx / dist, y: dy / dist };
        } else {
            // Fallback: direction opposée à l'ennemi principal
            const enemy = soldier.combatTarget || soldier.engagedWith[0];
            if (enemy) {
                const edx = soldier.x - enemy.x;
                const edy = soldier.y - enemy.y;
                const edist = Math.hypot(edx, edy);
                soldier.retreatDirection = edist > 0 ? { x: edx / edist, y: edy / edist } : { x: 1, y: 0 };
            }
        }

        return false;
    }

    /**
     * Trouve et engage les combats entre soldats de camps opposés
     * Utilise la distance de combat réduite pour des mêlées au corps-à-corps
     */
    findAndEngageCombats() {
        const attackerUnits = this.battle.attackerUnits || [];
        const defenderUnits = this.battle.defenderUnits || [];
        const playerFaction = this.battle.game?.playerFaction;

        // Distance de combat rapproché (quasi contact physique)
        const combatDistance = FLUID_MOVEMENT_CONFIG.combatDistance;

        // Traiter les combats pour les deux camps
        const processCombatForUnits = (ourUnits, enemyUnits) => {
            for (const ourUnit of ourUnits) {
                if (!ourUnit.soldiers) continue;

                // IMPORTANT: Les unités du joueur ne doivent PAS attaquer automatiquement
                // SAUF si le joueur leur a donné l'ordre (state='attacking' avec une cible)
                const isPlayerUnit = ourUnit.faction === playerFaction;
                if (isPlayerUnit) {
                    // L'unité du joueur ne peut attaquer QUE si elle a reçu un ordre explicite
                    if (ourUnit.state !== 'attacking' || !ourUnit.target) {
                        continue;
                    }
                }

                // Chercher des ennemis proches
                for (const enemyUnit of enemyUnits) {
                    if (!enemyUnit.soldiers) continue;

                    // Pour les unités du joueur, ne combattre QUE la cible désignée
                    if (isPlayerUnit && enemyUnit !== ourUnit.target) {
                        continue;
                    }

                    // Vérifier si les unités sont assez proches pour combattre
                    const unitDist = Math.hypot(enemyUnit.x - ourUnit.x, enemyUnit.y - ourUnit.y);
                    if (unitDist > 150) continue; // Trop loin

                    // Chercher des paires de soldats pour combattre
                    for (const ourSoldier of ourUnit.soldiers) {
                        if (!ourSoldier.isAlive || ourSoldier.state === 'charging') continue;

                        // IMPORTANT: Les soldats en fuite ne cherchent PAS à combattre
                        if (ourSoldier.state === 'routing') continue;

                        // Le porte-drapeau évite le combat sauf s'il est directement attaqué
                        if (ourSoldier.avoidsCombat) continue;

                        // Les soldats déjà en combat peuvent engager des ennemis supplémentaires
                        // s'ils sont en mêlée et ont de la place
                        const alreadyFighting = ourSoldier.state === 'fighting';
                        const maxTargets = ourSoldier.inMelee ? 2 : 1;
                        const currentTargets = ourSoldier.engagedWith?.length || 0;

                        if (alreadyFighting && currentTargets >= maxTargets) continue;

                        // Collecter tous les ennemis à portée de combat
                        const enemiesInRange = [];

                        for (const enemySoldier of enemyUnit.soldiers) {
                            if (!enemySoldier.isAlive) continue;

                            // Ne pas cibler les soldats en fuite
                            if (enemySoldier.state === 'routing' && !enemySoldier.combatTarget) continue;

                            // Ne pas re-cibler un ennemi déjà engagé
                            if (ourSoldier.engagedWith?.includes(enemySoldier)) continue;

                            const dist = Math.hypot(enemySoldier.x - ourSoldier.x, enemySoldier.y - ourSoldier.y);

                            // Distance d'engagement: combatDistance pour mêlée, attackRange sinon
                            const isRanged = ourSoldier.attackRange > 20;
                            const engageRange = isRanged ? ourSoldier.attackRange : combatDistance;

                            if (dist <= engageRange) {
                                if (this.canAttackTarget(ourSoldier, enemySoldier)) {
                                    enemiesInRange.push({ soldier: enemySoldier, dist });
                                }
                            }
                        }

                        // Trier par distance et engager le plus proche (ou plusieurs en mêlée)
                        enemiesInRange.sort((a, b) => a.dist - b.dist);

                        const toEngage = enemiesInRange.slice(0, maxTargets - currentTargets);
                        for (const { soldier: enemySoldier } of toEngage) {
                            this.engageCombat(ourSoldier, enemySoldier);
                        }
                    }
                }
            }
        };

        // Traiter les combats dans les deux sens
        processCombatForUnits(attackerUnits, defenderUnits);
        processCombatForUnits(defenderUnits, attackerUnits);

        // Mettre à jour le bonus de moral du porte-drapeau
        this.updateStandardBearerMorale();

        // Résoudre les collisions entre soldats
        this.resolveSoldierCollisions();
    }

    /**
     * Met à jour le bonus de moral provenant des porte-drapeaux
     */
    updateStandardBearerMorale() {
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];

        for (const unit of allUnits) {
            if (!unit.standardBearer?.isAlive) continue;

            // Bonus de moral du porte-drapeau vivant
            const moraleBonus = SPECIAL_ROLES.standardBearer.moraleAura;

            // Appliquer un léger bonus de moral (régénération)
            if (unit.morale < 100) {
                unit.morale = Math.min(100, (unit.morale || 100) + moraleBonus * 0.01);
            }
        }
    }

    /**
     * Engage deux soldats en combat
     * Gère le système multi-cibles avec engagedWith
     * @param {Object} soldier1 - Le soldat qui initie l'attaque
     * @param {Object} soldier2 - Le soldat ciblé
     */
    engageCombat(soldier1, soldier2) {
        // IMPORTANT: Un soldat en fuite ne se bat PAS activement
        if (soldier1.state !== 'routing') {
            soldier1.state = 'fighting';
            soldier1.combatTarget = soldier2;
            soldier1.isEngaged = true;
            soldier1.isMoving = false;
            soldier1.isRepositioning = false;

            // Ajouter soldier2 à la liste des engagés de soldier1 s'il n'y est pas déjà
            if (!soldier1.engagedWith.includes(soldier2)) {
                soldier1.engagedWith.push(soldier2);
            }
        }

        // Le défenseur ajoute l'attaquant à sa liste d'engagés
        if (!soldier2.engagedWith.includes(soldier1)) {
            soldier2.engagedWith.push(soldier1);
        }

        // Le défenseur ne change de cible principale que s'il n'en a pas déjà une vivante
        if (!soldier2.combatTarget || !soldier2.combatTarget.isAlive) {
            soldier2.state = 'fighting';
            soldier2.combatTarget = soldier1;
            soldier2.isEngaged = true;
            soldier2.isMoving = false;
            soldier2.isRepositioning = false;
        }

        // IMPORTANT: Si une unité du joueur est attaquée, elle doit automatiquement
        // contre-attaquer l'unité ennemie (passer en mode 'attacking')
        const playerFaction = this.battle.game?.playerFaction;
        const unit1 = soldier1.unit;
        const unit2 = soldier2.unit;

        if (unit2 && unit2.faction === playerFaction) {
            if (unit2.state !== 'attacking' || !unit2.target) {
                unit2.state = 'attacking';
                unit2.target = unit1;
            }
        }

        if (unit1 && unit1.faction === playerFaction) {
            if (unit1.state !== 'attacking' || !unit1.target) {
                unit1.state = 'attacking';
                unit1.target = unit2;
            }
        }

        // Faire face à l'ennemi
        this.faceSoldierTowards(soldier1, soldier2);
        if (soldier2.combatTarget === soldier1) {
            this.faceSoldierTowards(soldier2, soldier1);
        }
    }

    /**
     * Construit une grille spatiale pour optimiser la détection de collisions
     * @param {Array} soldiers - Liste des soldats
     * @param {number} cellSize - Taille d'une cellule de la grille
     * @returns {Map} Grille spatiale indexée par clé de cellule
     */
    buildSpatialGrid(soldiers, cellSize) {
        const grid = new Map();

        for (const soldier of soldiers) {
            const cellX = Math.floor(soldier.x / cellSize);
            const cellY = Math.floor(soldier.y / cellSize);
            const key = `${cellX},${cellY}`;

            if (!grid.has(key)) {
                grid.set(key, []);
            }
            grid.get(key).push(soldier);
        }

        return grid;
    }

    /**
     * Récupère les soldats dans les cellules adjacentes (incluant la cellule actuelle)
     * @param {Map} grid - Grille spatiale
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} cellSize - Taille d'une cellule
     * @returns {Array} Soldats proches
     */
    getNearbySoldiers(grid, x, y, cellSize) {
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        const nearby = [];

        // Parcourir les 9 cellules adjacentes
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                const cell = grid.get(key);
                if (cell) {
                    nearby.push(...cell);
                }
            }
        }

        return nearby;
    }

    /**
     * Résout les collisions entre soldats avec système de physique fluide
     * Les formations se mélangent au contact, les soldats se poussent et se bousculent
     */
    resolveSoldierCollisions() {
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];
        const allSoldiers = [];

        // Collecter tous les soldats vivants avec leurs métadonnées
        for (const unit of allUnits) {
            if (!unit.soldiers) continue;
            for (const soldier of unit.soldiers) {
                if (soldier.isAlive) {
                    soldier._unit = unit;
                    soldier._side = unit.side;
                    soldier._style = this.getCombatStyle(unit);
                    soldier._mass = SOLDIER_COLLISION.massMultiplier[unit.type] || 1.0;
                    soldier.pushedBy = [];
                    soldier.nearestEnemyDist = Infinity;
                    allSoldiers.push(soldier);
                }
            }
        }

        if (allSoldiers.length === 0) return;

        // Construire la grille spatiale pour optimisation
        const cellSize = FLUID_MOVEMENT_CONFIG.spatialGridCellSize;
        const spatialGrid = this.buildSpatialGrid(allSoldiers, cellSize);

        // Parcourir chaque soldat et traiter les collisions avec les voisins
        for (const s1 of allSoldiers) {
            const nearby = this.getNearbySoldiers(spatialGrid, s1.x, s1.y, cellSize);

            for (const s2 of nearby) {
                if (s1 === s2) continue;
                if (s1.index > s2.index && s1._side === s2._side) continue; // Éviter double traitement alliés

                const dx = s2.x - s1.x;
                const dy = s2.y - s1.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 0.1) continue;

                const isEnemyContact = s1._side !== s2._side;

                // Mettre à jour la distance à l'ennemi le plus proche
                if (isEnemyContact) {
                    if (dist < s1.nearestEnemyDist) s1.nearestEnemyDist = dist;
                    if (dist < s2.nearestEnemyDist) s2.nearestEnemyDist = dist;
                }

                // Déterminer la distance minimale selon le type de contact
                const minDist = isEnemyContact
                    ? SOLDIER_COLLISION.enemyMinDistance
                    : SOLDIER_COLLISION.minDistance;

                if (dist >= minDist) continue;

                // Collision détectée
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                // Calculer les forces selon le contexte
                const s1IsCharging = s1.state === 'charging' || s1.state === 'moving';
                const s2IsCharging = s2.state === 'charging' || s2.state === 'moving';
                const s1InMelee = s1.inMelee || s1.state === 'fighting';
                const s2InMelee = s2.inMelee || s2.state === 'fighting';

                let force;
                if (isEnemyContact) {
                    // Contact ennemi: force de poussée plus forte, bousculade
                    force = overlap * SOLDIER_COLLISION.enemyPushForce;

                    // Bonus si charge ou mouvement agressif
                    if (s1IsCharging && s1._style === 'aggressive') {
                        force += SOLDIER_COLLISION.chargeImpact * s1._mass * 0.5;
                    }
                    if (s2IsCharging && s2._style === 'aggressive') {
                        force += SOLDIER_COLLISION.chargeImpact * s2._mass * 0.5;
                    }

                    // Multiplicateur si poussé par plusieurs soldats
                    const s1PushCount = s1.pushedBy.length;
                    const s2PushCount = s2.pushedBy.length;
                    if (s1PushCount > 1) force *= 1 + (s1PushCount - 1) * 0.2;
                    if (s2PushCount > 1) force *= 1 + (s2PushCount - 1) * 0.2;

                    // Marquer comme en mêlée si très proche
                    if (dist < FLUID_MOVEMENT_CONFIG.combatDistance) {
                        s1.inMelee = true;
                        s2.inMelee = true;
                    }
                } else {
                    // Contact allié: séparation légère
                    force = overlap * SOLDIER_COLLISION.separationForce;
                }

                // Résistance selon le style de combat
                const s1Resistance = SOLDIER_COLLISION.pushbackResistance[s1._style] || 0.5;
                const s2Resistance = SOLDIER_COLLISION.pushbackResistance[s2._style] || 0.5;

                // Bonus de résistance en combat
                const s1CombatBonus = s1InMelee ? 0.4 : 0;
                const s2CombatBonus = s2InMelee ? 0.4 : 0;

                // Calcul du ratio de déplacement basé sur masse et résistance
                const s1TotalResist = (s1Resistance + s1CombatBonus) * s1._mass;
                const s2TotalResist = (s2Resistance + s2CombatBonus) * s2._mass;
                const totalResist = s1TotalResist + s2TotalResist;

                const s1Ratio = s2TotalResist / totalResist;
                const s2Ratio = s1TotalResist / totalResist;

                const s1Push = force * s1Ratio;
                const s2Push = force * s2Ratio;

                // Appliquer la vélocité plutôt que le déplacement direct
                s1.velocity.x -= nx * s1Push * SOLDIER_COLLISION.momentumTransfer;
                s1.velocity.y -= ny * s1Push * SOLDIER_COLLISION.momentumTransfer;
                s2.velocity.x += nx * s2Push * SOLDIER_COLLISION.momentumTransfer;
                s2.velocity.y += ny * s2Push * SOLDIER_COLLISION.momentumTransfer;

                // Enregistrer qui pousse qui pour la back pressure
                if (isEnemyContact) {
                    s1.pushedBy.push(s2);
                    s2.pushedBy.push(s1);
                }

                // Accumuler le momentum
                s1.momentum += s1Push;
                s2.momentum += s2Push;

                // Effet de désordre pour les gros impacts
                if (isEnemyContact && force > 2) {
                    if (Math.random() < 0.2) s1.isRepositioning = true;
                    if (Math.random() < 0.2) s2.isRepositioning = true;
                }
            }
        }

        // Appliquer la back pressure pour chaque unité
        for (const unit of allUnits) {
            if (unit.soldiers && unit.state === 'attacking') {
                this.applyBackPressure(unit);
            }
        }

        // Nettoyer les références temporaires
        for (const soldier of allSoldiers) {
            delete soldier._unit;
            delete soldier._side;
            delete soldier._style;
            delete soldier._mass;
        }
    }

    /**
     * Applique la pression des rangs arrière vers l'avant
     * Crée un effet de vague qui pousse le front vers l'ennemi
     * @param {Object} unit - L'unité
     */
    applyBackPressure(unit) {
        if (!unit.soldiers || !unit.target) return;

        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        if (aliveSoldiers.length === 0) return;

        // Calculer la direction vers l'ennemi
        const targetX = unit.target.x;
        const targetY = unit.target.y;
        const dirX = targetX - unit.x;
        const dirY = targetY - unit.y;
        const dirLen = Math.hypot(dirX, dirY);

        if (dirLen < 1) return;

        const pushDirX = dirX / dirLen;
        const pushDirY = dirY / dirLen;

        // Identifier les soldats par rang (approximatif basé sur position)
        const config = this.battle.formationSystem?.getFormationConfig(unit);
        const maxRows = config?.rows || 6;

        for (const soldier of aliveSoldiers) {
            // Les soldats des rangs arrière poussent vers l'avant
            const rowRatio = soldier.row / maxRows;

            // Plus le soldat est à l'arrière, plus il pousse
            if (rowRatio > 0.3) {
                const pushForce = SOLDIER_COLLISION.backlinePushForce * rowRatio;

                // Appliquer la force de poussée vers l'ennemi
                soldier.velocity.x += pushDirX * pushForce;
                soldier.velocity.y += pushDirY * pushForce;
            }

            // Les soldats du front en mêlée reçoivent la pression des rangs arrière
            if (soldier.inMelee && soldier.row < 2) {
                // Compter les alliés derrière qui poussent
                let backPushCount = 0;
                for (const ally of aliveSoldiers) {
                    if (ally === soldier) continue;
                    if (ally.row > soldier.row && ally.col === soldier.col) {
                        backPushCount++;
                    }
                }

                if (backPushCount > 0) {
                    const crowdPush = FLUID_MOVEMENT_CONFIG.backPressure * backPushCount;
                    soldier.velocity.x += pushDirX * crowdPush;
                    soldier.velocity.y += pushDirY * crowdPush;
                }
            }
        }
    }

    /**
     * Fait tourner un soldat vers un autre
     */
    faceSoldierTowards(soldier, target) {
        const dx = target.x - soldier.x;
        const dy = target.y - soldier.y;
        const angle = Math.atan2(dy, dx);
        soldier.direction = this.battle.battleSpriteManager?.angleToDirection(angle) || 'E';
    }

    /**
     * Met à jour un soldat en combat
     * Gère le combat contre plusieurs adversaires et le dilemme avec le groupe
     * @param {Object} soldier - Le soldat en combat
     * @param {Object} _unit - L'unité parente (non utilisé directement)
     * @param {boolean} shouldProcessCombat - Si true, traiter une attaque ce tick
     */
    updateFightingSoldier(soldier, unit, shouldProcessCombat) {
        // Nettoyer la liste des engagés (retirer les morts)
        soldier.engagedWith = soldier.engagedWith.filter(enemy => enemy && enemy.isAlive);

        // Si plus aucun ennemi engagé, retourner en formation
        if (soldier.engagedWith.length === 0) {
            soldier.state = 'returning';
            soldier.combatTarget = null;
            soldier.isEngaged = false;
            soldier.disengageMode = 'none';
            soldier.inMelee = false;
            return;
        }

        // Marquer le soldat comme en mêlée
        soldier.inMelee = true;

        // Vérifier si la cible principale est toujours valide
        if (!soldier.combatTarget?.isAlive) {
            soldier.combatTarget = soldier.engagedWith[0];
        }

        // Gérer le mode de désengagement actif
        if (soldier.disengageMode === 'backing' || soldier.disengageMode === 'fleeing') {
            this.updateDisengagingSoldier(soldier, shouldProcessCombat);
            return;
        }

        const target = soldier.combatTarget;
        const dist = Math.hypot(target.x - soldier.x, target.y - soldier.y);

        // Appliquer la physique fluide (bousculade en mêlée)
        // Les soldats en combat bougent aussi avec les collisions
        if (soldier.velocity) {
            const friction = FLUID_MOVEMENT_CONFIG.velocityFriction;
            soldier.x += soldier.velocity.x;
            soldier.y += soldier.velocity.y;
            soldier.velocity.x *= friction;
            soldier.velocity.y *= friction;

            // Attraction vers la cible si trop loin
            if (dist > FLUID_MOVEMENT_CONFIG.combatDistance) {
                const dx = target.x - soldier.x;
                const dy = target.y - soldier.y;
                const attractForce = FLUID_MOVEMENT_CONFIG.meleeAttractionForce * 0.5;
                soldier.velocity.x += (dx / dist) * attractForce;
                soldier.velocity.y += (dy / dist) * attractForce;
            }
        }

        // Calculer la force de cohésion (réduite en mêlée)
        const cohesion = this.calculateCohesionForce(soldier);

        // La cohésion est plus faible en mêlée, le soldat peut s'éloigner de la formation
        if (cohesion && cohesion.strength > 0.2 && !soldier.inMelee) {
            const driftSpeed = COHESION_CONFIG.combatDriftSpeed * cohesion.strength * 0.5;

            soldier.x += cohesion.x * driftSpeed;
            soldier.y += cohesion.y * driftSpeed;

            // Vérifier si désengagement mutuel possible
            for (const enemy of soldier.engagedWith) {
                if (this.checkMutualDisengage(soldier, enemy)) {
                    this.attemptDisengage(soldier, 'mutual');
                    return;
                }
            }
        }

        // Utiliser la distance de combat réduite pour déterminer si trop loin
        const maxCombatDist = soldier.attackRange > 20
            ? soldier.attackRange * 1.5
            : FLUID_MOVEMENT_CONFIG.combatDistance * 3;

        if (dist > maxCombatDist) {
            // Cible trop loin, la retirer des engagés
            soldier.engagedWith = soldier.engagedWith.filter(e => e !== target);
            soldier.combatTarget = soldier.engagedWith.length > 0 ? soldier.engagedWith[0] : null;

            if (!soldier.combatTarget) {
                soldier.state = 'returning';
                soldier.isEngaged = false;
                soldier.disengageMode = 'none';
                soldier.inMelee = false;
            }
            return;
        }

        // Faire face à la cible
        this.faceSoldierTowards(soldier, target);

        // Attaquer si cooldown terminé
        if (soldier.attackCooldown <= 0 && shouldProcessCombat) {
            const attackTarget = this.chooseAttackTarget(soldier);
            if (attackTarget) {
                this.soldierAttack(soldier, attackTarget);
                soldier.attackCooldown = soldier.attackSpeed;
            }
        }
    }

    /**
     * Met à jour un soldat qui tente de se désengager
     * @param {Object} soldier - Le soldat qui se désengage
     * @param {boolean} shouldProcessCombat - Si true, peut contre-attaquer
     */
    updateDisengagingSoldier(soldier, shouldProcessCombat) {
        if (!soldier.retreatDirection) {
            soldier.disengageMode = 'none';
            return;
        }

        const isBacking = soldier.disengageMode === 'backing';
        const speed = soldier.moveSpeed * (isBacking ? COHESION_CONFIG.defensiveRetreatSpeedRatio : 0.8);

        // Se déplacer dans la direction de recul
        soldier.x += soldier.retreatDirection.x * speed * 0.1;
        soldier.y += soldier.retreatDirection.y * speed * 0.1;

        // Si recul défensif, peut encore se défendre (mais pas attaquer activement)
        if (isBacking && shouldProcessCombat && soldier.attackCooldown <= 0) {
            // Peut bloquer/riposter si attaqué, mais avec malus
            // La riposte est gérée automatiquement par le système d'attaque adverse
        }

        // Mettre à jour la direction visuelle
        if (isBacking && soldier.combatTarget) {
            // En recul défensif, faire face à l'ennemi
            this.faceSoldierTowards(soldier, soldier.combatTarget);
        } else {
            // En fuite, faire face à la direction de fuite
            const angle = Math.atan2(soldier.retreatDirection.y, soldier.retreatDirection.x);
            soldier.direction = this.battle.battleSpriteManager?.angleToDirection(angle) || soldier.direction;
        }

        // Vérifier si assez loin pour être désengagé
        let stillEngaged = false;
        for (const enemy of [...soldier.engagedWith]) {
            const dist = Math.hypot(enemy.x - soldier.x, enemy.y - soldier.y);
            if (dist <= soldier.attackRange * 2) {
                stillEngaged = true;
            } else {
                // Retirer cet ennemi de la liste
                soldier.engagedWith = soldier.engagedWith.filter(e => e !== enemy);
                enemy.engagedWith = enemy.engagedWith.filter(e => e !== soldier);
            }
        }

        // Si plus d'ennemi proche, désengagement réussi
        if (!stillEngaged || soldier.engagedWith.length === 0) {
            soldier.state = 'returning';
            soldier.combatTarget = null;
            soldier.isEngaged = false;
            soldier.disengageMode = 'none';
            soldier.retreatDirection = null;
        }
    }

    /**
     * Choisit quelle cible attaquer parmi les engagés
     * Les soldats expérimentés peuvent alterner entre plusieurs cibles
     * @param {Object} soldier - Le soldat qui attaque
     * @returns {Object|null} La cible choisie
     */
    chooseAttackTarget(soldier) {
        if (soldier.engagedWith.length === 0) return null;
        if (soldier.engagedWith.length === 1) return soldier.engagedWith[0];

        // Expérience du soldat (0-5+)
        const experience = soldier.experience || 0;

        // Chance de frapper un ennemi secondaire (basé sur expérience)
        // Exp 0: 0%, Exp 1: 5%, Exp 2: 10%, Exp 3: 15%, Exp 4: 20%, Exp 5+: 25%
        const secondaryTargetChance = Math.min(experience * 0.05, 0.25);

        if (Math.random() < secondaryTargetChance && soldier.engagedWith.length > 1) {
            // Frapper un ennemi secondaire (pas la cible principale)
            // Alterner avec le dernier ciblé pour éviter de toujours frapper le même
            const secondaries = soldier.engagedWith.filter(e =>
                e !== soldier.combatTarget && e !== soldier.lastRiposteTarget
            );

            if (secondaries.length > 0) {
                const target = secondaries[Math.floor(Math.random() * secondaries.length)];
                soldier.lastRiposteTarget = target;
                return target;
            }
        }

        // Frapper la cible principale
        soldier.lastRiposteTarget = soldier.combatTarget;
        return soldier.combatTarget;
    }

    /**
     * Un soldat attaque sa cible
     * Integre les modificateurs de fatigue et d'abilities
     */
    soldierAttack(attacker, defender) {
        const debugManager = this.battle.debugManager;

        // Chance de miss (10%)
        if (Math.random() < 0.1) {
            debugManager?.addDamageNumber(defender.x, defender.y - 10, 0, 'missed');
            return;
        }

        // Appliquer les modificateurs de fatigue et d'abilities a l'attaquant
        const attackerFatigueMods = this.getFatigueModifiers(attacker);
        const attackerAbilityMods = this.getAbilityModifiers(attacker);
        const baseDamage = attacker.attack * attackerFatigueMods.attack * attackerAbilityMods.attack;

        // Ajouter fatigue pour avoir attaqué (sauf si berserk ignore la fatigue)
        if (!attacker.abilities?.berserkActive || !ABILITY_CONFIG.berserk.ignoreFatigue) {
            this.addFatigue(attacker, 'attackGiven');
        }

        // Appliquer le malus d'encerclement à la défense
        const encirclementMultiplier = this.getEncirclementDefenseMultiplier(defender);

        // Vérifier si le défenseur a le dos tourné (en fuite ou recul)
        let backTurnedMultiplier = 1.0;
        if (defender.disengageMode === 'fleeing') {
            backTurnedMultiplier = COHESION_CONFIG.backTurnedDamageMultiplier;
        }

        // Appliquer la fatigue et les abilities du défenseur
        const defenderFatigueMods = this.getFatigueModifiers(defender);
        const defenderAbilityMods = this.getAbilityModifiers(defender);

        // Calculer la défense avec tous les modificateurs
        const defenseReduction = defender.disengageMode === 'fleeing'
            ? COHESION_CONFIG.backTurnedDefenseMultiplier
            : 1.0;
        const defense = defender.defense * encirclementMultiplier * defenderFatigueMods.defense * defenderAbilityMods.defense * defenseReduction;

        // Chance de block (15% basé sur defense) - impossible si en fuite
        const blockChance = defender.disengageMode === 'fleeing' ? 0 : Math.min(0.15, defense * 0.02);
        if (Math.random() < blockChance) {
            const blockedDamage = Math.floor(baseDamage * 0.5);
            debugManager?.addDamageNumber(defender.x, defender.y - 10, blockedDamage, 'blocked');
            defender.hp -= Math.max(1, blockedDamage);

            // Ajouter fatigue pour avoir reçu une attaque (même bloquée)
            this.addFatigue(defender, 'attackReceived');
        } else {
            // Chance de coup critique (8%, augmenté si dos tourné)
            const critChance = defender.disengageMode === 'fleeing' ? 0.25 : 0.08;
            const isCritical = Math.random() < critChance;
            let damage = Math.max(1, baseDamage - defense + Math.floor(Math.random() * 2));

            // Appliquer le multiplicateur de dos tourné
            damage = Math.floor(damage * backTurnedMultiplier);

            if (isCritical) {
                damage = Math.floor(damage * 1.5);
                debugManager?.addDamageNumber(defender.x, defender.y - 10, damage, 'critical');
            } else {
                debugManager?.addDamageNumber(defender.x, defender.y - 10, damage, 'normal');
            }

            // Appliquer les dégâts
            defender.hp -= damage;

            // Ajouter fatigue pour avoir reçu une attaque
            this.addFatigue(defender, 'attackReceived');
        }

        // Vérifier si mort
        if (defender.hp <= 0) {
            this.killSoldier(defender, this.findUnitForSoldier(defender));
            attacker.state = 'returning';
            attacker.combatTarget = null;
            attacker.isEngaged = false;
        }
    }

    /**
     * Trouve l'unité à laquelle appartient un soldat
     */
    findUnitForSoldier(soldier) {
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];
        for (const unit of allUnits) {
            if (unit.soldiers && unit.soldiers.includes(soldier)) {
                return unit;
            }
        }
        return null;
    }

    /**
     * Tue un soldat
     */
    killSoldier(soldier, unit) {
        if (!unit) return;

        soldier.isAlive = false;
        soldier.state = 'dead';
        soldier.animState = 'death';
        soldier.animTime = 0;

        // Nettoyer les références dans engagedWith de tous les ennemis qui le ciblaient
        for (const enemy of soldier.engagedWith) {
            if (enemy && enemy.engagedWith) {
                enemy.engagedWith = enemy.engagedWith.filter(e => e !== soldier);
            }
            // Si l'ennemi avait ce soldat comme cible principale, lui en donner une nouvelle
            if (enemy && enemy.combatTarget === soldier) {
                enemy.combatTarget = enemy.engagedWith.length > 0 ? enemy.engagedWith[0] : null;
            }
        }

        // Vider la liste des engagés du soldat mort
        soldier.engagedWith = [];

        // Libérer sa cible si elle existe (rétrocompatibilité)
        if (soldier.combatTarget) {
            soldier.combatTarget.combatTarget = null;
            soldier.combatTarget.isEngaged = false;
            soldier.combatTarget.state = 'returning';
        }

        // Gérer la mort des rôles spéciaux
        if (soldier.role === 'leader') {
            this.handleLeaderDeath(unit, soldier);
        } else if (soldier.role === 'standardBearer') {
            this.handleStandardBearerDeath(unit, soldier);
        }

        // Mettre à jour le compteur de l'unité
        unit.currentMen = unit.soldiers.filter(s => s.isAlive).length;

        // IMPORTANT: Repositionner immédiatement les soldats vivants de cette unité
        // pour combler les trous dans la formation
        this.repositionSoldiersAfterDeath(unit);

        // Créer un corps
        setTimeout(() => {
            this.createDeadBody(unit, soldier);
        }, 600);
    }

    /**
     * Repositionne les soldats vivants pour combler les trous après une mort
     * Mouvement naturel: seuls les soldats de la même colonne avancent d'un rang
     */
    repositionSoldiersAfterDeath(unit) {
        if (!unit.soldiers || !this.battle.formationSystem) return;

        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        if (aliveSoldiers.length === 0) return;

        // Pour chaque colonne, détecter les trous et faire avancer les soldats
        const config = this.battle.formationSystem.getFormationConfig(unit);
        const maxRows = config.rows;
        const maxCols = config.columns;

        // Pour chaque colonne
        for (let col = 0; col < maxCols; col++) {
            // Récupérer tous les soldats vivants de cette colonne, triés par row
            const soldiersInColumn = aliveSoldiers
                .filter(s => s.col === col)
                .sort((a, b) => a.row - b.row);

            // Si la colonne a des soldats, les repositionner pour combler les trous
            if (soldiersInColumn.length > 0) {
                // Réassigner les rows pour qu'ils soient consécutifs (0, 1, 2...)
                soldiersInColumn.forEach((soldier, index) => {
                    const oldRow = soldier.row;
                    const newRow = index; // Row consécutif

                    if (oldRow !== newRow) {
                        // Le soldat doit avancer
                        soldier.row = newRow;

                        // Recalculer sa position de formation
                        const formationSystem = this.battle.formationSystem;
                        const spacing = config.spacing;
                        const cos = Math.cos(unit.facing || 0);
                        const sin = Math.sin(unit.facing || 0);

                        // Calculer la nouvelle position dans la grille
                        // Utiliser le même calcul que dans calculateGridPositions
                        const localX = ((maxRows - 1) / 2 - newRow) * spacing;
                        const localY = (col - (maxCols - 1) / 2) * spacing;

                        const rotatedX = localX * cos - localY * sin;
                        const rotatedY = localX * sin + localY * cos;

                        soldier.formationX = unit.x + rotatedX;
                        soldier.formationY = unit.y + rotatedY;

                        // Mettre à jour le statut de bordure
                        const totalRowsInColumn = soldiersInColumn.length;
                        soldier.isBorder = newRow === 0 || newRow === totalRowsInColumn - 1 ||
                                         col === 0 || col === maxCols - 1;

                        // Ne marquer comme "repositioning" que si le soldat n'est pas en combat
                        if (soldier.state !== 'fighting' && soldier.state !== 'charging') {
                            soldier.isRepositioning = true;
                        }
                    }
                });
            }
        }

        // Après avoir repositionné dans les colonnes, équilibrer latéralement
        // si l'unité est en combat
        if (unit.state === 'attacking' || unit.state === 'defending' || unit.state === 'fighting') {
            this.balanceColumnsLaterally(unit);
        }
    }

    /**
     * Équilibre les colonnes pendant le combat en faisant glisser les soldats
     * des colonnes pleines vers les colonnes vides
     * S'active uniquement si l'écart entre colonnes voisines est >= 3 soldats
     * @param {Object} unit - L'unité
     */
    balanceColumnsLaterally(unit) {
        if (!unit.soldiers || !this.battle.formationSystem) return;

        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        if (aliveSoldiers.length === 0) return;

        const config = this.battle.formationSystem.getFormationConfig(unit);
        const maxCols = config.columns;
        const spacing = config.spacing;
        const cos = Math.cos(unit.facing || 0);
        const sin = Math.sin(unit.facing || 0);

        // Calculer la hauteur de chaque colonne
        const columnHeights = [];
        for (let col = 0; col < maxCols; col++) {
            const soldiersInColumn = aliveSoldiers.filter(s => s.col === col);
            columnHeights[col] = soldiersInColumn.length;
        }

        // Parcourir les colonnes adjacentes pour détecter les déséquilibres
        for (let col = 0; col < maxCols - 1; col++) {
            const currentHeight = columnHeights[col];
            const nextHeight = columnHeights[col + 1];
            const gap = Math.abs(currentHeight - nextHeight);

            // Si l'écart est >= 3, faire glisser des soldats
            if (gap >= 3) {
                const sourceCol = currentHeight > nextHeight ? col : col + 1;
                const targetCol = currentHeight > nextHeight ? col + 1 : col;
                const soldiersToMove = Math.floor(gap / 2); // Déplacer la moitié de l'écart

                // Récupérer les soldats de l'arrière de la colonne source
                const sourceSoldiers = aliveSoldiers
                    .filter(s => s.col === sourceCol)
                    .sort((a, b) => b.row - a.row); // Trier par row décroissant (arrière vers avant)

                // Déplacer les soldats de l'arrière qui ne sont PAS en combat
                let movedCount = 0;
                for (const soldier of sourceSoldiers) {
                    if (movedCount >= soldiersToMove) break;

                    // Ne déplacer que les soldats qui ne sont pas en combat
                    if (soldier.state !== 'fighting' && soldier.state !== 'charging') {
                        // Changer la colonne du soldat
                        soldier.col = targetCol;
                        movedCount++;
                    }
                }

                // Mettre à jour les hauteurs après le déplacement
                if (movedCount > 0) {
                    columnHeights[sourceCol] -= movedCount;
                    columnHeights[targetCol] += movedCount;
                }
            }
        }

        // Recalculer les positions de tous les soldats après l'équilibrage
        for (let col = 0; col < maxCols; col++) {
            const soldiersInColumn = aliveSoldiers
                .filter(s => s.col === col)
                .sort((a, b) => a.row - b.row);

            soldiersInColumn.forEach((soldier, index) => {
                const newRow = index;
                soldier.row = newRow;

                // Recalculer la position de formation
                const maxRows = Math.max(...columnHeights);
                const localX = ((maxRows - 1) / 2 - newRow) * spacing;
                const localY = (col - (maxCols - 1) / 2) * spacing;

                const rotatedX = localX * cos - localY * sin;
                const rotatedY = localX * sin + localY * cos;

                soldier.formationX = unit.x + rotatedX;
                soldier.formationY = unit.y + rotatedY;

                // Mettre à jour le statut de bordure
                soldier.isBorder = newRow === 0 || newRow === columnHeights[col] - 1 ||
                                 col === 0 || col === maxCols - 1;

                // Marquer pour repositionnement si pas en combat
                if (soldier.state !== 'fighting' && soldier.state !== 'charging') {
                    soldier.isRepositioning = true;
                }
            });
        }
    }

    /**
     * Gère la mort du leader - trouve un successeur
     */
    handleLeaderDeath(unit, deadLeader) {
        // Pénalité de moral immédiate
        unit.morale = (unit.morale || 100) - 15;

        // Trouver le soldat le plus expérimenté pour devenir leader
        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive && s !== deadLeader && s.role !== 'standardBearer');

        if (aliveSoldiers.length === 0) {
            unit.leader = null;
            return;
        }

        // Trier par expérience, puis par rang (les soldats de front sont prioritaires)
        aliveSoldiers.sort((a, b) => {
            if (b.experience !== a.experience) return b.experience - a.experience;
            return a.row - b.row; // Les rangs de devant sont prioritaires
        });

        const newLeader = aliveSoldiers[0];
        newLeader.role = 'leader';

        // Appliquer les bonus du leader au nouveau leader
        const leaderBonus = SPECIAL_ROLES.leader;
        newLeader.maxHp += leaderBonus.hpBonus;
        newLeader.hp = Math.min(newLeader.hp + leaderBonus.hpBonus, newLeader.maxHp);
        newLeader.attack += leaderBonus.attackBonus;
        newLeader.defense += leaderBonus.defenseBonus;
        newLeader.experience += 1; // Gagner de l'expérience en devenant leader

        unit.leader = newLeader;

        // Message de succession (pour debug/UI)
        console.log(`${unit.name}: Nouveau leader promu (exp: ${newLeader.experience})`);
    }

    /**
     * Gère la mort du porte-drapeau
     */
    handleStandardBearerDeath(unit, _deadBearer) {
        // Perte importante de moral - le drapeau est tombé!
        unit.morale = (unit.morale || 100) - 25;

        // Plus de bonus de moral du porte-drapeau
        unit.standardBearer = null;

        console.log(`${unit.name}: Porte-drapeau tombé! Moral en chute.`);
    }

    /**
     * Applique la physique (vélocité, friction, momentum) à un soldat
     * @param {Object} soldier - Le soldat
     * @param {number} deltaTime - Temps écoulé en ms
     */
    applySoldierPhysics(soldier, deltaTime) {
        if (!soldier.velocity) {
            soldier.velocity = { x: 0, y: 0 };
        }

        const dt = deltaTime / 16.67; // Normaliser par rapport à 60fps

        // Appliquer la vélocité à la position
        soldier.x += soldier.velocity.x * dt;
        soldier.y += soldier.velocity.y * dt;

        // Appliquer la friction pour ralentir
        const friction = FLUID_MOVEMENT_CONFIG.velocityFriction;
        soldier.velocity.x *= friction;
        soldier.velocity.y *= friction;

        // Si pas en mêlée, appliquer une légère attraction vers la formation
        if (!soldier.inMelee && soldier.state !== 'fighting') {
            const dx = soldier.formationX - soldier.x;
            const dy = soldier.formationY - soldier.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 5) {
                const pullForce = SOLDIER_COLLISION.formationPullForce;
                soldier.velocity.x += (dx / dist) * pullForce;
                soldier.velocity.y += (dy / dist) * pullForce;
            }
        }

        // Réduire le momentum progressivement
        soldier.momentum *= 0.9;

        // Seuil de vélocité minimum
        const threshold = FLUID_MOVEMENT_CONFIG.velocityThreshold;
        if (Math.abs(soldier.velocity.x) < threshold) soldier.velocity.x = 0;
        if (Math.abs(soldier.velocity.y) < threshold) soldier.velocity.y = 0;
    }

    /**
     * Met à jour un soldat en mêlée (proche d'ennemis, formation partiellement ignorée)
     * Le soldat charge vers l'ennemi le plus proche et tente de pénétrer la formation
     * @param {Object} soldier - Le soldat en mêlée
     * @param {Object} unit - L'unité parente
     * @param {number} deltaTime - Temps écoulé
     */
    updateMeleeSoldier(soldier, unit, deltaTime) {
        const enemies = unit.side === 'attacker'
            ? this.battle.defenderUnits
            : this.battle.attackerUnits;

        // Trouver l'ennemi le plus proche
        let closestEnemy = null;
        let closestDist = Infinity;

        for (const enemyUnit of enemies) {
            if (!enemyUnit.soldiers || enemyUnit.currentMen <= 0) continue;

            for (const enemy of enemyUnit.soldiers) {
                if (!enemy.isAlive) continue;

                const dist = Math.hypot(enemy.x - soldier.x, enemy.y - soldier.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = enemy;
                }
            }
        }

        if (!closestEnemy) {
            // Plus d'ennemi, sortir de la mêlée
            soldier.inMelee = false;
            return;
        }

        // Si très proche, engager le combat
        if (closestDist < FLUID_MOVEMENT_CONFIG.combatDistance) {
            if (!soldier.combatTarget && soldier.state !== 'fighting') {
                if (this.canAttackTarget(soldier, closestEnemy)) {
                    this.engageCombat(soldier, closestEnemy);
                }
            }
            return;
        }

        // Sinon, charger vers l'ennemi
        const dx = closestEnemy.x - soldier.x;
        const dy = closestEnemy.y - soldier.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            // Force d'attraction vers l'ennemi
            const attractForce = FLUID_MOVEMENT_CONFIG.meleeAttractionForce;
            soldier.velocity.x += (dx / dist) * attractForce;
            soldier.velocity.y += (dy / dist) * attractForce;

            // Vitesse de pénétration additionnelle
            const penSpeed = FLUID_MOVEMENT_CONFIG.penetrationSpeed * (deltaTime / 16.67);
            soldier.x += (dx / dist) * penSpeed;
            soldier.y += (dy / dist) * penSpeed;

            // Faire face à l'ennemi
            this.faceSoldierTowards(soldier, closestEnemy);
        }

        // Ignorer partiellement la formation quand en mêlée profonde
        if (closestDist < FLUID_MOVEMENT_CONFIG.meleeFormationIgnoreRadius) {
            // La position de formation dérive vers la position actuelle
            soldier.formationX = soldier.formationX * 0.95 + soldier.x * 0.05;
            soldier.formationY = soldier.formationY * 0.95 + soldier.y * 0.05;
        }
    }

    /**
     * Met à jour un soldat qui se déplace avec son unité
     * Intègre le système de mêlée fluide
     */
    updateMovingSoldier(soldier, unit, deltaTime) {
        // Vérifier si le soldat est proche d'ennemis (zone de mêlée)
        if (soldier.nearestEnemyDist < FLUID_MOVEMENT_CONFIG.meleeEngageDistance) {
            soldier.inMelee = true;
            this.updateMeleeSoldier(soldier, unit, deltaTime);
            this.applySoldierPhysics(soldier, deltaTime);
            return;
        }

        // Hors mêlée, réinitialiser le flag
        if (soldier.inMelee && soldier.nearestEnemyDist > FLUID_MOVEMENT_CONFIG.meleeEngageDistance * 1.5) {
            soldier.inMelee = false;
        }

        // IMPORTANT: Les unités du joueur ne chargent PAS automatiquement
        const playerFaction = this.battle.game?.playerFaction;
        const isPlayerUnit = unit.faction === playerFaction;

        if (!isPlayerUnit) {
            // Les soldats disciplinés suivent leur formation
            // Les soldats agressifs peuvent charger si assez proches
            const combatStyle = this.getCombatStyle(unit);

            if (combatStyle === 'aggressive' && unit.state === 'attacking' && unit.target) {
                // Vérifier si un ennemi est à portée de charge
                this.seekEnemyToCharge(soldier, unit);
            }
        }

        // Appliquer la physique fluide
        this.applySoldierPhysics(soldier, deltaTime);

        // Suivre la formation
        this.updateSoldierMovement(soldier, deltaTime);
    }

    /**
     * Démarre une charge pour un soldat (cavalerie/éléphant)
     * Initialise les paramètres de charge et change l'état du soldat
     * @param {Object} soldier - Le soldat qui charge
     * @param {Object} targetUnit - L'unité ciblée
     */
    startCharge(soldier, targetUnit) {
        const unitType = soldier.unit?.type;
        if (unitType !== 'cavalry' && unitType !== 'elephant') return;

        soldier.isCharging = true;
        soldier.chargeStartPos = { x: soldier.x, y: soldier.y };
        soldier.chargeSpeed = soldier.moveSpeed * 1.5;
        soldier.chargeTargetUnit = targetUnit;
        soldier.impactedSoldiers = [];
        soldier.state = 'charging';
    }

    /**
     * Calcule la puissance de charge actuelle d'un soldat
     * La puissance dépend du stat charge, de la distance parcourue et de la vitesse
     * @param {Object} soldier - Le soldat en charge
     * @returns {number} Puissance de charge (0 si pas en charge)
     */
    calculateChargePower(soldier) {
        if (!soldier.isCharging) return 0;

        const unit = soldier.unit;
        if (!unit) return 0;

        // Stat de charge de l'unité
        const chargeStat = unit.stats?.charge || 5;

        // Distance parcourue depuis le début de la charge
        const chargeDistance = soldier.chargeStartPos
            ? Math.hypot(soldier.x - soldier.chargeStartPos.x, soldier.y - soldier.chargeStartPos.y)
            : 0;

        // Bonus de distance (max à 100px)
        const distanceBonus = Math.min(chargeDistance / 100, 1.0);

        // Vitesse relative (par rapport à la vitesse max de charge)
        const maxChargeSpeed = soldier.moveSpeed * 1.5;
        const speedRatio = soldier.chargeSpeed / maxChargeSpeed;

        // Puissance finale
        return chargeStat * (0.5 + distanceBonus * 0.5) * speedRatio;
    }

    /**
     * Calcule la résistance d'une formation à une charge
     * Prend en compte le type de formation, l'orientation et l'expérience
     * @param {Object} targetUnit - L'unité ciblée
     * @param {Object} charger - Le soldat qui charge
     * @returns {number} Résistance (1.0 = normale)
     */
    calculateFormationResistance(targetUnit, charger) {
        if (!targetUnit) return 1.0;

        // Résistance de base selon le type de formation
        const formationType = this.battle.formationSystem?.getFormationType(targetUnit) || 'barbarian_mass';
        let resistance = CHARGE_CONFIG.formationResistance[formationType] || 1.0;

        // Bonus si l'unité fait face à la charge
        const angleToCharger = Math.atan2(
            charger.y - targetUnit.y,
            charger.x - targetUnit.x
        );
        const facingDiff = Math.abs(angleToCharger - (targetUnit.facing || 0));
        const normalizedDiff = facingDiff > Math.PI ? 2 * Math.PI - facingDiff : facingDiff;

        if (normalizedDiff < Math.PI / 4) {
            // Charge de front
            resistance *= CHARGE_CONFIG.facingResistanceBonus;
        } else if (normalizedDiff > 3 * Math.PI / 4) {
            // Charge de dos
            resistance *= CHARGE_CONFIG.rearResistanceMalus;
        }

        // Bonus d'expérience de l'unité
        const experience = targetUnit.experience || 0;
        resistance *= 1 + experience * 0.1;

        return resistance;
    }

    /**
     * Traite l'impact d'une charge sur un soldat ennemi
     * Applique les dégâts, le knockback et les effets de moral
     * Gere aussi le contre-degats de spear_wall
     * @param {Object} charger - Le soldat qui charge
     * @param {Object} target - Le soldat impacté
     * @returns {Object} Résultat {damage, knockback, penetrated}
     */
    processChargeImpact(charger, target) {
        // Ne pas impacter deux fois le même soldat
        if (charger.impactedSoldiers.includes(target)) {
            return { damage: 0, knockback: 0, penetrated: true };
        }
        charger.impactedSoldiers.push(target);

        // Verifier le contre-charge de spear_wall
        if (target.unit) {
            this.processSpearWallCounter(charger, target.unit);
        }

        const chargePower = this.calculateChargePower(charger);
        const resistance = this.calculateFormationResistance(target.unit, charger);

        // Calcul des dégâts
        const baseDamage = CHARGE_CONFIG.baseChargeDamage * chargePower;
        const armorReduction = target.defense * (1 - CHARGE_CONFIG.chargeArmorPenetration);
        const finalDamage = Math.max(1, Math.floor(baseDamage - armorReduction));

        // Appliquer les dégâts
        target.hp -= finalDamage;

        // Afficher les dégâts
        this.battle.debugManager?.addDamageNumber(target.x, target.y - 10, finalDamage, 'charge');

        // Knockback
        const knockbackForce = CHARGE_CONFIG.baseKnockbackForce * (chargePower / resistance);
        const knockbackAngle = Math.atan2(
            target.y - charger.y,
            target.x - charger.x
        );

        target.x += Math.cos(knockbackAngle) * knockbackForce;
        target.y += Math.sin(knockbackAngle) * knockbackForce;

        // Ajouter fatigue d'impact de charge
        this.addFatigue(target, 'chargeImpact');

        // Effets supplémentaires sur la cible (perte de moral)
        if (target.unit) {
            target.unit.morale = Math.max(0, (target.unit.morale || 100) - CHARGE_CONFIG.impactMoraleLoss);
        }

        // Ralentir le chargeur
        charger.chargeSpeed *= (1 - CHARGE_CONFIG.speedLossPerImpact);

        // Déterminer si la charge continue (pénétration)
        const penetrated = chargePower > resistance;

        // Vérifier si mort
        if (target.hp <= 0) {
            this.killSoldier(target, target.unit);
        }

        return {
            damage: finalDamage,
            knockback: knockbackForce,
            penetrated: penetrated
        };
    }

    /**
     * Met à jour un soldat qui charge vers l'ennemi
     * Gère les impacts, la pénétration et l'arrêt de charge
     * @param {Object} soldier - Le soldat en charge
     * @param {Object} unit - L'unité parente
     * @param {number} deltaTime - Temps écoulé
     */
    updateChargingSoldier(soldier, unit, deltaTime) {
        // Vérifier si la charge doit continuer
        const maxChargeSpeed = soldier.moveSpeed * 1.5;
        const minSpeed = maxChargeSpeed * CHARGE_CONFIG.minChargeSpeed;

        if (soldier.chargeSpeed < minSpeed) {
            // Charge terminée - trop lent
            this.endCharge(soldier);
            return;
        }

        // Cible de la charge
        const targetUnit = soldier.chargeTargetUnit || soldier.chargeTarget?.unit;
        if (!targetUnit || targetUnit.currentMen <= 0) {
            this.endCharge(soldier);
            return;
        }

        // Direction vers le centre de l'unité cible
        const dx = targetUnit.x - soldier.x;
        const dy = targetUnit.y - soldier.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 5) {
            // Arrivé au centre, continuer de l'autre côté ou s'arrêter
            this.endCharge(soldier);
            return;
        }

        // Mouvement de charge
        const moveSpeed = soldier.chargeSpeed * deltaTime * 0.1;
        const moveX = (dx / dist) * Math.min(moveSpeed, dist);
        const moveY = (dy / dist) * Math.min(moveSpeed, dist);

        soldier.x += moveX;
        soldier.y += moveY;

        // Mettre à jour la direction visuelle
        const angle = Math.atan2(dy, dx);
        soldier.direction = this.battle.battleSpriteManager?.angleToDirection(angle) || soldier.direction;

        // Vérifier les collisions avec les soldats ennemis
        if (targetUnit.soldiers) {
            for (const enemySoldier of targetUnit.soldiers) {
                if (!enemySoldier.isAlive) continue;
                if (soldier.impactedSoldiers.includes(enemySoldier)) continue;

                const impactDist = Math.hypot(enemySoldier.x - soldier.x, enemySoldier.y - soldier.y);
                const impactRadius = SOLDIER_COLLISION.radius * 2;

                if (impactDist < impactRadius) {
                    const result = this.processChargeImpact(soldier, enemySoldier);

                    if (!result.penetrated) {
                        // Charge bloquée
                        this.endCharge(soldier);
                        // Engager le combat avec le bloqueur
                        if (enemySoldier.isAlive) {
                            this.engageCombat(soldier, enemySoldier);
                        }
                        return;
                    }
                }
            }
        }

        // Réduire légèrement la vitesse due à la friction
        soldier.chargeSpeed *= 0.995;
    }

    /**
     * Termine une charge et remet le soldat dans un état normal
     * @param {Object} soldier - Le soldat qui arrête de charger
     */
    endCharge(soldier) {
        soldier.isCharging = false;
        soldier.chargeStartPos = null;
        soldier.chargeSpeed = 0;
        soldier.chargeTargetUnit = null;
        soldier.impactedSoldiers = [];

        // Retour à l'état normal
        if (soldier.combatTarget && soldier.combatTarget.isAlive) {
            soldier.state = 'fighting';
        } else if (soldier.engagedWith.length > 0) {
            soldier.state = 'fighting';
            soldier.combatTarget = soldier.engagedWith[0];
        } else {
            soldier.state = 'returning';
        }
    }

    /**
     * Vérifie si le chemin vers une cible est bloqué par un autre soldat
     */
    isPathBlocked(soldier, target, unit) {
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];
        const dx = target.x - soldier.x;
        const dy = target.y - soldier.y;
        const dist = Math.hypot(dx, dy);
        const nx = dx / dist;
        const ny = dy / dist;

        for (const otherUnit of allUnits) {
            if (!otherUnit.soldiers) continue;
            const isEnemy = otherUnit.faction !== unit.faction;

            for (const other of otherUnit.soldiers) {
                if (!other.isAlive || other === soldier || other === target) continue;

                // Vérifier si ce soldat est sur le chemin
                const toOtherX = other.x - soldier.x;
                const toOtherY = other.y - soldier.y;
                const dotProduct = toOtherX * nx + toOtherY * ny;

                // Le soldat doit être devant nous et pas trop loin
                if (dotProduct > 0 && dotProduct < dist) {
                    // Distance perpendiculaire au chemin
                    const perpDist = Math.abs(toOtherX * (-ny) + toOtherY * nx);

                    if (perpDist < SOLDIER_COLLISION.radius * 3) {
                        return { soldier: other, isEnemy };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Met à jour un soldat qui retourne à sa formation
     * Intègre la physique fluide et détecte les ennemis proches
     */
    updateReturningSoldier(soldier, deltaTime) {
        // Appliquer la physique (vélocité des collisions)
        this.applySoldierPhysics(soldier, deltaTime);

        // Réinitialiser le flag de mêlée
        soldier.inMelee = false;

        // Vérifier si des ennemis sont proches (réengagement possible)
        if (soldier.nearestEnemyDist < FLUID_MOVEMENT_CONFIG.meleeEngageDistance) {
            soldier.inMelee = true;
            soldier.state = 'moving';
            return;
        }

        const dx = soldier.formationX - soldier.x;
        const dy = soldier.formationY - soldier.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2) {
            // Arrivé à la formation
            soldier.x = soldier.formationX;
            soldier.y = soldier.formationY;
            soldier.state = 'idle';
            soldier.isMoving = false;
            soldier.velocity = { x: 0, y: 0 };
            return;
        }

        // Se déplacer vers la formation
        const speed = soldier.moveSpeed * deltaTime * 0.08;
        soldier.x += (dx / dist) * Math.min(speed, dist);
        soldier.y += (dy / dist) * Math.min(speed, dist);

        // Mettre à jour la direction
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            const angle = Math.atan2(dy, dx);
            soldier.direction = this.battle.battleSpriteManager?.angleToDirection(angle) || soldier.direction;
        }
    }

    /**
     * Obtient le style de combat d'une unité selon sa faction
     */
    getCombatStyle(unit) {
        return COMBAT_STYLES[unit.faction] || 'aggressive';
    }

    /**
     * Met à jour un soldat inactif
     * Vérifie les ennemis proches et passe en mêlée si nécessaire
     */
    updateIdleSoldier(soldier, unit) {
        // Appliquer la physique résiduelle (décélération)
        if (soldier.velocity && (Math.abs(soldier.velocity.x) > 0.01 || Math.abs(soldier.velocity.y) > 0.01)) {
            soldier.x += soldier.velocity.x;
            soldier.y += soldier.velocity.y;
            soldier.velocity.x *= FLUID_MOVEMENT_CONFIG.velocityFriction;
            soldier.velocity.y *= FLUID_MOVEMENT_CONFIG.velocityFriction;
        }

        // Réinitialiser le flag de mêlée
        soldier.inMelee = false;

        // Vérifier si des ennemis sont très proches (passer en mêlée)
        if (soldier.nearestEnemyDist < FLUID_MOVEMENT_CONFIG.meleeEngageDistance) {
            soldier.state = 'moving';
            soldier.inMelee = true;
            soldier.isMoving = true;
            return;
        }

        // Si l'unité bouge, le soldat doit suivre
        if (unit.state === 'moving' || unit.state === 'attacking') {
            soldier.state = 'moving';
            soldier.isMoving = true;
        }

        // IMPORTANT: Les unités du joueur ne cherchent PAS automatiquement à charger
        const playerFaction = this.battle.game?.playerFaction;
        const isPlayerUnit = unit.faction === playerFaction;
        if (isPlayerUnit) return;

        // Si l'unité est en mode attaque et le soldat est de front, chercher un ennemi
        if (unit.state === 'attacking' && unit.target && soldier.row === 0) {
            const combatStyle = this.getCombatStyle(unit);
            if (combatStyle === 'aggressive') {
                // Les barbares cherchent activement un ennemi à charger
                this.seekEnemyToCharge(soldier, unit);
            }
        }
    }

    /**
     * Un soldat barbare cherche un ennemi à charger
     */
    seekEnemyToCharge(soldier, unit) {
        if (!unit.target?.soldiers) return;

        // Trouver l'ennemi le plus proche qui est accessible (sur le bord de la formation ennemie)
        let closestEnemy = null;
        let closestDist = Infinity;

        for (const enemy of unit.target.soldiers) {
            if (!enemy.isAlive) continue;

            // Ne cibler que les soldats de front ou de bordure (accessibles)
            if (enemy.row > 1 && !enemy.isBorder) continue;

            // Vérifier si on peut attaquer cette cible
            if (!this.canAttackTarget(soldier, enemy)) continue;

            const dist = Math.hypot(enemy.x - soldier.x, enemy.y - soldier.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }

        // Si un ennemi accessible est assez proche, charger vers lui
        if (closestEnemy && closestDist < 60) {
            this.startCharge(soldier, unit.target);
            soldier.chargeTarget = closestEnemy;
        }
    }

    /**
     * Met à jour l'état d'animation d'un soldat
     */
    updateSoldierAnimState(soldier, unit) {
        if (!soldier.isAlive) {
            soldier.animState = 'death';
            return;
        }

        switch (soldier.state) {
            case 'routing':
                // Les soldats en fuite courent
                soldier.animState = 'walk';
                break;
            case 'fighting':
                const isRanged = unit.type === 'ranged' || unit.type === 'skirmisher';
                soldier.animState = isRanged ? 'ranged' : 'melee';
                break;
            case 'charging':
                soldier.animState = 'walk'; // Course vers l'ennemi
                break;
            case 'moving':
            case 'returning':
                soldier.animState = 'walk';
                break;
            default:
                soldier.animState = 'idle';
        }
    }

    /**
     * Met à jour le mouvement d'un soldat vers sa position cible
     */
    updateSoldierMovement(soldier, deltaTime) {
        const dx = soldier.formationX - soldier.x;
        const dy = soldier.formationY - soldier.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 1) {
            // Arrivé à destination
            soldier.x = soldier.formationX;
            soldier.y = soldier.formationY;
            soldier.isRepositioning = false;
            soldier.isMoving = false;
            return;
        }

        // IMPORTANT: Si le soldat est en combat, il ne suit PAS la formation
        // Il doit d'abord finir son combat avant de rejoindre
        if (soldier.combatTarget?.isAlive) {
            // Marquer que le soldat doit rattraper la formation après le combat
            soldier.needsToRejoinFormation = true;
            return;
        }

        // Si le soldat vient de finir un combat et doit rattraper la formation
        if (soldier.needsToRejoinFormation && dist > 50) {
            // Vitesse de rattrapage rapide
            soldier.isMoving = true;
        }

        // Une fois proche de la formation, retirer le marqueur
        if (soldier.needsToRejoinFormation && dist < 30) {
            soldier.needsToRejoinFormation = false;
        }

        // Mettre à jour la direction de marche
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            soldier.direction = this.battle.battleSpriteManager?.vectorToDirection(dx, dy) || soldier.direction;
        }

        // Calculer le modificateur de vitesse basé sur la fatigue
        const fatigueMods = this.getFatigueModifiers(soldier);
        const effectiveSpeed = soldier.moveSpeed * fatigueMods.speed;

        // Si en mouvement avec l'unité (pas repositionnement), suivre rapidement
        if (soldier.isMoving && !soldier.isRepositioning) {
            // Vitesse rapide pour suivre l'unité - rattraper en quelques frames
            // La fatigue affecte aussi la vitesse de rattrapage
            const catchUpSpeed = Math.max(dist * 0.3, 2) * (deltaTime / 16.67) * fatigueMods.speed;
            const moveX = (dx / dist) * Math.min(catchUpSpeed, dist);
            const moveY = (dy / dist) * Math.min(catchUpSpeed, dist);
            soldier.x += moveX;
            soldier.y += moveY;
        } else {
            // Repositionnement après pertes - mouvement plus lent, affecté par fatigue
            const speed = effectiveSpeed * deltaTime * 0.15;
            const moveX = (dx / dist) * Math.min(speed, dist);
            const moveY = (dy / dist) * Math.min(speed, dist);
            soldier.x += moveX;
            soldier.y += moveY;
        }
    }

    /**
     * Déclenche l'animation d'attaque pour les soldats de front
     * @param {Object} unit - L'unité qui attaque
     * @param {Object} targetUnit - L'unité ciblée
     * @param {number} frontRows - Nombre de rangs qui attaquent (1-2)
     */
    triggerAttackAnimation(unit, targetUnit, frontRows = 1) {
        if (!unit.soldiers) return;

        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive) continue;

            // Seuls les soldats des premiers rangs attaquent
            if (soldier.row < frontRows) {
                soldier.isAttacking = true;
                soldier.attackTarget = targetUnit;
                soldier.animTime = 0; // Reset animation

                // Programmer la fin de l'animation
                const animDuration = this.getAnimationDuration(unit.type === 'ranged' ? 'ranged' : 'melee');
                setTimeout(() => {
                    soldier.isAttacking = false;
                    soldier.attackTarget = null;
                }, animDuration);
            }
        }
    }

    /**
     * Déclenche l'animation de mort pour un soldat
     */
    triggerDeathAnimation(unit, soldierIndex) {
        if (!unit.soldiers || !unit.soldiers[soldierIndex]) return;

        const soldier = unit.soldiers[soldierIndex];
        soldier.isAlive = false;
        soldier.animState = 'death';
        soldier.animTime = 0;

        // Créer un corps après l'animation de mort
        const deathDuration = this.getAnimationDuration('death');
        setTimeout(() => {
            this.createDeadBody(unit, soldier);
        }, deathDuration);
    }

    /**
     * Crée un corps mort persistant
     */
    createDeadBody(unit, soldier) {
        if (!unit.deadBodies) unit.deadBodies = [];

        unit.deadBodies.push({
            x: soldier.x,
            y: soldier.y,
            direction: soldier.direction,
            deathFrame: 3, // Frame finale
            unitType: unit.type || 'infantry',
            factionId: unit.faction,
            role: soldier.role || 'soldier', // Conserver le rôle pour le sprite de mort
            fadeTimer: 0,
            fadeDelay: 30000 // Disparaît après 30 secondes
        });
    }

    /**
     * Obtient la durée d'une animation
     */
    getAnimationDuration(animState) {
        const config = BATTLE_ANIM_CONFIG.ANIMATIONS[animState];
        if (!config) return 400;
        return config.frames * config.speed;
    }

    /**
     * Fait tourner les soldats de bordure vers un attaquant
     * @param {Object} unit - L'unité attaquée
     * @param {Object} attacker - L'unité attaquante
     * @param {string} attackDirection - Direction de l'attaque (front, flank_left, flank_right, rear)
     */
    turnBorderSoldiersToFace(unit, attacker, attackDirection) {
        if (!unit.soldiers || attackDirection === 'front') return;

        const config = unit.formationConfig || { columns: 10, rows: 6 };

        // Calculer l'angle vers l'attaquant
        const attackerAngle = Math.atan2(
            attacker.y - unit.y,
            attacker.x - unit.x
        );

        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive || !soldier.isBorder) continue;

            let shouldTurn = false;

            if (attackDirection === 'rear' && soldier.row === config.rows - 1) {
                // Rang arrière se tourne
                shouldTurn = true;
            } else if (attackDirection === 'flank_left' && soldier.col === 0) {
                // Flanc gauche se tourne
                shouldTurn = true;
            } else if (attackDirection === 'flank_right' && soldier.col === config.columns - 1) {
                // Flanc droit se tourne
                shouldTurn = true;
            }

            if (shouldTurn) {
                soldier.overrideFacing = attackerAngle;
                soldier.isTurning = true;
            }
        }
    }

    /**
     * Réinitialise la direction des soldats vers la direction de l'unité
     */
    resetSoldierDirections(unit) {
        if (!unit.soldiers) return;

        const unitDirection = this.getUnitDirection(unit);

        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive) continue;
            soldier.overrideFacing = null;
            soldier.isTurning = false;
            soldier.direction = unitDirection;
        }
    }

    /**
     * Met à jour les positions cibles des soldats quand l'unité bouge
     * @param {Object} unit - L'unité
     * @param {Object} formationSystem - Le système de formation
     */
    updateSoldierTargetPositions(unit, formationSystem) {
        if (!unit.soldiers) return;

        const aliveSoldiers = unit.soldiers.filter(s => s.isAlive);
        const config = formationSystem.getFormationConfig(unit);
        const maxRows = config.rows;
        const maxCols = config.columns;
        const spacing = config.spacing;
        const cos = Math.cos(unit.facing || 0);
        const sin = Math.sin(unit.facing || 0);

        // IMPORTANT: Repositionner les soldats en conservant leur colonne
        // Chaque colonne est traitée indépendamment pour un mouvement naturel
        for (let col = 0; col < maxCols; col++) {
            // Récupérer tous les soldats vivants de cette colonne, triés par row
            const soldiersInColumn = aliveSoldiers
                .filter(s => s.col === col)
                .sort((a, b) => a.row - b.row);

            // Repositionner chaque soldat dans sa colonne
            soldiersInColumn.forEach((soldier, index) => {
                const newRow = index; // Row consécutif dans la colonne
                soldier.row = newRow;

                // Calculer la nouvelle position
                const localX = ((maxRows - 1) / 2 - newRow) * spacing;
                const localY = (col - (maxCols - 1) / 2) * spacing;

                const rotatedX = localX * cos - localY * sin;
                const rotatedY = localX * sin + localY * cos;

                soldier.formationX = unit.x + rotatedX;
                soldier.formationY = unit.y + rotatedY;

                // Mettre à jour le statut de bordure
                const totalRowsInColumn = soldiersInColumn.length;
                soldier.isBorder = newRow === 0 || newRow === totalRowsInColumn - 1 ||
                                 col === 0 || col === maxCols - 1;
                soldier.isMoving = true;
            });
        }
    }

    /**
     * Rend tous les soldats d'une unité
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {Object} unit - L'unité
     * @param {number} scale - Échelle de rendu (pour le zoom)
     */
    renderSoldiers(ctx, unit, scale = 1) {
        if (!unit.soldiers) return;

        const spriteManager = this.battle.battleSpriteManager;
        if (!spriteManager || !spriteManager.isReady()) {
            this.renderSoldiersFallback(ctx, unit, scale);
            return;
        }

        const dimensions = spriteManager.getDimensions(unit.type || 'infantry');

        // Ratio d'aspect pour rendre les soldats plus hauts que larges
        // Les humains apparaissent aplatis en 1:1, on étire en hauteur
        const aspectRatio = this.getAspectRatio(unit.type || 'infantry');

        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive) continue;

            const frame = spriteManager.getFrame(
                unit.type || 'infantry',
                unit.faction,
                soldier.overrideFacing !== null
                    ? spriteManager.angleToDirection(soldier.overrideFacing)
                    : soldier.direction,
                soldier.animState,
                soldier.animTime,
                soldier.role || 'soldier'
            );

            if (!frame) continue;

            // Dimensions de rendu avec correction d'aspect
            const drawWidth = dimensions.width * scale;
            const drawHeight = dimensions.height * scale * aspectRatio;

            // Position de rendu (centré, mais ancré en bas pour les pieds)
            const drawX = soldier.x - drawWidth / 2;
            const drawY = soldier.y - drawHeight + (dimensions.height * scale * 0.4); // Ancré vers le bas

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                drawX, drawY,
                drawWidth,
                drawHeight
            );
        }
    }

    /**
     * Obtient le ratio d'aspect pour un type d'unité
     * @param {string} unitType - Type d'unité
     * @returns {number} Ratio hauteur (1.0 = pas de modification, 1.3 = 30% plus haut)
     */
    getAspectRatio(unitType) {
        // Les sprites sont dessinés carrés mais les soldats doivent paraître plus hauts
        const ratios = {
            infantry: 1.35,    // Fantassins plus hauts
            ranged: 1.35,      // Archers aussi
            skirmisher: 1.35,  // Vélites aussi
            cavalry: 1.3,      // Cavalerie aussi étirée (cheval + cavalier)
            elephant: 1.2      // Éléphants étirés
        };
        return ratios[unitType] || 1.35;
    }

    /**
     * Rendu de fallback (points colorés avec distinction des rôles)
     */
    renderSoldiersFallback(ctx, unit, scale = 1) {
        if (!unit.soldiers) return;

        const color = this.battle.game?.FACTIONS?.[unit.faction]?.color || '#888';

        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive) continue;

            const baseRadius = 2 * scale;

            if (soldier.role === 'leader') {
                // Leader: cercle plus grand avec couronne/étoile dorée
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(soldier.x, soldier.y, baseRadius * 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Couronne dorée au-dessus
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                // Triangle pointant vers le haut (couronne simplifiée)
                ctx.moveTo(soldier.x, soldier.y - baseRadius * 3);
                ctx.lineTo(soldier.x - baseRadius, soldier.y - baseRadius * 1.5);
                ctx.lineTo(soldier.x + baseRadius, soldier.y - baseRadius * 1.5);
                ctx.closePath();
                ctx.fill();

                // Contour blanc pour visibilité
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 0.5;
                ctx.stroke();

            } else if (soldier.role === 'standardBearer') {
                // Porte-drapeau: cercle avec drapeau au-dessus
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(soldier.x, soldier.y, baseRadius, 0, Math.PI * 2);
                ctx.fill();

                // Hampe du drapeau
                ctx.strokeStyle = '#8B4513'; // Marron
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(soldier.x, soldier.y - baseRadius);
                ctx.lineTo(soldier.x, soldier.y - baseRadius * 5);
                ctx.stroke();

                // Drapeau (rectangle de la couleur de la faction)
                ctx.fillStyle = color;
                ctx.fillRect(
                    soldier.x,
                    soldier.y - baseRadius * 5,
                    baseRadius * 3,
                    baseRadius * 2
                );

                // Bordure du drapeau
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(
                    soldier.x,
                    soldier.y - baseRadius * 5,
                    baseRadius * 3,
                    baseRadius * 2
                );

            } else {
                // Soldat normal: simple cercle
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(soldier.x, soldier.y, baseRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Rend un seul corps mort
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     * @param {Object} body - Le corps à rendre
     * @param {number} scale - Échelle de rendu
     */
    renderSingleDeadBody(ctx, body, scale = 1) {
        const spriteManager = this.battle.battleSpriteManager;

        if (spriteManager && spriteManager.isReady()) {
            const frame = spriteManager.getDeathFrame(
                body.unitType,
                body.factionId,
                body.direction,
                body.deathFrame,
                body.role || 'soldier'
            );

            if (frame) {
                const dimensions = spriteManager.getDimensions(body.unitType);
                const aspectRatio = this.getAspectRatio(body.unitType);

                // Dimensions de rendu avec correction d'aspect
                const drawWidth = dimensions.width * scale;
                const drawHeight = dimensions.height * scale * aspectRatio;

                ctx.imageSmoothingEnabled = false;
                ctx.globalAlpha = 1 - (body.fadeTimer / body.fadeDelay);
                ctx.drawImage(
                    frame.image,
                    frame.sx, frame.sy, frame.sw, frame.sh,
                    body.x - drawWidth / 2,
                    body.y - drawHeight + (dimensions.height * scale * 0.4),
                    drawWidth,
                    drawHeight
                );
                ctx.globalAlpha = 1;
            }
        } else {
            // Fallback: petit X
            ctx.strokeStyle = '#800';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(body.x - 2, body.y - 2);
            ctx.lineTo(body.x + 2, body.y + 2);
            ctx.moveTo(body.x + 2, body.y - 2);
            ctx.lineTo(body.x - 2, body.y + 2);
            ctx.stroke();
        }
    }

    /**
     * Rend les corps morts d'une unité (tous les corps)
     */
    renderDeadBodies(ctx, unit, scale = 1) {
        if (!unit.deadBodies) return;

        for (const body of unit.deadBodies) {
            this.renderSingleDeadBody(ctx, body, scale);
        }
    }

    /**
     * Met à jour le fade des corps morts
     */
    updateDeadBodies(deltaTime) {
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];

        for (const unit of allUnits) {
            if (!unit.deadBodies) continue;

            // Mettre à jour le timer de fade
            for (const body of unit.deadBodies) {
                body.fadeTimer += deltaTime;
            }

            // Supprimer les corps complètement fadés
            unit.deadBodies = unit.deadBodies.filter(b => b.fadeTimer < b.fadeDelay);
        }
    }

    /**
     * Compte les soldats vivants d'une unité
     */
    countAliveSoldiers(unit) {
        if (!unit.soldiers) return unit.currentMen || 0;
        return unit.soldiers.filter(s => s.isAlive).length;
    }

    // ==========================================
    // SYSTÈME D'ABILITIES
    // ==========================================

    /**
     * Initialise les abilities disponibles pour une unite selon son type
     * Doit etre appele lors de la creation de l'unite dans battle.js
     * @param {Object} unit - L'unite a initialiser
     */
    initializeAbilitiesForUnit(unit) {
        if (!unit) return;

        // Initialiser l'objet d'abilities actives sur l'unite
        unit.activeAbilities = {
            testudo: false,
            phalanx: false
        };

        // Stocker les abilities disponibles depuis la definition de l'unite
        unit.availableAbilities = unit.abilities || [];

        // Initialiser les cooldowns d'abilities
        unit.abilityCooldowns = {
            warcry: 0
        };

        // Marquer l'unite comme initialisee
        unit.abilitiesInitialized = true;
    }

    /**
     * Traite les abilities automatiques d'un soldat a chaque tick
     * Gere le declenchement du pilum, warcry, berserk selon les conditions
     * @param {Object} soldier - Le soldat a traiter
     * @param {number} deltaTime - Temps ecoule en ms
     */
    processAbilities(soldier, deltaTime) {
        if (!soldier.isAlive) return;

        const unit = soldier.unit;
        if (!unit || !unit.availableAbilities) return;

        const currentTime = performance.now();

        // Traiter la fin des effets temporaires
        this.updateAbilityTimers(soldier, currentTime);

        // Verifier les abilities automatiques selon l'etat du soldat
        if (soldier.state === 'moving' || soldier.state === 'charging') {
            this.checkPilumTrigger(soldier, unit);
        }

        if (soldier.state === 'fighting' && !soldier.abilities.warcryActive) {
            this.checkWarcryTrigger(soldier, unit, currentTime);
        }

        this.checkBerserk(soldier);
    }

    /**
     * Met a jour les timers d'abilities et desactive les effets expires
     * @param {Object} soldier - Le soldat
     * @param {number} currentTime - Temps actuel
     */
    updateAbilityTimers(soldier, currentTime) {
        // Fin du warcry
        if (soldier.abilities.warcryActive && currentTime >= soldier.abilities.warcryEndTime) {
            soldier.abilities.warcryActive = false;
        }

        // Fin du berserk
        if (soldier.abilities.berserkActive && currentTime >= soldier.abilities.berserkEndTime) {
            soldier.abilities.berserkActive = false;
        }
    }

    /**
     * Verifie et declenche le lancer de pilum si les conditions sont remplies
     * Le pilum est lance une seule fois par soldat avant le contact
     * @param {Object} soldier - Le soldat
     * @param {Object} unit - L'unite parente
     */
    checkPilumTrigger(soldier, unit) {
        // Verifier que l'unite a l'ability pilum
        if (!unit.availableAbilities.includes('pilum')) return;
        if (soldier.abilities.pilumThrown) return;

        // Verifier qu'il y a une cible
        const targetUnit = unit.target;
        if (!targetUnit || !targetUnit.soldiers) return;

        // Trouver l'ennemi le plus proche
        let closestEnemy = null;
        let closestDist = Infinity;

        for (const enemy of targetUnit.soldiers) {
            if (!enemy.isAlive) continue;
            const dist = Math.hypot(enemy.x - soldier.x, enemy.y - soldier.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }

        // Verifier la distance de declenchement
        if (closestEnemy && closestDist <= ABILITY_CONFIG.pilum.triggerDistance) {
            this.triggerPilum(soldier, targetUnit);
        }
    }

    /**
     * Lance le pilum vers une unite ennemie
     * Inflige des degats avec penetration d'armure a un soldat aleatoire
     * @param {Object} soldier - Le soldat qui lance
     * @param {Object} targetUnit - L'unite ciblee
     */
    triggerPilum(soldier, targetUnit) {
        soldier.abilities.pilumThrown = true;

        // Selectionner une cible parmi les types affectes
        const config = ABILITY_CONFIG.pilum;
        const validTargets = targetUnit.soldiers.filter(s => {
            if (!s.isAlive) return false;
            return config.affectedTypes.includes(targetUnit.type);
        });

        if (validTargets.length === 0) return;

        // Choisir une cible aleatoire parmi les soldats de front
        const frontTargets = validTargets.filter(s => s.row <= 1);
        const targets = frontTargets.length > 0 ? frontTargets : validTargets;
        const target = targets[Math.floor(Math.random() * targets.length)];

        // Calculer les degats avec penetration d'armure
        const baseDamage = config.damage;
        const armorReduction = target.defense * (1 - config.armorPenetration);
        const finalDamage = Math.max(1, Math.floor(baseDamage - armorReduction));

        // Appliquer les degats
        target.hp -= finalDamage;

        // Afficher les degats
        this.battle.debugManager?.addDamageNumber(target.x, target.y - 15, finalDamage, 'pilum');

        // Verifier si mort
        if (target.hp <= 0) {
            this.killSoldier(target, targetUnit);
        }
    }

    /**
     * Verifie et declenche le warcry au debut du combat
     * @param {Object} soldier - Le soldat
     * @param {Object} unit - L'unite parente
     * @param {number} currentTime - Temps actuel
     */
    checkWarcryTrigger(soldier, unit, currentTime) {
        if (!unit.availableAbilities.includes('warcry')) return;

        // Verifier le cooldown de l'unite
        if (unit.abilityCooldowns.warcry > currentTime) return;

        // Warcry se declenche automatiquement au debut du combat
        if (ABILITY_CONFIG.warcry.triggerOnEngage && soldier.isEngaged) {
            this.activateWarcry(unit, currentTime);
        }
    }

    /**
     * Active le warcry pour toute l'unite
     * Affecte le moral des ennemis proches et booste les allies
     * @param {Object} unit - L'unite qui pousse le cri de guerre
     * @param {number} currentTime - Temps actuel (optionnel)
     */
    activateWarcry(unit, currentTime = performance.now()) {
        const config = ABILITY_CONFIG.warcry;

        // Mettre en cooldown
        unit.abilityCooldowns.warcry = currentTime + config.cooldown;

        // Boost de moral pour l'unite
        unit.morale = Math.min(100, (unit.morale || 100) + config.selfMoraleBonus);

        // Activer l'effet sur tous les soldats vivants
        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive) continue;
            soldier.abilities.warcryActive = true;
            soldier.abilities.warcryEndTime = currentTime + config.duration;
        }

        // Reduire le moral des unites ennemies proches
        const enemies = unit.side === 'attacker' ? this.battle.defenderUnits : this.battle.attackerUnits;
        for (const enemyUnit of enemies) {
            if (!enemyUnit.soldiers || enemyUnit.currentMen <= 0) continue;

            const dist = Math.hypot(enemyUnit.x - unit.x, enemyUnit.y - unit.y);
            if (dist < 150) {
                enemyUnit.morale = Math.max(0, (enemyUnit.morale || 100) - config.moraleDamageToEnemy);
            }
        }
    }

    /**
     * Verifie et active le berserk si le moral est trop bas
     * @param {Object} soldier - Le soldat a verifier
     */
    checkBerserk(soldier) {
        const unit = soldier.unit;
        if (!unit || !unit.availableAbilities.includes('berserk')) return;

        // Deja actif ou pas assez bas en moral
        if (soldier.abilities.berserkActive) return;

        const config = ABILITY_CONFIG.berserk;
        const currentMorale = unit.morale || 100;

        if (currentMorale <= config.triggerMoraleThreshold) {
            soldier.abilities.berserkActive = true;
            soldier.abilities.berserkEndTime = performance.now() + config.duration;
        }
    }

    /**
     * Active ou desactive la formation testudo pour une unite
     * La testudo est une formation defensive romaine en tortue
     * @param {Object} unit - L'unite
     * @param {boolean} active - Activer ou desactiver
     * @returns {boolean} True si l'action a reussi
     */
    toggleTestudo(unit, active) {
        if (!this.canUseAbility(unit, 'testudo')) return false;

        unit.activeAbilities.testudo = active;

        // Desactiver phalanx si on active testudo
        if (active && unit.activeAbilities.phalanx) {
            unit.activeAbilities.phalanx = false;
        }

        return true;
    }

    /**
     * Active ou desactive la formation phalanx pour une unite
     * La phalanx est un mur de piques macedonien
     * @param {Object} unit - L'unite
     * @param {boolean} active - Activer ou desactiver
     * @returns {boolean} True si l'action a reussi
     */
    togglePhalanx(unit, active) {
        if (!this.canUseAbility(unit, 'phalanx')) return false;

        unit.activeAbilities.phalanx = active;

        // Desactiver testudo si on active phalanx
        if (active && unit.activeAbilities.testudo) {
            unit.activeAbilities.testudo = false;
        }

        return true;
    }

    /**
     * Calcule les modificateurs de combat dus aux abilities actives
     * Prend en compte testudo, phalanx, warcry, berserk
     * @param {Object} soldier - Le soldat
     * @returns {Object} Modificateurs {attack, defense, speed, rangedDefense}
     */
    getAbilityModifiers(soldier) {
        const modifiers = {
            attack: 1.0,
            defense: 1.0,
            speed: 1.0,
            rangedDefense: 1.0
        };

        const unit = soldier.unit;
        if (!unit) return modifiers;

        // Modificateurs de formation (testudo)
        if (unit.activeAbilities?.testudo) {
            const config = ABILITY_CONFIG.testudo;
            modifiers.defense *= config.defenseBonus;
            modifiers.rangedDefense *= config.rangedDefenseBonus;
            modifiers.speed *= config.speedMalus;
        }

        // Modificateurs de formation (phalanx)
        if (unit.activeAbilities?.phalanx) {
            const config = ABILITY_CONFIG.phalanx;
            modifiers.defense *= config.defenseBonus;
            modifiers.attack *= config.attackMalus;
            modifiers.speed *= config.speedMalus;

            // Vulnerabilite de flanc - verifier si le soldat est attaque de cote/dos
            if (soldier.combatTarget && this.isFlankedAttack(soldier, soldier.combatTarget)) {
                modifiers.defense /= config.flankedVulnerability;
            }
        }

        // Modificateurs temporaires du soldat (warcry)
        if (soldier.abilities?.warcryActive) {
            modifiers.attack *= ABILITY_CONFIG.warcry.attackBonus;
        }

        // Modificateurs temporaires du soldat (berserk)
        if (soldier.abilities?.berserkActive) {
            const config = ABILITY_CONFIG.berserk;
            modifiers.attack *= config.attackBonus;
            modifiers.defense *= config.defenseMalus;
        }

        return modifiers;
    }

    /**
     * Verifie si une unite peut utiliser une ability
     * @param {Object} unit - L'unite
     * @param {string} abilityName - Nom de l'ability
     * @returns {boolean} True si l'ability peut etre utilisee
     */
    canUseAbility(unit, abilityName) {
        if (!unit || !unit.availableAbilities) return false;

        // Verifier que l'unite a cette ability
        if (!unit.availableAbilities.includes(abilityName)) return false;

        // Verifier les conditions specifiques selon l'ability
        switch (abilityName) {
            case 'testudo':
                // Testudo necessite une formation romaine
                return ABILITY_CONFIG.testudo.formationType === 'roman' &&
                       ['julii', 'brutii', 'scipii', 'senate'].includes(unit.faction);

            case 'phalanx':
                // Phalanx disponible pour les unites avec cette ability
                return true;

            case 'warcry':
                // Warcry avec cooldown
                const currentTime = performance.now();
                return !unit.abilityCooldowns?.warcry || unit.abilityCooldowns.warcry <= currentTime;

            default:
                return true;
        }
    }

    /**
     * Determine si une attaque vient du flanc ou de l'arriere
     * Utilise pour la vulnerabilite de flanc de la phalanx
     * @param {Object} defender - Le soldat qui se defend
     * @param {Object} attacker - Le soldat qui attaque
     * @returns {boolean} True si l'attaque vient du flanc ou de l'arriere
     */
    isFlankedAttack(defender, attacker) {
        if (!defender || !attacker) return false;

        const unit = defender.unit;
        if (!unit) return false;

        // Calculer l'angle d'attaque par rapport a l'orientation de l'unite
        const attackAngle = Math.atan2(
            attacker.y - defender.y,
            attacker.x - defender.x
        );

        // Difference entre l'angle d'attaque et l'orientation de l'unite
        const unitFacing = unit.facing || 0;
        let angleDiff = Math.abs(attackAngle - unitFacing);

        // Normaliser entre 0 et PI
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }

        // Flanque si l'angle est > 60 degres (PI/3)
        const flankedThreshold = Math.PI / 3;
        return angleDiff > flankedThreshold;
    }

    /**
     * Traite les degats de contre-charge pour les unites avec spear_wall
     * Appele quand une unite de cavalerie/elephant charge une unite avec cette ability
     * @param {Object} charger - Le soldat qui charge
     * @param {Object} targetUnit - L'unite ciblee avec spear_wall
     * @returns {number} Degats infliges au chargeur
     */
    processSpearWallCounter(charger, targetUnit) {
        if (!targetUnit.availableAbilities?.includes('spear_wall')) return 0;

        const config = ABILITY_CONFIG.spear_wall;
        const chargerUnit = charger.unit;

        // Verifier que le chargeur est du bon type
        if (!chargerUnit || !config.affectedTypes.includes(chargerUnit.type)) return 0;

        // Infliger les degats de contre-charge
        const damage = config.chargeCounterDamage;
        charger.hp -= damage;

        // Afficher les degats
        this.battle.debugManager?.addDamageNumber(charger.x, charger.y - 10, damage, 'spear_wall');

        // Verifier si mort
        if (charger.hp <= 0) {
            this.killSoldier(charger, chargerUnit);
        }

        return damage;
    }

    /**
     * Distribue les pertes parmi les soldats
     * @param {Object} unit - L'unité qui subit des pertes
     * @param {number} casualties - Nombre de morts
     * @returns {Array} Indices des soldats tués
     */
    distributeCasualties(unit, casualties) {
        if (!unit.soldiers || casualties <= 0) return [];

        const killed = [];
        const aliveSoldiers = unit.soldiers
            .map((s, i) => ({ soldier: s, index: i }))
            .filter(({ soldier }) => soldier.isAlive);

        // Tuer les soldats de front en priorité (les plus exposés)
        aliveSoldiers.sort((a, b) => a.soldier.row - b.soldier.row);

        for (let i = 0; i < Math.min(casualties, aliveSoldiers.length); i++) {
            const { soldier, index } = aliveSoldiers[i];
            soldier.isAlive = false;
            killed.push(index);
            this.triggerDeathAnimation(unit, index);
        }

        // Mettre à jour le compteur de l'unité
        unit.currentMen = this.countAliveSoldiers(unit);

        return killed;
    }
}

export default SoldierManager;
