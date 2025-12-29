// ==========================================
// SYSTÈME DE DIPLOMATIE
// ==========================================

import { FACTIONS } from '../data/index.js';

class DiplomacySystem {
    constructor(game) {
        this.game = game;
        this.relations = {};
    }

    /**
     * Initialise les relations entre factions
     */
    initialize() {
        const factionIds = Object.keys(FACTIONS).filter(f => f !== 'rebels');

        factionIds.forEach(f1 => {
            this.relations[f1] = {};
            factionIds.forEach(f2 => {
                if (f1 !== f2) {
                    this.relations[f1][f2] = this.getInitialRelation(f1, f2);
                }
            });
        });
    }

    /**
     * Calcule la relation initiale entre deux factions
     */
    getInitialRelation(faction1, faction2) {
        const f1 = FACTIONS[faction1];
        const f2 = FACTIONS[faction2];

        // Les romains sont alliés entre eux (au début)
        if (f1.isRoman && f2.isRoman) {
            return 50; // Neutre à amical
        }

        // Romains vs non-romains
        if (f1.isRoman !== f2.isRoman) {
            return -30; // Hostiles
        }

        // Non-romains entre eux
        return 0; // Neutre
    }

    /**
     * Obtient la relation entre deux factions
     */
    getRelation(faction1, faction2) {
        if (faction1 === faction2) return 100;
        if (!this.relations[faction1]) return 0;
        return this.relations[faction1][faction2] || 0;
    }

    /**
     * Modifie la relation entre deux factions
     */
    modifyRelation(faction1, faction2, amount) {
        if (faction1 === faction2) return;

        if (!this.relations[faction1]) this.relations[faction1] = {};
        if (!this.relations[faction2]) this.relations[faction2] = {};

        this.relations[faction1][faction2] = Math.max(-100, Math.min(100,
            (this.relations[faction1][faction2] || 0) + amount
        ));

        // Relation réciproque (mais moins forte)
        this.relations[faction2][faction1] = Math.max(-100, Math.min(100,
            (this.relations[faction2][faction1] || 0) + amount * 0.5
        ));
    }

    /**
     * Vérifie si deux factions sont en guerre
     */
    isAtWar(faction1, faction2) {
        return this.getRelation(faction1, faction2) < -50;
    }

    /**
     * Vérifie si deux factions sont alliées
     */
    isAllied(faction1, faction2) {
        return this.getRelation(faction1, faction2) > 50;
    }

    /**
     * Retourne l'état de la relation
     */
    getRelationStatus(faction1, faction2) {
        const relation = this.getRelation(faction1, faction2);

        if (relation >= 75) return { status: 'allied', label: 'Alliés', color: '#00ff00' };
        if (relation >= 25) return { status: 'friendly', label: 'Amical', color: '#88ff88' };
        if (relation >= -25) return { status: 'neutral', label: 'Neutre', color: '#ffff00' };
        if (relation >= -75) return { status: 'hostile', label: 'Hostile', color: '#ff8888' };
        return { status: 'war', label: 'En guerre', color: '#ff0000' };
    }

    /**
     * Exporte les données pour sauvegarde
     */
    export() {
        return { ...this.relations };
    }

    /**
     * Importe les données depuis une sauvegarde
     */
    import(data) {
        this.relations = { ...data };
    }
}

export default DiplomacySystem;
