// ==========================================
// SCÉNARIO: TUTORIEL
// ==========================================
// Mode d'apprentissage avec étapes guidées.
// Objectif réduit: 500 habitants.
// ==========================================

/**
 * Types d'étapes de tutoriel
 * @readonly
 * @enum {string}
 */
export const STEP_TYPES = {
    /** Introduction avec message et bouton */
    INTRO: 'intro',
    /** Met en surbrillance un élément et attend une action */
    HIGHLIGHT: 'highlight',
    /** Attend une condition sans highlight */
    WAIT: 'wait',
    /** Explique quelque chose avec un bouton pour continuer */
    EXPLAIN: 'explain',
    /** Mode libre - vérifie juste la condition de fin */
    FREE: 'free'
};

/**
 * Scénario Tutoriel
 * Guide le joueur à travers les mécaniques de base.
 * Objectif: atteindre 500 habitants.
 */
const TUTORIAL_SCENARIO = {
    id: 'tutorial',
    name: 'Tutoriel',
    description: 'Apprenez les bases du jeu - Objectif: 500 habitants',
    icon: '📚',
    recommended: true,

    config: {
        // Ressources de départ généreuses
        startingMoney: 2000,
        startingResources: {
            wood: 50,
            stone: 30,
            dirt: 30,
            clay: 20,
            sand: 20
        },
        startingConsumables: {
            food: 200,
            water: 200
        },

        // Timers plus rapides
        taskCooldown: 20,
        tierUnlockTimes: {
            1: 0,
            2: 60,   // 1 minute au lieu de 2
            3: 180   // 3 minutes au lieu de 5
        },

        // Objectif réduit
        victory: {
            population: 500
        },

        // Bâtiments débloqués progressivement (commence avec hutte seulement)
        unlockedBuildings: ['hut'],

        // Mode tutoriel (pas de game over immédiat)
        tutorialMode: true,

        // Désactiver la consommation, la croissance et les tâches de message au départ
        pauseSystems: ['consumption', 'growth', 'messageTask']
    },

    steps: [
        // ==================== ÉTAPE 1: INTRODUCTION ====================
        {
            id: 'intro',
            type: STEP_TYPES.INTRO,
            message: "Bienvenue !\n\nCléopâtre vous confie la construction d'un village.\nVotre objectif : atteindre 500 habitants.",
            buttonText: "Commencer"
        },

        // ==================== ÉTAPE 2: OBJECTIFS ====================
        {
            id: 'explain_goals',
            type: STEP_TYPES.EXPLAIN,
            target: '#goalContainer',
            arrowPosition: 'bottom',
            panelPosition: 'center',
            expandHighlight: { bottom: 220, left: 50, right: 50 },
            forceShowElement: '#goalTooltip',
            message: "Voici les conditions de victoire et de défaite.",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 3: PREMIÈRE HUTTE ====================
        {
            id: 'build_hut',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.building-item[data-building-id="hut"]',
            message: "Construisez une hutte pour augmenter votre population. Cliquez sur la hutte dans le panneau de droite.",
            blockScroll: true,
            condition: {
                type: 'construction_started',
                building: 'hut'
            },
            unlockBuildings: ['hut']
        },

        // ==================== ÉTAPE 3: PAYSANS ====================
        {
            id: 'explain_peasants',
            type: STEP_TYPES.EXPLAIN,
            target: '#peasantsDisplay',
            arrowPosition: 'bottom',
            message: "Vos paysans construisent et collectent des ressources. Surveillez leur nombre ! Un paysan occupé ne peut pas faire autre chose.",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 3b: PLACEMENT AUTOMATIQUE ====================
        {
            id: 'explain_placement',
            type: STEP_TYPES.EXPLAIN,
            target: '#villageCanvas',
            arrowPosition: 'left',
            message: "Les bâtiments se placent automatiquement sur la grille du village.\nPas besoin de choisir l'emplacement !",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 4: ATTENDRE CONSTRUCTION ====================
        {
            id: 'wait_construction',
            type: STEP_TYPES.WAIT,
            target: '.building-item[data-building-id="hut"]',
            message: "Attendez la fin de la construction...\nOn va accélérer un peu pour vous !",
            blockScroll: true,
            condition: {
                type: 'no_construction'
            },
            onStart: {
                modifyConstructionTime: 5
            }
        },

        // ==================== ÉTAPE 4b: CONSTRUCTION TERMINÉE ====================
        {
            id: 'explain_construction_done',
            type: STEP_TYPES.EXPLAIN,
            target: '#villageCanvas',
            arrowPosition: 'left',
            message: "Bravo ! Votre hutte est construite.\nElle abrite des habitants et augmente votre population maximale.",
            buttonText: "Super !"
        },

        // ==================== ÉTAPE 5: COLLECTER DU BOIS ====================
        {
            id: 'gather_wood',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.resource-bar-item[data-resource="wood"]',
            message: "Envoyez un paysan collecter du bois. Cliquez sur le bois dans la barre de ressources en bas.",
            condition: {
                type: 'gathering_active',
                resource: 'wood'
            }
        },

        // ==================== ÉTAPE 6: MULTIPLICATEUR ====================
        {
            id: 'use_multiplier',
            type: STEP_TYPES.HIGHLIGHT,
            target: '#resourceMultiplierBar .mult-btn[data-mult="5"]',
            message: "Utilisez le multiplicateur x5 pour envoyer plusieurs paysans à la fois !",
            condition: {
                type: 'multiplier_set',
                value: 5
            },
            onEnd: {
                bonus: { wood: 30 }
            }
        },

        // ==================== ÉTAPE 6b: EXPLICATION MULTIPLICATEUR ====================
        {
            id: 'explain_multiplier',
            type: STEP_TYPES.EXPLAIN,
            target: '#resourceMultiplierBar',
            arrowPosition: 'top',
            message: "Avec x5, vous envoyez 5 paysans d'un coup.\nVous payez 5x le coût, mais récupérez 5x plus de ressources.\nC'est plus rapide que de cliquer 5 fois !",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 6c: COLLECTER DE LA PIERRE ====================
        {
            id: 'gather_stone',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.resource-bar-item[data-resource="stone"]',
            message: "Maintenant, collectez de la pierre. Observez le coût et le nombre de paysans envoyés !",
            condition: {
                type: 'gathering_active',
                resource: 'stone'
            },
            onEnd: {
                bonus: { stone: 20 }
            }
        },

        // ==================== ÉTAPE 7: PRIX DES BÂTIMENTS ====================
        {
            id: 'explain_prices',
            type: STEP_TYPES.EXPLAIN,
            target: '.tier-buildings[data-tier="1"] .building-item[data-building-id="hut"] .building-cost',
            arrowPosition: 'left',
            blockScroll: true,
            expandHighlight: { top: 5, bottom: 5, left: 5, right: 5 },
            message: "Attention ! Le prix des bâtiments augmente à chaque achat. Planifiez bien vos constructions.",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 8: PUITS ET CHAMP ====================
        {
            id: 'build_well_and_field',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.building-item[data-building-id="well"]',
            targets: ['.building-item[data-building-id="well"]', '.building-item[data-building-id="field"]'],
            message: "Construisez un puits (eau) et un champ (nourriture).\nCes ressources sont vitales pour vos habitants !",
            blockScroll: true,
            condition: {
                type: 'constructions_started',
                buildings: ['well', 'field']
            },
            unlockBuildings: ['hut', 'well', 'field'],
            onEnd: {
                bonus: { money: 500 }
            }
        },

        // ==================== ÉTAPE 8bis: ATTENDRE CONSTRUCTIONS ====================
        {
            id: 'wait_well_and_field',
            type: STEP_TYPES.WAIT,
            target: '.building-item[data-building-id="well"]',
            targets: ['.building-item[data-building-id="well"]', '.building-item[data-building-id="field"]'],
            message: "Attendez la fin des constructions...",
            blockScroll: true,
            condition: {
                type: 'no_construction'
            },
            onStart: {
                modifyConstructionTime: 5
            }
        },

        // ==================== ÉTAPE 8c: EXPLICATION EAU/NOURRITURE ====================
        {
            id: 'explain_consumables',
            type: STEP_TYPES.EXPLAIN,
            target: '#foodDisplay',
            targets: ['#foodDisplay', '#waterDisplay', '#populationDisplay'],
            arrowPosition: 'bottom',
            message: "L'eau et la nourriture sont essentielles !\nVotre population en consomme régulièrement.\nSans elles, vos habitants meurent de faim ou de soif.",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 8d: TIMER DE RATION ====================
        {
            id: 'explain_ration_timer',
            type: STEP_TYPES.EXPLAIN,
            target: '#rationTimerDisplay',
            arrowPosition: 'bottom',
            message: "Ce timer indique quand les rations seront distribuées.\nQuand il atteint 0, vos habitants consomment de l'eau et de la nourriture.\nAssurez-vous d'en avoir toujours en stock !",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 8e: CROISSANCE POPULATION ====================
        {
            id: 'explain_growth',
            type: STEP_TYPES.EXPLAIN,
            target: '#growthTimerDisplay',
            arrowPosition: 'bottom',
            forceShowElement: '#growthTimerDisplay',
            message: "Ce timer indique quand de nouveaux habitants arriveront.\nSi vous avez assez de nourriture et d'eau, votre population grandira naturellement !",
            buttonText: "Compris",
            onEnd: {
                resumeSystems: ['consumption', 'growth']
            }
        },

        // ==================== ÉTAPE 9: TÂCHES CLÉOPÂTRE ====================
        {
            id: 'explain_tasks',
            type: STEP_TYPES.EXPLAIN,
            target: '#cleopatraPanel',
            message: "Cléopâtre vous donne des missions. Attention au timer ! Si vous échouez, son humeur baisse.",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 10: CONSEIL HUMEUR ====================
        {
            id: 'explain_mood',
            type: STEP_TYPES.EXPLAIN,
            target: '#moodBar',
            message: "Surveillez l'humeur de Cléopâtre ! Si elle tombe à 0, c'est la fin. Réussissez ses missions pour la maintenir haute.",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 12: MAISONS ====================
        {
            id: 'build_houses',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.building-item[data-building-id="house"]',
            message: "Construisez 2 maisons ! Elles abritent plus d'habitants et fournissent des paysans supplémentaires.",
            blockScroll: true,
            condition: {
                type: 'building_count',
                building: 'house',
                count: 2
            },
            unlockBuildings: ['hut', 'well', 'field', 'house'],
            onStart: {
                modifyConstructionTime: 5
            },
            onEnd: {
                bonus: { money: 500 }
            }
        },

        // ==================== ÉTAPE 12b: ATTENDRE MAISONS ====================
        {
            id: 'wait_houses',
            type: STEP_TYPES.WAIT,
            target: '.building-item[data-building-id="house"]',
            message: "Attendez la fin des constructions...",
            blockScroll: true,
            condition: {
                type: 'no_construction'
            },
            onStart: {
                modifyConstructionTime: 5
            }
        },

        // ==================== ÉTAPE 13: VOLIÈRE ====================
        {
            id: 'build_aviary',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.building-item[data-building-id="aviary"]',
            message: "La volière produit des oiseaux messagers. Ils servent à envoyer des messages à César pour obtenir des bonus.\n\n+10 argile offerts !",
            blockScroll: true,
            condition: {
                type: 'building_count',
                building: 'aviary',
                count: 1
            },
            unlockBuildings: ['hut', 'well', 'field', 'house', 'aviary'],
            onStart: {
                bonus: { clay: 10 }
            },
            onEnd: {
                bonus: { money: 1000 }
            }
        },

        // ==================== ÉTAPE 14: ATTENDRE VOLIÈRE ====================
        {
            id: 'wait_aviary',
            type: STEP_TYPES.WAIT,
            target: '.building-item[data-building-id="aviary"]',
            message: "Attendez la construction de la volière...",
            condition: {
                type: 'no_construction'
            },
            onStart: {
                modifyConstructionTime: 5
            }
        },

        // ==================== ÉTAPE 15: EXPLICATION OISEAUX ====================
        {
            id: 'explain_birds',
            type: STEP_TYPES.EXPLAIN,
            target: '.resource-bar-item[data-resource="birds"]',
            arrowPosition: 'top',
            message: "La volière produit des oiseaux messagers.\nIls permettent d'envoyer des messages à César.",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 16: ATTENDRE OISEAU ====================
        {
            id: 'wait_bird',
            type: STEP_TYPES.WAIT,
            target: '.resource-bar-item[data-resource="birds"]',
            arrowPosition: 'top',
            message: "Attendez qu'un oiseau soit prêt...\nOn accélère un peu !",
            condition: {
                type: 'birds_available',
                count: 1
            },
            onStart: {
                modifyBirdProductionTime: 3
            }
        },

        // ==================== ÉTAPE 17: EXPLIQUER MISSION ====================
        {
            id: 'explain_message_task',
            type: STEP_TYPES.EXPLAIN,
            target: '.task-item-cleo',
            arrowPosition: 'left',
            message: "Une nouvelle mission de Cléopâtre vient d'apparaître !\nElle vous demande d'envoyer un message à César.\nRéussir rapporte de l'or et améliore son humeur.",
            buttonText: "Compris",
            onBeforeStart: {
                task: {
                    taskId: 'send_message',
                    freezeTimer: true,
                    initialTime: 60
                }
            }
        },

        // ==================== ÉTAPE 17b: OBSERVER LE TIMER ====================
        {
            id: 'watch_task_timer',
            type: STEP_TYPES.WAIT,
            target: '.task-item-cleo .task-timer',
            message: "Observez le timer de la mission...\nLe temps presse !",
            condition: {
                type: 'task_timer_low',
                seconds: 5
            },
            onStart: {
                // Dégeler le timer pour qu'il s'écoule normalement
                unfreezeTaskTimer: true,
                // Après 2s, réduire le timer à 8s avec animation
                setTaskTime: 8,
                setTaskTimeDelay: 2000,
                setTaskTimeDuration: 1500
            }
        },

        // ==================== ÉTAPE 18: ENVOYER MESSAGE ====================
        {
            id: 'send_message',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.task-item-cleo .send-message-btn-cleo',
            arrowPosition: 'right',
            message: "Vite ! Cliquez sur le bouton pour envoyer l'oiseau !\nCela coûte 1 oiseau + 150 💰.",
            condition: {
                type: 'message_sent'
            },
            onStart: {
                freezeTaskTimer: true
            }
        },

        // ==================== ÉTAPE 19: OR - BÂTIMENTS ====================
        {
            id: 'explain_gold_buildings',
            type: STEP_TYPES.EXPLAIN,
            target: '.building-item[data-building-id="market"]',
            arrowPosition: 'left',
            blockScroll: true,
            message: "Certains bâtiments produisent de l'or automatiquement !\nLe marché, le port et le colisée génèrent des revenus réguliers.",
            buttonText: "Compris",
            unlockBuildings: ['hut', 'well', 'field', 'house', 'aviary', 'workshop', 'market']
        },

        // ==================== ÉTAPE 20: OR - CONSTRUCTION ====================
        {
            id: 'explain_gold_construction',
            type: STEP_TYPES.EXPLAIN,
            target: '#moneyDisplay',
            arrowPosition: 'bottom',
            message: "Construire des bâtiments rapporte aussi de l'or !\nPlus le bâtiment est grand, plus la récompense est importante.\nLe marché et le port rapportent beaucoup d'or à la construction !",
            buttonText: "Compris"
        },

        // ==================== ÉTAPE 21: OR - MISSIONS ====================
        {
            id: 'explain_gold_missions',
            type: STEP_TYPES.EXPLAIN,
            target: '#currentTask',
            arrowPosition: 'right',
            message: "Enfin, réussir les missions de Cléopâtre rapporte de l'or.\nPlus vous êtes rapide, plus la récompense est grande !",
            buttonText: "Compris",
            onBeforeStart: {
                forceTasks: 3
            }
        },

        // ==================== ÉTAPE 22: INTRO MODE LIBRE ====================
        {
            id: 'free_play_intro',
            type: STEP_TYPES.INTRO,
            message: "Félicitations, vous maîtrisez les bases !\n\nVoici des ressources pour vous aider à démarrer.\nVotre objectif : atteindre 500 habitants.\n\nBonne chance !",
            buttonText: "C'est parti !",
            unlockBuildings: ['hut', 'well', 'field', 'house', 'aviary', 'farm', 'cistern', 'granary', 'workshop', 'bakery'],
            onBeforeStart: {
                // Mettre en pause tous les timers pendant l'affichage du message
                pauseAll: true
            },
            onStart: {
                bonus: {
                    wood: 100,
                    stone: 100,
                    sand: 100,
                    dirt: 100,
                    clay: 100
                }
            }
        },

        // ==================== ÉTAPE 23: MODE LIBRE ====================
        {
            id: 'free_play',
            type: STEP_TYPES.FREE,
            message: "Mode libre ! Atteignez 500 habitants pour terminer le tutoriel.",
            condition: {
                type: 'population',
                count: 500
            },
            onStart: {
                // Reprendre tous les timers pour le mode libre
                resumeAll: true,
                // Activer l'affichage du timer "Prochaine mission"
                setConfig: {
                    showNextTaskTimer: true,
                    autoTasks: true
                }
            }
        }
    ]
};

export default TUTORIAL_SCENARIO;
