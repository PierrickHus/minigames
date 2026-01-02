// ==========================================
// SCÉNARIO: PARTIE LIBRE
// ==========================================
// Mode de jeu standard sans guide.
// Reproduit exactement le comportement actuel du jeu.
// ==========================================

/**
 * Scénario Partie Libre
 * Mode standard sans tutoriel ni étapes scriptées.
 * Objectif: atteindre 10 000 habitants.
 */
const FREEPLAY_SCENARIO = {
    id: 'freeplay',
    name: 'Partie Libre',
    description: 'Mode standard - Atteignez 10 000 habitants',
    icon: '🎮',
    recommended: false,

    config: {
        // Activer les tâches automatiques de Cléopâtre
        autoTasks: true,

        // Activer le timer de déblocage des tiers
        tierTimerEnabled: true,

        // Afficher le timer "Prochaine mission"
        showNextTaskTimer: true,

        // Humeur de départ à 15% (mode difficile)
        startingMood: 15,

        // Objectif: 10 000 habitants
        victory: {
            population: 10000
        },

        // Défaite: humeur à 0
        defeat: {
            mood: 0
        }
    },

    // Pas d'étapes = mode libre sans tutoriel
    steps: null
};

export default FREEPLAY_SCENARIO;
