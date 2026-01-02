// ==========================================
// TESTS - GAME CONFIG
// ==========================================
// Tests unitaires pour le système de configuration du jeu.
// ==========================================

import { describe, it, beforeEach, Assert } from './test-framework.js';
import GameConfig, { DEFAULT_CONFIG } from '../src/core/game-config.js';

// ==========================================
// MOCK DATA
// ==========================================

const MOCK_SCENARIO_SIMPLE = {
    id: 'test_simple',
    name: 'Test Simple',
    config: {
        startingMoney: 5000,
        startingPeasants: 20
    }
};

const MOCK_SCENARIO_DEEP = {
    id: 'test_deep',
    name: 'Test Deep Merge',
    config: {
        startingResources: {
            wood: 100,
            stone: 50
        },
        tierUnlockTimes: {
            2: {
                time: 60,
                name: 'Test Tier 2',
                icon: '🔧',
                color: '#ff0000'
            }
        }
    }
};

const MOCK_SCENARIO_TUTORIAL = {
    id: 'test_tutorial',
    name: 'Test Tutorial',
    config: {
        startingMoney: 2000,
        unlockedBuildings: ['hut'],
        tutorialMode: true,
        disableTasks: false
    }
};

const MOCK_SCENARIO_EMPTY = {
    id: 'test_empty',
    name: 'Test Empty Config',
    config: {}
};

const MOCK_SCENARIOS = {
    test_simple: MOCK_SCENARIO_SIMPLE,
    test_deep: MOCK_SCENARIO_DEEP,
    test_tutorial: MOCK_SCENARIO_TUTORIAL,
    test_empty: MOCK_SCENARIO_EMPTY
};

// ==========================================
// TESTS
// ==========================================

describe('GameConfig - Initialisation', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait initialiser avec les valeurs par défaut', () => {
        Assert.equals(config.startingMoney, DEFAULT_CONFIG.startingMoney);
        Assert.equals(config.startingPeasants, DEFAULT_CONFIG.startingPeasants);
        Assert.equals(config.startingMood, DEFAULT_CONFIG.startingMood);
    });

    it('devrait avoir scenarioId null au départ', () => {
        Assert.isNull(config.scenarioId);
    });

    it('devrait avoir scenario null au départ', () => {
        Assert.isNull(config.scenario);
    });

    it('devrait avoir tutorialMode false par défaut', () => {
        Assert.isFalse(config.tutorialMode);
    });

    it('devrait avoir unlockedBuildings null par défaut (pas de restriction)', () => {
        Assert.isNull(config.unlockedBuildings);
    });
});

describe('GameConfig - loadScenario (simple)', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait charger un scénario simple', () => {
        config.loadScenario(MOCK_SCENARIO_SIMPLE);
        Assert.equals(config.scenarioId, 'test_simple');
        Assert.equals(config.startingMoney, 5000);
        Assert.equals(config.startingPeasants, 20);
    });

    it('devrait garder les valeurs par défaut non overridées', () => {
        config.loadScenario(MOCK_SCENARIO_SIMPLE);
        Assert.equals(config.startingMood, DEFAULT_CONFIG.startingMood);
        Assert.equals(config.startingBirds, DEFAULT_CONFIG.startingBirds);
    });

    it('devrait stocker la référence au scénario complet', () => {
        config.loadScenario(MOCK_SCENARIO_SIMPLE);
        Assert.equals(config.scenario, MOCK_SCENARIO_SIMPLE);
    });

    it('devrait gérer un scénario avec config vide', () => {
        config.loadScenario(MOCK_SCENARIO_EMPTY);
        Assert.equals(config.scenarioId, 'test_empty');
        Assert.equals(config.startingMoney, DEFAULT_CONFIG.startingMoney);
    });

    it('devrait ignorer un scénario null', () => {
        config.loadScenario(MOCK_SCENARIO_SIMPLE);
        const oldMoney = config.startingMoney;
        config.loadScenario(null);
        Assert.equals(config.startingMoney, oldMoney);
    });
});

describe('GameConfig - loadScenario (deep merge)', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait merger profondément les ressources de départ', () => {
        config.loadScenario(MOCK_SCENARIO_DEEP);

        // Valeurs overridées
        Assert.equals(config.startingResources.wood, 100);
        Assert.equals(config.startingResources.stone, 50);

        // Valeurs non overridées (doivent rester aux defaults)
        Assert.equals(config.startingResources.sand, DEFAULT_CONFIG.startingResources.sand);
        Assert.equals(config.startingResources.dirt, DEFAULT_CONFIG.startingResources.dirt);
    });

    it('devrait merger profondément les tierUnlockTimes', () => {
        config.loadScenario(MOCK_SCENARIO_DEEP);

        // Valeur overridée (tier 2 complètement remplacé)
        Assert.equals(config.tierUnlockTimes[2].time, 60);
        Assert.equals(config.tierUnlockTimes[2].name, 'Test Tier 2');

        // Valeurs non overridées (tier 1 et 3 gardent leurs valeurs)
        Assert.equals(config.tierUnlockTimes[1].time, DEFAULT_CONFIG.tierUnlockTimes[1].time);
        Assert.equals(config.tierUnlockTimes[3].time, DEFAULT_CONFIG.tierUnlockTimes[3].time);
    });
});

