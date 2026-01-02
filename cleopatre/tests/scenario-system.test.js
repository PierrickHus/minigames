// ==========================================
// TESTS - SCENARIO SYSTEM
// ==========================================
// Tests unitaires pour le système de scénarios.
// ==========================================

import { describe, it, beforeEach, Assert } from './test-framework.js';
import { STEP_TYPES } from '../src/data/scenarios/index.js';

// ==========================================
// MOCK GAME OBJECT
// ==========================================

/**
 * Crée un objet Game mock pour les tests
 * @returns {object} Mock du jeu
 */
function createMockGame() {
    return {
        state: {
            money: 1000,
            peasants: 10,
            population: 0,
            mood: 100,
            birds: 0,
            resources: { wood: 0, stone: 0, sand: 0, dirt: 0, clay: 0 },
            consumables: { food: 100, water: 100 },
            buildings: {},
            constructions: [],
            gatheringTasks: [],
            messagesSent: 0
        },
        config: {
            victory: { population: 500 },
            defeat: { mood: 0 },
            tutorialMode: false,
            loadScenario: function(scenario) {
                this.scenarioId = scenario.id;
            },
            setUnlockedBuildings: function(buildings) {
                this.unlockedBuildings = buildings;
            }
        },
        panels: {
            currentMultiplier: 1,
            refreshBuildingsPanel: function() {}
        },
        notifications: {
            success: function(message) {
                this.lastMessage = message;
            },
            lastMessage: null
        },
        onScenarioVictory: null,
        onScenarioDefeat: null
    };
}

// ==========================================
// MOCK SCENARIO DATA
// ==========================================

const MOCK_SCENARIO_NO_STEPS = {
    id: 'test_no_steps',
    name: 'Test No Steps',
    description: 'Scénario sans étapes',
    config: {
        startingMoney: 2000
    },
    steps: null
};

const MOCK_SCENARIO_WITH_STEPS = {
    id: 'test_with_steps',
    name: 'Test With Steps',
    description: 'Scénario avec étapes',
    config: {
        startingMoney: 2000,
        tutorialMode: true
    },
    steps: [
        {
            id: 'intro',
            type: STEP_TYPES.INTRO,
            message: 'Bienvenue!',
            buttonText: 'Commencer'
        },
        {
            id: 'build_hut',
            type: STEP_TYPES.HIGHLIGHT,
            target: '.building-hut',
            message: 'Construisez une hutte',
            condition: { type: 'building_count', building: 'hut', count: 1 },
            unlockBuildings: ['hut']
        },
        {
            id: 'wait_construction',
            type: STEP_TYPES.WAIT,
            message: 'Attendez la construction...',
            condition: { type: 'no_construction' }
        },
        {
            id: 'explain',
            type: STEP_TYPES.EXPLAIN,
            message: 'Explication importante',
            target: '.resource-panel',
            buttonText: 'Compris!'
        },
        {
            id: 'free_mode',
            type: STEP_TYPES.FREE,
            message: 'Mode libre!',
            condition: { type: 'population', count: 500 }
        }
    ]
};

// ==========================================
// CLASSE SCENARIO SYSTEM SIMPLIFIÉE POUR TESTS
// ==========================================

/**
 * Version simplifiée de ScenarioSystem pour les tests
 * (sans les dépendances DOM)
 */
class ScenarioSystemTestable {
    constructor(game) {
        this.game = game;
        this.currentScenario = null;
        this.currentStepIndex = -1;
        this.isActive = false;
        this.isComplete = false;
        this.victory = false;
        this._messageCountAtStepStart = 0;
    }

    loadScenario(scenario) {
        if (!scenario) return false;

        this.currentScenario = scenario;
        this.currentStepIndex = -1;
        this.isActive = false;
        this.isComplete = false;
        this.victory = false;

        this.game.config.loadScenario(scenario);
        return true;
    }

