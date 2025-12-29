// ==========================================
// CALCULATEUR DE COMBAT
// ==========================================

/**
 * Modificateurs de combat selon la direction d'attaque
 */
export const ATTACK_MODIFIERS = {
    front: { damage: 1.0, morale: 1.0, label: 'Attaque frontale' },
    flank_left: { damage: 1.3, morale: 1.5, label: 'Attaque de flanc gauche' },
    flank_right: { damage: 1.3, morale: 1.5, label: 'Attaque de flanc droit' },
    rear: { damage: 1.6, morale: 2.0, label: 'Attaque de dos' }
};

/**
 * Gère les calculs de combat avancés
 */
class CombatCalculator {
    constructor(battleSystem) {
        this.battle = battleSystem;
    }

    /**
     * Détermine la direction d'attaque
     * @param {Object} attacker - Unité attaquante
     * @param {Object} defender - Unité défenseuse
     * @returns {string} 'front' | 'flank_left' | 'flank_right' | 'rear'
     */
    getAttackDirection(attacker, defender) {
        // Vecteur de l'attaquant vers le défenseur (direction de l'attaque)
        const attackDx = attacker.x - defender.x;
        const attackDy = attacker.y - defender.y;
        const attackAngle = Math.atan2(attackDy, attackDx);

        // Direction vers laquelle le défenseur fait face
        const defenderFacing = this.getUnitFacing(defender);

        // Angle relatif: différence entre la direction de l'attaque et la direction du défenseur
        let relativeAngle = attackAngle - defenderFacing;

        // Normaliser à -PI à PI
        while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
        while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;

        const absAngle = Math.abs(relativeAngle);

        // Déterminer la zone d'attaque
        // Front: ±45° (π/4)
        // Flancs: 45° à 135° (π/4 à 3π/4)
        // Dos: ±135° à 180° (3π/4 à π)

        if (absAngle < Math.PI / 4) {
            // L'attaque vient de devant
            return 'front';
        } else if (absAngle > 3 * Math.PI / 4) {
            // L'attaque vient de derrière
            return 'rear';
        } else {
            // L'attaque vient du flanc
            return relativeAngle > 0 ? 'flank_right' : 'flank_left';
        }
    }

    /**
     * Obtient la direction vers laquelle une unité fait face
     * @param {Object} unit - L'unité
     * @returns {number} Angle en radians
     */
    getUnitFacing(unit) {
        if (unit.facing !== undefined) {
            return unit.facing;
        }

        // Si l'unité a une cible, elle fait face à la cible
        if (unit.target) {
            return Math.atan2(
                unit.target.y - unit.y,
                unit.target.x - unit.x
            );
        }

        // Sinon, direction par défaut selon le camp
        return unit.side === 'attacker' ? 0 : Math.PI;
    }

    /**
     * Obtient les modificateurs pour une direction d'attaque
     * @param {string} direction - Direction d'attaque
     * @returns {Object} { damage, morale, label }
     */
    getAttackModifiers(direction) {
        return ATTACK_MODIFIERS[direction] || ATTACK_MODIFIERS.front;
    }

    /**
     * Calcule les dégâts d'une attaque
     * @param {Object} attacker - Unité attaquante
     * @param {Object} defender - Unité défenseuse
     * @param {string} attackDirection - Direction d'attaque (optionnel, calculé si absent)
     * @returns {Object} { damage, moraleDamage, casualties, attackDirection }
     */
    calculateDamage(attacker, defender, attackDirection = null) {
        // Déterminer la direction d'attaque
        if (!attackDirection) {
            attackDirection = this.getAttackDirection(attacker, defender);
        }
        const modifiers = this.getAttackModifiers(attackDirection);

        // Puissance d'attaque (réduite par les pertes)
        const attackerStrength = attacker.currentMen / (attacker.men || 60);
        const attackPower = attacker.stats.attack * attackerStrength;

        // Puissance de défense
        const defenseRating = defender.stats.defense + defender.stats.armor * 0.5;

        // Calcul de base
        let baseDamage = Math.max(1, attackPower - defenseRating * 0.5);

        // Variance aléatoire (±20%)
        const variance = 0.8 + Math.random() * 0.4;
        baseDamage *= variance;

        // Appliquer le modificateur de direction
        const finalDamage = Math.floor(baseDamage * modifiers.damage);

        // Dégâts au moral
        const moraleDamage = Math.floor(finalDamage * 0.5 * modifiers.morale);

        // Calculer le nombre de pertes (environ 1 mort par 20 points de dégâts)
        const casualties = Math.floor(finalDamage / 20) + (Math.random() < (finalDamage % 20) / 20 ? 1 : 0);

        return {
            damage: finalDamage,
            moraleDamage: moraleDamage,
            casualties: Math.max(0, Math.min(casualties, defender.currentMen)),
            attackDirection: attackDirection,
            modifiers: modifiers
        };
    }

    /**
     * Fait tourner les soldats de bordure pour faire face à l'attaquant
     * @param {Object} defender - Unité défenseuse
     * @param {Object} attacker - Unité attaquante
     * @param {string} attackDirection - Direction de l'attaque
     */
    handleBorderSoldierReaction(defender, attacker, attackDirection) {
        if (!this.battle.soldierManager || attackDirection === 'front') {
            return;
        }

        this.battle.soldierManager.turnBorderSoldiersToFace(
            defender,
            attacker,
            attackDirection
        );
    }

    /**
     * Distribue les pertes parmi les soldats de l'unité
     * @param {Object} unit - Unité qui subit des pertes
     * @param {number} casualties - Nombre de morts
     * @returns {Array} Indices des soldats tués
     */
    distributeCasualties(unit, casualties) {
        if (!this.battle.soldierManager) {
            // Fallback: simplement réduire le compteur
            unit.currentMen = Math.max(0, unit.currentMen - casualties);
            return [];
        }

        return this.battle.soldierManager.distributeCasualties(unit, casualties);
    }