describe('GameConfig - reset', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
        config.loadScenario(MOCK_SCENARIO_SIMPLE);
    });

    it('devrait réinitialiser aux valeurs par défaut', () => {
        config.reset();
        Assert.equals(config.startingMoney, DEFAULT_CONFIG.startingMoney);
        Assert.equals(config.startingPeasants, DEFAULT_CONFIG.startingPeasants);
    });

    it('devrait effacer scenarioId', () => {
        config.reset();
        Assert.isNull(config.scenarioId);
    });

    it('devrait effacer la référence au scénario', () => {
        config.reset();
        Assert.isNull(config.scenario);
    });
});

describe('GameConfig - isBuildingUnlocked', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait retourner true pour un bâtiment du tier actuel (mode normal)', () => {
        // Mode normal: unlockedBuildings = null, donc basé sur le tier
        const building = Object.entries(config.buildings).find(([id, b]) => b.tier === 1);
        if (building) {
            const isUnlocked = config.isBuildingUnlocked(building[0], 1);
            Assert.isTrue(isUnlocked);
        }
    });

    it('devrait retourner false pour un bâtiment de tier supérieur (mode normal)', () => {
        const building = Object.entries(config.buildings).find(([id, b]) => b.tier === 2);
        if (building) {
            const isUnlocked = config.isBuildingUnlocked(building[0], 1);
            Assert.isFalse(isUnlocked);
        }
    });

    it('devrait respecter unlockedBuildings quand défini', () => {
        config.loadScenario(MOCK_SCENARIO_TUTORIAL);
        Assert.isTrue(config.isBuildingUnlocked('hut', 1));

        // Un bâtiment non dans la liste devrait être bloqué
        const building = Object.entries(config.buildings).find(([id, b]) => id !== 'hut' && b.tier === 1);
        if (building) {
            Assert.isFalse(config.isBuildingUnlocked(building[0], 1));
        }
    });

    it('devrait retourner false pour un bâtiment inexistant', () => {
        Assert.isFalse(config.isBuildingUnlocked('inexistant_building', 1));
    });
});

describe('GameConfig - getUnlockedBuildings', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait retourner les bâtiments du tier actuel', () => {
        const buildings = config.getUnlockedBuildings(1);
        Assert.isTrue(buildings.length > 0);
        buildings.forEach(b => {
            Assert.isTrue(b.tier <= 1, `Bâtiment ${b.id} devrait être tier <= 1`);
        });
    });

    it('devrait inclure les bâtiments des tiers inférieurs', () => {
        const buildingsTier1 = config.getUnlockedBuildings(1);
        const buildingsTier2 = config.getUnlockedBuildings(2);
        Assert.isTrue(buildingsTier2.length >= buildingsTier1.length);
    });

    it('devrait respecter unlockedBuildings quand défini', () => {
        config.loadScenario(MOCK_SCENARIO_TUTORIAL);
        const buildings = config.getUnlockedBuildings(3);
        Assert.equals(buildings.length, 1);
        Assert.equals(buildings[0].id, 'hut');
    });
});

describe('GameConfig - unlockBuilding', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
        config.loadScenario(MOCK_SCENARIO_TUTORIAL);
    });

    it('devrait ajouter un bâtiment à la liste des débloqués', () => {
        Assert.isFalse(config.isBuildingUnlocked('well', 1));
        config.unlockBuilding('well');
        Assert.isTrue(config.isBuildingUnlocked('well', 1));
    });

    it('ne devrait pas dupliquer un bâtiment déjà débloqué', () => {
        config.unlockBuilding('hut');
        config.unlockBuilding('hut');
        const count = config.unlockedBuildings.filter(b => b === 'hut').length;
        Assert.equals(count, 1);
    });

    it('ne devrait rien faire si unlockedBuildings est null', () => {
        config.reset();
        config.unlockBuilding('well');
        Assert.isNull(config.unlockedBuildings);
    });
});

describe('GameConfig - setUnlockedBuildings', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait définir la liste des bâtiments débloqués', () => {
        config.setUnlockedBuildings(['hut', 'well']);
        Assert.deepEquals(config.unlockedBuildings, ['hut', 'well']);
    });

    it('devrait permettre de remettre à null', () => {
        config.setUnlockedBuildings(['hut']);
        config.setUnlockedBuildings(null);
        Assert.isNull(config.unlockedBuildings);
    });
});

describe('GameConfig - getAvailableTasks', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait retourner des tâches pour le tier actuel', () => {
        const tasks = config.getAvailableTasks(1);
        Assert.isTrue(Array.isArray(tasks));
        tasks.forEach(task => {
            Assert.isTrue(task.tier <= 1, `Tâche devrait être tier <= 1`);
        });
    });

    it('devrait retourner un tableau vide si disableTasks est true', () => {
        config.config.disableTasks = true;
        const tasks = config.getAvailableTasks(1);
        Assert.hasLength(tasks, 0);
    });
});