    start() {
        if (!this.currentScenario) return;

        this.isActive = true;

        if (this.currentScenario.steps && this.currentScenario.steps.length > 0) {
            this.nextStep();
        }
    }

    nextStep() {
        if (!this.currentScenario?.steps) return;

        this.currentStepIndex++;

        if (this.currentStepIndex >= this.currentScenario.steps.length) {
            return;
        }

        const step = this.getCurrentStep();
        if (!step) return;

        if (step.unlockBuildings) {
            this.game.config.setUnlockedBuildings([...step.unlockBuildings]);
        }
    }

    getCurrentStep() {
        if (!this.currentScenario?.steps) return null;
        if (this.currentStepIndex < 0 || this.currentStepIndex >= this.currentScenario.steps.length) return null;
        return this.currentScenario.steps[this.currentStepIndex];
    }

    checkCondition(condition) {
        const state = this.game.state;

        switch (condition.type) {
            case 'building_count': {
                const count = state.buildings[condition.building] || 0;
                return count >= condition.count;
            }

            case 'no_construction': {
                return !state.constructions || state.constructions.length === 0;
            }

            case 'gathering_active': {
                const tasks = state.gatheringTasks || [];
                if (condition.resource) {
                    return tasks.some(t => t.resource === condition.resource);
                }
                return tasks.length > 0;
            }

            case 'multiplier_set': {
                return this.game.panels?.currentMultiplier === condition.value;
            }

            case 'message_sent': {
                return state.messagesSent > (this._messageCountAtStepStart || 0);
            }

            case 'population': {
                return state.population >= condition.count;
            }

            case 'resource': {
                const amount = state.resources[condition.resource] || 0;
                return amount >= condition.count;
            }

            case 'money': {
                return state.money >= condition.count;
            }

            default:
                return false;
        }
    }

    giveBonus(bonus) {
        const state = this.game.state;

        if (bonus.money) state.money += bonus.money;
        if (bonus.wood) state.resources.wood += bonus.wood;
        if (bonus.stone) state.resources.stone += bonus.stone;
        if (bonus.dirt) state.resources.dirt += bonus.dirt;
        if (bonus.clay) state.resources.clay += bonus.clay;
        if (bonus.sand) state.resources.sand += bonus.sand;
        if (bonus.food) state.consumables.food += bonus.food;
        if (bonus.water) state.consumables.water += bonus.water;
        if (bonus.birds) state.birds += bonus.birds;
        if (bonus.peasants) state.peasants += bonus.peasants;
    }

    checkVictory() {
        const victory = this.game.config.victory;
        if (!victory) return false;

        const state = this.game.state;

        if (victory.population && state.population >= victory.population) {
            this.end(true);
            return true;
        }

        return false;
    }

    checkDefeat() {
        if (this.game.config.tutorialMode) return false;

        const defeat = this.game.config.defeat;
        if (!defeat) return false;

        const state = this.game.state;

        if (defeat.mood !== undefined && state.mood <= defeat.mood) {
            this.end(false);
            return true;
        }

        return false;
    }

    end(success) {
        this.isActive = false;
        this.isComplete = true;
        this.victory = success;

        if (success && this.game.onScenarioVictory) {
            this.game.onScenarioVictory();
        } else if (!success && this.game.onScenarioDefeat) {
            this.game.onScenarioDefeat();
        }
    }

    toSaveData() {
        return {
            scenarioId: this.currentScenario?.id || null,
            stepIndex: this.currentStepIndex,
            isActive: this.isActive,
            isComplete: this.isComplete,
            victory: this.victory
        };
    }
}

// ==========================================
// TESTS
// ==========================================

describe('ScenarioSystem - Initialisation', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
    });

    it('devrait initialiser avec des valeurs par défaut', () => {
        Assert.isNull(scenario.currentScenario);
        Assert.equals(scenario.currentStepIndex, -1);
        Assert.isFalse(scenario.isActive);
        Assert.isFalse(scenario.isComplete);
        Assert.isFalse(scenario.victory);
    });
});