    /**
     * Vérifie si une unité doit router (fuir)
     * @param {Object} unit - L'unité à vérifier
     * @returns {boolean}
     */
    shouldRout(unit) {
        // Rout si moral < 20 avec 30% de chance
        if (unit.morale < 20 && Math.random() < 0.3) {
            return true;
        }

        // Rout automatique si moral < 5
        if (unit.morale < 5) {
            return true;
        }

        // Rout si moins de 25% des effectifs
        const strengthRatio = unit.currentMen / (unit.men || 60);
        if (strengthRatio < 0.25 && Math.random() < 0.5) {
            return true;
        }

        return false;
    }

    /**
     * Calcule le bonus de charge
     * @param {Object} attacker - Unité qui charge
     * @param {Object} defender - Unité chargée
     * @returns {number} Multiplicateur de dégâts
     */
    getChargeBonus(attacker, defender) {
        // Bonus de charge pour la cavalerie
        if (attacker.type === 'cavalry') {
            // Distance parcourue (approximation)
            const chargeDistance = Math.hypot(
                attacker.x - (attacker.startX || attacker.x),
                attacker.y - (attacker.startY || attacker.y)
            );

            if (chargeDistance > 50) {
                return 1.5; // +50% de dégâts
            } else if (chargeDistance > 25) {
                return 1.25; // +25% de dégâts
            }
        }

        // Bonus pour les éléphants
        if (attacker.type === 'elephant') {
            return 1.75; // Toujours +75% en charge
        }

        return 1.0;
    }

    /**
     * Calcule les dégâts de contre-attaque (piques vs charge)
     * @param {Object} charger - Unité qui charge
     * @param {Object} pikemen - Unité avec piques
     * @returns {Object} { damage, message }
     */
    calculateBraceAgainstCharge(charger, pikemen) {
        // Vérifier si le défenseur a des piques
        const hasPikes = pikemen.id?.includes('phalangite') ||
            pikemen.id?.includes('triarii') ||
            pikemen.id?.includes('hoplite');

        if (!hasPikes) {
            return { damage: 0, message: null };
        }

        // Les piques sont efficaces contre la cavalerie
        if (charger.type === 'cavalry' || charger.type === 'elephant') {
            const damage = Math.floor(pikemen.stats.attack * 0.5);
            return {
                damage: damage,
                message: `${pikemen.name} brise la charge!`
            };
        }

        return { damage: 0, message: null };
    }

    /**
     * Applique les effets de terrain au combat
     * @param {Object} unit - Unité affectée
     * @param {Object} terrain - Type de terrain
     * @returns {Object} Modificateurs { attack, defense }
     */
    getTerrainModifiers(unit, terrain) {
        if (!terrain) return { attack: 1.0, defense: 1.0 };

        let attackMod = 1.0;
        let defenseMod = 1.0;

        switch (terrain.type) {
            case 'hill':
                // Bonus de hauteur
                defenseMod = 1.2;
                if (unit.type === 'ranged') attackMod = 1.2;
                break;

            case 'forest':
                // Malus pour cavalerie, bonus pour infanterie légère
                if (unit.type === 'cavalry') {
                    attackMod = 0.7;
                } else if (unit.type === 'skirmisher') {
                    defenseMod = 1.3;
                }
                break;

            case 'river':
                // Malus général
                attackMod = 0.8;
                defenseMod = 0.8;
                break;
        }

        return { attack: attackMod, defense: defenseMod };
    }

    /**
     * Calcule l'efficacité du tir à distance
     * @param {Object} shooter - Unité qui tire
     * @param {Object} target - Cible
     * @returns {Object} { accuracy, damage }
     */
    calculateRangedEffectiveness(shooter, target) {
        const distance = Math.hypot(target.x - shooter.x, target.y - shooter.y);
        const maxRange = shooter.stats.range || 100;

        // Précision diminue avec la distance
        let accuracy = 1.0 - (distance / maxRange) * 0.5;
        accuracy = Math.max(0.3, Math.min(1.0, accuracy));

        // Dégâts de base
        let damage = shooter.stats.attack * accuracy;

        // Réduction par l'armure (plus efficace contre les projectiles)
        const armorReduction = target.stats.armor * 0.7;
        damage = Math.max(1, damage - armorReduction);

        return {
            accuracy: accuracy,
            damage: Math.floor(damage),
            canHit: distance <= maxRange
        };
    }

    /**
     * Vérifie si une unité peut attaquer une autre
     * @param {Object} attacker - Unité attaquante
     * @param {Object} target - Cible potentielle
     * @returns {boolean}
     */
    canAttack(attacker, target) {
        if (!attacker || !target) return false;
        if (attacker.faction === target.faction) return false;
        if (attacker.currentMen <= 0 || target.currentMen <= 0) return false;
        if (attacker.state === 'routing' || target.state === 'routing') return false;

        const distance = Math.hypot(target.x - attacker.x, target.y - attacker.y);
        const attackRange = attacker.stats.range || 30;

        return distance <= attackRange;
    }

    /**
     * Génère un rapport de combat détaillé
     * @param {Object} attacker - Attaquant
     * @param {Object} defender - Défenseur
     * @param {Object} result - Résultat du calcul de dégâts
     * @returns {string} Description du combat
     */
    generateCombatReport(attacker, defender, result) {
        const dirLabel = result.modifiers?.label || 'Attaque';
        return `${attacker.name} (${dirLabel}) → ${defender.name}: ${result.damage} dégâts, ${result.casualties} morts`;
    }
}

export default CombatCalculator;