describe('GameConfig - Sauvegarde et chargement', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait sauvegarder le scenarioId', () => {
        config.loadScenario(MOCK_SCENARIO_SIMPLE);
        const saveData = config.toSaveData();
        Assert.equals(saveData.scenarioId, 'test_simple');
    });

    it('devrait sauvegarder les overrides runtime', () => {
        config.loadScenario(MOCK_SCENARIO_TUTORIAL);
        config.unlockBuilding('well');
        const saveData = config.toSaveData();
        Assert.contains(saveData.runtimeOverrides.unlockedBuildings, 'well');
    });

    it('devrait restaurer depuis une sauvegarde', () => {
        config.loadScenario(MOCK_SCENARIO_TUTORIAL);
        config.unlockBuilding('well');
        const saveData = config.toSaveData();

        // Créer une nouvelle instance et restaurer
        const newConfig = new GameConfig();
        newConfig.fromSaveData(saveData, MOCK_SCENARIOS);

        Assert.equals(newConfig.scenarioId, 'test_tutorial');
        Assert.contains(newConfig.unlockedBuildings, 'well');
    });

    it('devrait gérer une sauvegarde sans scenarioId', () => {
        const newConfig = new GameConfig();
        newConfig.fromSaveData({}, MOCK_SCENARIOS);
        Assert.isNull(newConfig.scenarioId);
    });

    it('devrait gérer un scénario non trouvé', () => {
        const newConfig = new GameConfig();
        newConfig.fromSaveData({ scenarioId: 'inexistant' }, MOCK_SCENARIOS);
        Assert.isNull(newConfig.scenarioId);
    });
});

describe('GameConfig - deepClone', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait cloner les valeurs primitives', () => {
        Assert.equals(config.deepClone(42), 42);
        Assert.equals(config.deepClone('hello'), 'hello');
        Assert.equals(config.deepClone(null), null);
    });

    it('devrait cloner les tableaux', () => {
        const original = [1, 2, 3];
        const cloned = config.deepClone(original);
        Assert.deepEquals(cloned, original);
        Assert.notEquals(cloned, original);
    });

    it('devrait cloner les objets', () => {
        const original = { a: 1, b: { c: 2 } };
        const cloned = config.deepClone(original);
        Assert.deepEquals(cloned, original);
        Assert.notEquals(cloned, original);
        Assert.notEquals(cloned.b, original.b);
    });
});

describe('GameConfig - deepMerge', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait merger des objets simples', () => {
        const target = { a: 1, b: 2 };
        const source = { b: 3, c: 4 };
        const result = config.deepMerge(target, source);
        Assert.deepEquals(result, { a: 1, b: 3, c: 4 });
    });

    it('devrait merger profondément', () => {
        const target = { outer: { a: 1, b: 2 } };
        const source = { outer: { b: 3 } };
        const result = config.deepMerge(target, source);
        Assert.deepEquals(result, { outer: { a: 1, b: 3 } });
    });

    it('devrait remplacer les tableaux (pas de merge)', () => {
        const target = { arr: [1, 2, 3] };
        const source = { arr: [4, 5] };
        const result = config.deepMerge(target, source);
        Assert.deepEquals(result, { arr: [4, 5] });
    });

    it('devrait gérer source null ou undefined', () => {
        const target = { a: 1 };
        Assert.deepEquals(config.deepMerge(target, null), { a: 1 });
        Assert.deepEquals(config.deepMerge(target, undefined), { a: 1 });
    });

    it('devrait remplacer si source est primitive', () => {
        const target = { a: { b: 1 } };
        const source = { a: 42 };
        const result = config.deepMerge(target, source);
        Assert.equals(result.a, 42);
    });
});

describe('GameConfig - Accesseurs', () => {
    let config;

    beforeEach(() => {
        config = new GameConfig();
    });

    it('devrait fournir getBuilding()', () => {
        // Vérifier que buildings est défini
        Assert.isDefined(config.buildings, 'config.buildings devrait être défini');
        Assert.isTrue(Object.keys(config.buildings).length > 0, 'config.buildings devrait contenir des bâtiments');

        // Récupérer le premier bâtiment disponible pour tester
        const firstBuildingId = Object.keys(config.buildings)[0];
        const building = config.getBuilding(firstBuildingId);
        Assert.isDefined(building, `Le bâtiment '${firstBuildingId}' devrait exister`);
    });

    it('devrait retourner undefined pour un bâtiment inexistant', () => {
        Assert.isUndefined(config.getBuilding('inexistant'));
    });

    it('devrait fournir getBuildingShapes()', () => {
        const shapes = config.getBuildingShapes('hut');
        if (shapes) {
            Assert.isType(shapes, 'object');
        }
    });

    it('devrait fournir getResource()', () => {
        const wood = config.getResource('wood');
        Assert.isDefined(wood);
    });

    it('devrait fournir getTask() pour trouver une tâche par ID', () => {
        const tasks = config.tasks;
        if (tasks.length > 0) {
            const firstTask = tasks[0];
            const found = config.getTask(firstTask.id);
            Assert.equals(found.id, firstTask.id);
        }
    });
});