describe('ScenarioSystem - loadScenario', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
    });

    it('devrait charger un scénario', () => {
        const result = scenario.loadScenario(MOCK_SCENARIO_NO_STEPS);
        Assert.isTrue(result);
        Assert.equals(scenario.currentScenario.id, 'test_no_steps');
    });

    it('devrait réinitialiser les compteurs au chargement', () => {
        scenario.isActive = true;
        scenario.currentStepIndex = 5;

        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);

        Assert.equals(scenario.currentStepIndex, -1);
        Assert.isFalse(scenario.isActive);
        Assert.isFalse(scenario.isComplete);
    });

    it('devrait retourner false pour un scénario null', () => {
        const result = scenario.loadScenario(null);
        Assert.isFalse(result);
    });

    it('devrait appeler game.config.loadScenario', () => {
        scenario.loadScenario(MOCK_SCENARIO_NO_STEPS);
        Assert.equals(game.config.scenarioId, 'test_no_steps');
    });
});

describe('ScenarioSystem - start', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
    });

    it('devrait marquer le scénario comme actif', () => {
        scenario.loadScenario(MOCK_SCENARIO_NO_STEPS);
        scenario.start();
        Assert.isTrue(scenario.isActive);
    });

    it('devrait passer à la première étape si le scénario en a', () => {
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        scenario.start();
        Assert.equals(scenario.currentStepIndex, 0);
    });

    it('devrait rester à -1 si pas d\'étapes', () => {
        scenario.loadScenario(MOCK_SCENARIO_NO_STEPS);
        scenario.start();
        Assert.equals(scenario.currentStepIndex, -1);
    });

    it('ne devrait rien faire si aucun scénario chargé', () => {
        scenario.start();
        Assert.isFalse(scenario.isActive);
    });
});

describe('ScenarioSystem - nextStep', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        scenario.start();
    });

    it('devrait incrémenter currentStepIndex', () => {
        Assert.equals(scenario.currentStepIndex, 0);
        scenario.nextStep();
        Assert.equals(scenario.currentStepIndex, 1);
    });

    it('devrait appliquer unlockBuildings de l\'étape', () => {
        scenario.nextStep(); // Passer à l'étape 1 (build_hut)
        Assert.deepEquals(game.config.unlockedBuildings, ['hut']);
    });

    it('devrait gérer la fin des étapes', () => {
        for (let i = 0; i < MOCK_SCENARIO_WITH_STEPS.steps.length; i++) {
            scenario.nextStep();
        }
        Assert.equals(scenario.currentStepIndex, MOCK_SCENARIO_WITH_STEPS.steps.length);
    });
});

describe('ScenarioSystem - getCurrentStep', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
    });

    it('devrait retourner null si pas de scénario', () => {
        Assert.isNull(scenario.getCurrentStep());
    });

    it('devrait retourner null si stepIndex < 0', () => {
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        Assert.isNull(scenario.getCurrentStep());
    });

    it('devrait retourner l\'étape actuelle', () => {
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        scenario.start();
        const step = scenario.getCurrentStep();
        Assert.equals(step.id, 'intro');
        Assert.equals(step.type, STEP_TYPES.INTRO);
    });

    it('devrait retourner null si au-delà des étapes', () => {
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        scenario.currentStepIndex = 999;
        Assert.isNull(scenario.getCurrentStep());
    });
});

