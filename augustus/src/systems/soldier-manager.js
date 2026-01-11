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
 */
const SOLDIER_COLLISION = {
    radius: 8,              // Rayon de collision d'un soldat (pixels) - augmenté pour sprites 32px
    separationForce: 0.8,   // Force de séparation quand chevauchement
    maxAttackersPerTarget: 2, // Maximum d'attaquants sur une même cible
    chargeImpact: 2.5,      // Force d'impact lors d'une charge
    pushbackResistance: {   // Résistance au recul selon le style
        disciplined: 0.7,   // Romains résistent mieux
        defensive: 0.8,     // Phalanges encore mieux
        aggressive: 0.3     // Barbares se font repousser facilement mais poussent fort
    },
    massMultiplier: {       // Multiplicateur de masse selon le type
        infantry: 1.0,
        ranged: 0.7,
        skirmisher: 0.6,
        cavalry: 2.5,       // Cavalerie pousse beaucoup plus
        elephant: 5.0       // Éléphants sont des tanks
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

            // Combat individuel
            combatTarget: null, // Le soldat ennemi ciblé
            isEngaged: false,   // En train de se battre
            avoidsCombat: roleConfig.avoidsCombat || false, // Porte-drapeau évite le combat

            // Mouvement
            moveSpeed: baseStats.speed * (0.9 + Math.random() * 0.2),
            isMoving: false,
            isRepositioning: false
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
     */
    countAttackersOnTarget(target) {
        let count = 0;
        const allUnits = [...(this.battle.attackerUnits || []), ...(this.battle.defenderUnits || [])];

        for (const unit of allUnits) {
            if (!unit.soldiers) continue;
            for (const soldier of unit.soldiers) {
                if (soldier.isAlive && soldier.combatTarget === target) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Vérifie si un soldat peut attaquer une cible (limite d'attaquants)
     */
    canAttackTarget(target) {
        return this.countAttackersOnTarget(target) < SOLDIER_COLLISION.maxAttackersPerTarget;
    }

    /**
     * Trouve et engage les combats entre soldats de camps opposés
     */
    findAndEngageCombats() {
        const attackerUnits = this.battle.attackerUnits || [];
        const defenderUnits = this.battle.defenderUnits || [];
        const playerFaction = this.battle.game?.playerFaction;

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
                        if (!ourSoldier.isAlive || ourSoldier.state === 'fighting' || ourSoldier.state === 'charging') continue;

                        // IMPORTANT: Les soldats en fuite ne cherchent PAS à combattre
                        // Ils ne combattent que s'ils sont attaqués (géré dans updateRoutingSoldier)
                        if (ourSoldier.state === 'routing') continue;

                        // Le porte-drapeau évite le combat sauf s'il est directement attaqué
                        if (ourSoldier.avoidsCombat) continue;

                        // Trouver l'ennemi le plus proche qui peut être attaqué
                        let closestEnemy = null;
                        let closestDist = Infinity;

                        for (const enemySoldier of enemyUnit.soldiers) {
                            if (!enemySoldier.isAlive) continue;

                            // IMPORTANT: Ne pas cibler les soldats en fuite
                            // Laissez-les fuir, sauf s'ils se défendent activement
                            if (enemySoldier.state === 'routing' && !enemySoldier.combatTarget) continue;

                            const dist = Math.hypot(enemySoldier.x - ourSoldier.x, enemySoldier.y - ourSoldier.y);
                            const engageRange = Math.max(ourSoldier.attackRange, enemySoldier.attackRange);

                            if (dist <= engageRange && dist < closestDist) {
                                // Vérifier la limite d'attaquants
                                if (this.canAttackTarget(enemySoldier)) {
                                    closestDist = dist;
                                    closestEnemy = enemySoldier;
                                }
                            }
                        }

                        if (closestEnemy) {
                            this.engageCombat(ourSoldier, closestEnemy);
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
     */
    engageCombat(soldier1, soldier2) {
        // IMPORTANT: Un soldat en fuite ne se bat PAS activement
        // On ne force pas soldier1 à combattre s'il fuit
        if (soldier1.state !== 'routing') {
            soldier1.state = 'fighting';
            soldier1.combatTarget = soldier2;
            soldier1.isEngaged = true;
            soldier1.isMoving = false;
            soldier1.isRepositioning = false;
        }

        // Le défenseur ne change de cible que s'il n'en a pas déjà une
        // IMPORTANT: Si soldier2 est en fuite et se fait attaquer, il se défend
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
            // L'unité du joueur est attaquée, elle doit contre-attaquer
            if (unit2.state !== 'attacking' || !unit2.target) {
                unit2.state = 'attacking';
                unit2.target = unit1;
            }
        }

        if (unit1 && unit1.faction === playerFaction) {
            // L'unité du joueur attaque, s'assurer qu'elle a la bonne cible
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
     * Résout les collisions entre soldats avec bousculade physique
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
                    soldier._style = this.getCombatStyle(unit);
                    soldier._mass = SOLDIER_COLLISION.massMultiplier[unit.type] || 1.0;
                    soldier._isEnemy = unit.side; // Pour différencier les camps
                    allSoldiers.push(soldier);
                }
            }
        }

        // Résoudre les collisions avec physique
        const radius = SOLDIER_COLLISION.radius;
        const minDist = radius * 2;

        for (let i = 0; i < allSoldiers.length; i++) {
            for (let j = i + 1; j < allSoldiers.length; j++) {
                const s1 = allSoldiers[i];
                const s2 = allSoldiers[j];

                // Ignorer si les deux sont en combat direct l'un contre l'autre
                if (s1.combatTarget === s2 && s2.combatTarget === s1) continue;

                const dx = s2.x - s1.x;
                const dy = s2.y - s1.y;
                const dist = Math.hypot(dx, dy);

                if (dist < minDist && dist > 0.1) {
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Calculer les forces de poussée basées sur l'état et le mouvement
                    const s1IsCharging = s1.state === 'charging' || (s1.state === 'moving' && s1._style === 'aggressive');
                    const s2IsCharging = s2.state === 'charging' || (s2.state === 'moving' && s2._style === 'aggressive');
                    const isEnemyContact = s1._isEnemy !== s2._isEnemy;

                    // Force de base
                    let basePush = overlap * SOLDIER_COLLISION.separationForce;

                    // Bonus d'impact si charge (surtout entre ennemis)
                    if (isEnemyContact) {
                        if (s1IsCharging) basePush += SOLDIER_COLLISION.chargeImpact * s1._mass;
                        if (s2IsCharging) basePush += SOLDIER_COLLISION.chargeImpact * s2._mass;
                    }

                    // Résistance selon le style de combat
                    const s1Resistance = SOLDIER_COLLISION.pushbackResistance[s1._style] || 0.5;
                    const s2Resistance = SOLDIER_COLLISION.pushbackResistance[s2._style] || 0.5;

                    // Les soldats en combat résistent plus
                    const s1CombatBonus = s1.state === 'fighting' ? 0.3 : 0;
                    const s2CombatBonus = s2.state === 'fighting' ? 0.3 : 0;

                    // Calcul final de qui bouge combien (basé sur masse et résistance)
                    const s1TotalResist = (s1Resistance + s1CombatBonus) * s1._mass;
                    const s2TotalResist = (s2Resistance + s2CombatBonus) * s2._mass;
                    const totalResist = s1TotalResist + s2TotalResist;

                    // Ratio de déplacement inversé (plus de résistance = moins de mouvement)
                    let s1Ratio = s2TotalResist / totalResist;
                    let s2Ratio = s1TotalResist / totalResist;

                    // Appliquer le déplacement (les chargeurs poussent, les défenseurs reculent)
                    const s1Push = basePush * s1Ratio;
                    const s2Push = basePush * s2Ratio;

                    // Ne pas déplacer les soldats en combat direct sauf si gros impact
                    const canMoveS1 = s1.state !== 'fighting' || (isEnemyContact && s2IsCharging && s2._mass > 1.5);
                    const canMoveS2 = s2.state !== 'fighting' || (isEnemyContact && s1IsCharging && s1._mass > 1.5);

                    if (canMoveS1) {
                        s1.x -= nx * s1Push;
                        s1.y -= ny * s1Push;

                        // Mettre à jour la position de formation si poussé significativement
                        if (s1Push > 2 && s1.state !== 'charging') {
                            s1.formationX -= nx * s1Push * 0.3;
                            s1.formationY -= ny * s1Push * 0.3;
                        }
                    }

                    if (canMoveS2) {
                        s2.x += nx * s2Push;
                        s2.y += ny * s2Push;

                        if (s2Push > 2 && s2.state !== 'charging') {
                            s2.formationX += nx * s2Push * 0.3;
                            s2.formationY += ny * s2Push * 0.3;
                        }
                    }

                    // Effet de désordre: si poussé fort, légère rotation aléatoire de la direction
                    if (isEnemyContact && basePush > 3) {
                        if (canMoveS1 && Math.random() < 0.3) {
                            s1.isRepositioning = true;
                        }
                        if (canMoveS2 && Math.random() < 0.3) {
                            s2.isRepositioning = true;
                        }
                    }
                }
            }
        }

        // Nettoyer les références temporaires
        for (const soldier of allSoldiers) {
            delete soldier._unit;
            delete soldier._style;
            delete soldier._mass;
            delete soldier._isEnemy;
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
     */
    updateFightingSoldier(soldier, _unit, shouldProcessCombat) {
        const target = soldier.combatTarget;

        // Vérifier si la cible est toujours valide
        if (!target?.isAlive) {
            soldier.state = 'returning';
            soldier.combatTarget = null;
            soldier.isEngaged = false;
            return;
        }

        // Vérifier si toujours à portée
        const dist = Math.hypot(target.x - soldier.x, target.y - soldier.y);
        if (dist > soldier.attackRange * 1.5) {
            // Trop loin, arrêter le combat
            soldier.state = 'returning';
            soldier.combatTarget = null;
            soldier.isEngaged = false;
            return;
        }

        // Attaquer si cooldown terminé
        if (soldier.attackCooldown <= 0 && shouldProcessCombat) {
            this.soldierAttack(soldier, target);
            soldier.attackCooldown = soldier.attackSpeed;
        }
    }

    /**
     * Un soldat attaque sa cible
     */
    soldierAttack(attacker, defender) {
        const debugManager = this.battle.debugManager;

        // Chance de miss (10%)
        if (Math.random() < 0.1) {
            debugManager?.addDamageNumber(defender.x, defender.y - 10, 0, 'missed');
            return;
        }

        // Calculer les dégâts
        const baseDamage = attacker.attack;
        const defense = defender.defense;

        // Chance de block (15% basé sur defense)
        const blockChance = Math.min(0.15, defense * 0.02);
        if (Math.random() < blockChance) {
            const blockedDamage = Math.floor(baseDamage * 0.5);
            debugManager?.addDamageNumber(defender.x, defender.y - 10, blockedDamage, 'blocked');
            defender.hp -= Math.max(1, blockedDamage);
        } else {
            // Chance de coup critique (8%)
            const isCritical = Math.random() < 0.08;
            let damage = Math.max(1, baseDamage - defense + Math.floor(Math.random() * 2));

            if (isCritical) {
                damage = Math.floor(damage * 1.5);
                debugManager?.addDamageNumber(defender.x, defender.y - 10, damage, 'critical');
            } else {
                debugManager?.addDamageNumber(defender.x, defender.y - 10, damage, 'normal');
            }

            // Appliquer les dégâts
            defender.hp -= damage;
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

        // Libérer sa cible si elle existe
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
     * Met à jour un soldat qui se déplace avec son unité
     */
    updateMovingSoldier(soldier, unit, deltaTime) {
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

        // Suivre la formation
        this.updateSoldierMovement(soldier, deltaTime);
    }

    /**
     * Met à jour un soldat qui charge vers l'ennemi (barbares)
     */
    updateChargingSoldier(soldier, unit, deltaTime) {
        const target = soldier.chargeTarget;

        // Vérifier si la cible est toujours valide
        if (!target?.isAlive) {
            soldier.state = 'moving';
            soldier.chargeTarget = null;
            return;
        }

        // Vérifier si la cible peut encore être attaquée
        if (!this.canAttackTarget(target)) {
            // Chercher une autre cible
            soldier.chargeTarget = null;
            soldier.state = 'moving';
            return;
        }

        // Distance à la cible
        const dx = target.x - soldier.x;
        const dy = target.y - soldier.y;
        const dist = Math.hypot(dx, dy);

        // Si assez proche, engager le combat
        if (dist <= soldier.attackRange + SOLDIER_COLLISION.radius) {
            if (this.canAttackTarget(target)) {
                this.engageCombat(soldier, target);
            }
            soldier.chargeTarget = null;
            return;
        }

        // Vérifier s'il y a un obstacle (autre soldat) sur le chemin
        const blocked = this.isPathBlocked(soldier, target, unit);
        if (blocked) {
            // Essayer d'attaquer le bloqueur ou contourner
            if (blocked.isEnemy && this.canAttackTarget(blocked.soldier)) {
                this.engageCombat(soldier, blocked.soldier);
                soldier.chargeTarget = null;
                return;
            }
            // Sinon, attendre/pousser (géré par les collisions)
        }

        // Charger vers la cible (mouvement rapide mais respectant la physique)
        const chargeSpeed = soldier.moveSpeed * 1.8 * deltaTime * 0.1;
        const moveX = (dx / dist) * Math.min(chargeSpeed, dist);
        const moveY = (dy / dist) * Math.min(chargeSpeed, dist);

        soldier.x += moveX;
        soldier.y += moveY;

        // Mettre à jour la direction
        const angle = Math.atan2(dy, dx);
        soldier.direction = this.battle.battleSpriteManager?.angleToDirection(angle) || soldier.direction;
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
     */
    updateReturningSoldier(soldier, deltaTime) {
        const dx = soldier.formationX - soldier.x;
        const dy = soldier.formationY - soldier.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2) {
            // Arrivé à la formation
            soldier.x = soldier.formationX;
            soldier.y = soldier.formationY;
            soldier.state = 'idle';
            soldier.isMoving = false;
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
     */
    updateIdleSoldier(soldier, unit) {
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
            if (!this.canAttackTarget(enemy)) continue;

            const dist = Math.hypot(enemy.x - soldier.x, enemy.y - soldier.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }

        // Si un ennemi accessible est assez proche, charger vers lui
        if (closestEnemy && closestDist < 60) {
            soldier.chargeTarget = closestEnemy;
            soldier.state = 'charging';
            soldier.isMoving = true;
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

        // Si en mouvement avec l'unité (pas repositionnement), suivre rapidement
        if (soldier.isMoving && !soldier.isRepositioning) {
            // Vitesse rapide pour suivre l'unité - rattraper en quelques frames
            const catchUpSpeed = Math.max(dist * 0.3, 2) * (deltaTime / 16.67);
            const moveX = (dx / dist) * Math.min(catchUpSpeed, dist);
            const moveY = (dy / dist) * Math.min(catchUpSpeed, dist);
            soldier.x += moveX;
            soldier.y += moveY;
        } else {
            // Repositionnement après pertes - mouvement plus lent
            const speed = soldier.moveSpeed * deltaTime * 0.15;
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