describe('ScenarioSystem - checkCondition', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
    });

    it('devrait vérifier building_count', () => {
        game.state.buildings.hut = 2;
        Assert.isTrue(scenario.checkCondition({ type: 'building_count', building: 'hut', count: 2 }));
        Assert.isFalse(scenario.checkCondition({ type: 'building_count', building: 'hut', count: 3 }));
    });

    it('devrait vérifier no_construction', () => {
        game.state.constructions = [];
        Assert.isTrue(scenario.checkCondition({ type: 'no_construction' }));

        game.state.constructions = [{ building: 'hut' }];
        Assert.isFalse(scenario.checkCondition({ type: 'no_construction' }));
    });

    it('devrait vérifier gathering_active', () => {
        game.state.gatheringTasks = [];
        Assert.isFalse(scenario.checkCondition({ type: 'gathering_active' }));

        game.state.gatheringTasks = [{ resource: 'wood' }];
        Assert.isTrue(scenario.checkCondition({ type: 'gathering_active' }));
        Assert.isTrue(scenario.checkCondition({ type: 'gathering_active', resource: 'wood' }));
        Assert.isFalse(scenario.checkCondition({ type: 'gathering_active', resource: 'stone' }));
    });

    it('devrait vérifier multiplier_set', () => {
        game.panels.currentMultiplier = 5;
        Assert.isTrue(scenario.checkCondition({ type: 'multiplier_set', value: 5 }));
        Assert.isFalse(scenario.checkCondition({ type: 'multiplier_set', value: 10 }));
    });

    it('devrait vérifier message_sent', () => {
        scenario._messageCountAtStepStart = 0;
        game.state.messagesSent = 0;
        Assert.isFalse(scenario.checkCondition({ type: 'message_sent' }));

        game.state.messagesSent = 1;
        Assert.isTrue(scenario.checkCondition({ type: 'message_sent' }));
    });

    it('devrait vérifier population', () => {
        game.state.population = 100;
        Assert.isTrue(scenario.checkCondition({ type: 'population', count: 100 }));
        Assert.isFalse(scenario.checkCondition({ type: 'population', count: 200 }));
    });

    it('devrait vérifier resource', () => {
        game.state.resources.wood = 50;
        Assert.isTrue(scenario.checkCondition({ type: 'resource', resource: 'wood', count: 50 }));
        Assert.isFalse(scenario.checkCondition({ type: 'resource', resource: 'wood', count: 100 }));
    });

    it('devrait vérifier money', () => {
        game.state.money = 500;
        Assert.isTrue(scenario.checkCondition({ type: 'money', count: 500 }));
        Assert.isFalse(scenario.checkCondition({ type: 'money', count: 1000 }));
    });

    it('devrait retourner false pour un type inconnu', () => {
        Assert.isFalse(scenario.checkCondition({ type: 'unknown_type' }));
    });
});

describe('ScenarioSystem - giveBonus', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
    });

    it('devrait donner un bonus d\'argent', () => {
        const initialMoney = game.state.money;
        scenario.giveBonus({ money: 500 });
        Assert.equals(game.state.money, initialMoney + 500);
    });

    it('devrait donner un bonus de ressources', () => {
        scenario.giveBonus({ wood: 100, stone: 50 });
        Assert.equals(game.state.resources.wood, 100);
        Assert.equals(game.state.resources.stone, 50);
    });

    it('devrait donner un bonus de consommables', () => {
        const initialFood = game.state.consumables.food;
        scenario.giveBonus({ food: 50, water: 30 });
        Assert.equals(game.state.consumables.food, initialFood + 50);
        Assert.equals(game.state.consumables.water, 130);
    });

    it('devrait donner un bonus d\'oiseaux', () => {
        scenario.giveBonus({ birds: 3 });
        Assert.equals(game.state.birds, 3);
    });

    it('devrait donner un bonus de paysans', () => {
        const initialPeasants = game.state.peasants;
        scenario.giveBonus({ peasants: 5 });
        Assert.equals(game.state.peasants, initialPeasants + 5);
    });

    it('devrait gérer plusieurs bonus à la fois', () => {
        scenario.giveBonus({
            money: 1000,
            wood: 50,
            birds: 2,
            peasants: 3
        });
        Assert.equals(game.state.money, 2000);
        Assert.equals(game.state.resources.wood, 50);
        Assert.equals(game.state.birds, 2);
        Assert.equals(game.state.peasants, 13);
    });
});

describe('ScenarioSystem - checkVictory', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        scenario.start();
    });

    it('devrait détecter la victoire', () => {
        game.state.population = 500;
        const result = scenario.checkVictory();
        Assert.isTrue(result);
        Assert.isTrue(scenario.victory);
        Assert.isTrue(scenario.isComplete);
    });

    it('ne devrait pas déclencher la victoire en dessous du seuil', () => {
        game.state.population = 499;
        const result = scenario.checkVictory();
        Assert.isFalse(result);
        Assert.isFalse(scenario.isComplete);
    });

    it('devrait appeler onScenarioVictory', () => {
        let called = false;
        game.onScenarioVictory = () => { called = true; };

        game.state.population = 500;
        scenario.checkVictory();
        Assert.isTrue(called);
    });
});

describe('ScenarioSystem - checkDefeat', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
        scenario.loadScenario(MOCK_SCENARIO_NO_STEPS);
        scenario.start();
    });

    it('devrait détecter la défaite', () => {
        game.state.mood = 0;
        const result = scenario.checkDefeat();
        Assert.isTrue(result);
        Assert.isFalse(scenario.victory);
        Assert.isTrue(scenario.isComplete);
    });

    it('ne devrait pas déclencher la défaite si mood > 0', () => {
        game.state.mood = 1;
        const result = scenario.checkDefeat();
        Assert.isFalse(result);
        Assert.isFalse(scenario.isComplete);
    });

    it('devrait ignorer la défaite en mode tutoriel', () => {
        game.config.tutorialMode = true;
        game.state.mood = 0;
        const result = scenario.checkDefeat();
        Assert.isFalse(result);
        Assert.isFalse(scenario.isComplete);
    });

    it('devrait appeler onScenarioDefeat', () => {
        let called = false;
        game.onScenarioDefeat = () => { called = true; };

        game.state.mood = 0;
        scenario.checkDefeat();
        Assert.isTrue(called);
    });
});

describe('ScenarioSystem - end', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        scenario.start();
    });

    it('devrait marquer le scénario comme terminé', () => {
        scenario.end(true);
        Assert.isTrue(scenario.isComplete);
        Assert.isFalse(scenario.isActive);
    });

    it('devrait stocker le résultat de victoire', () => {
        scenario.end(true);
        Assert.isTrue(scenario.victory);

        scenario.victory = false;
        scenario.isComplete = false;
        scenario.isActive = true;

        scenario.end(false);
        Assert.isFalse(scenario.victory);
    });
});

describe('ScenarioSystem - toSaveData', () => {
    let game;
    let scenario;

    beforeEach(() => {
        game = createMockGame();
        scenario = new ScenarioSystemTestable(game);
    });

    it('devrait retourner les données de sauvegarde', () => {
        scenario.loadScenario(MOCK_SCENARIO_WITH_STEPS);
        scenario.start();
        scenario.nextStep();

        const saveData = scenario.toSaveData();

        Assert.equals(saveData.scenarioId, 'test_with_steps');
        Assert.equals(saveData.stepIndex, 1);
        Assert.isTrue(saveData.isActive);
        Assert.isFalse(saveData.isComplete);
        Assert.isFalse(saveData.victory);
    });

    it('devrait gérer l\'absence de scénario', () => {
        const saveData = scenario.toSaveData();
        Assert.isNull(saveData.scenarioId);
    });
});

describe('STEP_TYPES', () => {
    it('devrait avoir tous les types d\'étapes', () => {
        Assert.isDefined(STEP_TYPES.INTRO);
        Assert.isDefined(STEP_TYPES.HIGHLIGHT);
        Assert.isDefined(STEP_TYPES.WAIT);
        Assert.isDefined(STEP_TYPES.EXPLAIN);
        Assert.isDefined(STEP_TYPES.FREE);
    });

    it('devrait avoir des valeurs uniques', () => {
        const values = Object.values(STEP_TYPES);
        const uniqueValues = [...new Set(values)];
        Assert.equals(values.length, uniqueValues.length);
    });
});
