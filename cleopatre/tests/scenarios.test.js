// ==========================================
// TESTS - SCÉNARIOS
// ==========================================
// Tests unitaires pour les données des scénarios.
// ==========================================

import { describe, it, Assert } from './test-framework.js';
import SCENARIOS, { getScenarioList, getScenario, STEP_TYPES } from '../src/data/scenarios/index.js';

// ==========================================
// TESTS - REGISTRY DES SCÉNARIOS
// ==========================================

describe('Scenarios Registry - Structure', () => {
    it('devrait exporter SCENARIOS comme objet', () => {
        Assert.isType(SCENARIOS, 'object');
    });

    it('devrait contenir le scénario tutorial', () => {
        Assert.isDefined(SCENARIOS.tutorial);
    });

    it('devrait contenir le scénario freeplay', () => {
        Assert.isDefined(SCENARIOS.freeplay);
    });

    it('devrait exporter getScenarioList comme fonction', () => {
        Assert.isType(getScenarioList, 'function');
    });

    it('devrait exporter getScenario comme fonction', () => {
        Assert.isType(getScenario, 'function');
    });

    it('devrait exporter STEP_TYPES', () => {
        Assert.isDefined(STEP_TYPES);
    });
});

describe('Scenarios Registry - getScenarioList', () => {
    it('devrait retourner un tableau', () => {
        const list = getScenarioList();
        Assert.isTrue(Array.isArray(list));
    });

    it('devrait contenir au moins 2 scénarios', () => {
        const list = getScenarioList();
        Assert.isTrue(list.length >= 2);
    });

    it('devrait retourner des objets avec id, name, description, icon', () => {
        const list = getScenarioList();
        list.forEach(scenario => {
            Assert.isDefined(scenario.id);
            Assert.isDefined(scenario.name);
            Assert.isDefined(scenario.description);
            Assert.isDefined(scenario.icon);
        });
    });
});

describe('Scenarios Registry - getScenario', () => {
    it('devrait retourner un scénario par ID', () => {
        const tutorial = getScenario('tutorial');
        Assert.isDefined(tutorial);
        Assert.equals(tutorial.id, 'tutorial');
    });

    it('devrait retourner undefined pour un ID inexistant', () => {
        const result = getScenario('inexistant');
        Assert.isUndefined(result);
    });
});

// ==========================================
// TESTS - SCÉNARIO TUTORIAL
// ==========================================

describe('Tutorial Scenario - Structure', () => {
    const tutorial = SCENARIOS.tutorial;

    it('devrait avoir un ID correct', () => {
        Assert.equals(tutorial.id, 'tutorial');
    });

    it('devrait avoir un nom', () => {
        Assert.isType(tutorial.name, 'string');
        Assert.isTrue(tutorial.name.length > 0);
    });

    it('devrait avoir une description', () => {
        Assert.isType(tutorial.description, 'string');
        Assert.isTrue(tutorial.description.length > 0);
    });

    it('devrait avoir un icône', () => {
        Assert.isDefined(tutorial.icon);
    });

    it('devrait être recommandé', () => {
        Assert.isTrue(tutorial.recommended);
    });

    it('devrait avoir une config', () => {
        Assert.isDefined(tutorial.config);
        Assert.isType(tutorial.config, 'object');
    });

    it('devrait avoir des steps', () => {
        Assert.isTrue(Array.isArray(tutorial.steps));
        Assert.isTrue(tutorial.steps.length > 0);
    });
});

describe('Tutorial Scenario - Config', () => {
    const config = SCENARIOS.tutorial.config;

    it('devrait avoir startingMoney > 1000', () => {
        Assert.isGreaterThan(config.startingMoney, 1000);
    });

    it('devrait avoir des ressources de départ', () => {
        Assert.isDefined(config.startingResources);
        Assert.isGreaterThan(config.startingResources.wood, 0);
        Assert.isGreaterThan(config.startingResources.stone, 0);
    });

    it('devrait avoir des consommables de départ', () => {
        Assert.isDefined(config.startingConsumables);
        Assert.isGreaterThan(config.startingConsumables.food, 0);
        Assert.isGreaterThan(config.startingConsumables.water, 0);
    });

    it('devrait avoir un taskCooldown réduit', () => {
        Assert.isLessThan(config.taskCooldown, 45);
    });

    it('devrait avoir des tierUnlockTimes réduits', () => {
        Assert.isDefined(config.tierUnlockTimes);
        Assert.equals(config.tierUnlockTimes[1], 0);
        Assert.isLessThan(config.tierUnlockTimes[2], 120);
    });

    it('devrait avoir un objectif de victoire réduit', () => {
        Assert.isDefined(config.victory);
        Assert.equals(config.victory.population, 500);
    });

    it('devrait avoir unlockedBuildings initial', () => {
        Assert.isTrue(Array.isArray(config.unlockedBuildings));
        Assert.contains(config.unlockedBuildings, 'hut');
    });

    it('devrait être en mode tutoriel', () => {
        Assert.isTrue(config.tutorialMode);
    });
});

describe('Tutorial Scenario - Steps', () => {
    const steps = SCENARIOS.tutorial.steps;

    it('devrait avoir au moins 10 étapes', () => {
        Assert.isTrue(steps.length >= 10);
    });

    it('devrait commencer par une étape INTRO', () => {
        Assert.equals(steps[0].type, STEP_TYPES.INTRO);
    });

    it('devrait terminer par une étape FREE', () => {
        const lastStep = steps[steps.length - 1];
        Assert.equals(lastStep.type, STEP_TYPES.FREE);
    });

    it('chaque étape devrait avoir un ID unique', () => {
        const ids = steps.map(s => s.id);
        const uniqueIds = [...new Set(ids)];
        Assert.equals(ids.length, uniqueIds.length);
    });

    it('chaque étape devrait avoir un type valide', () => {
        const validTypes = Object.values(STEP_TYPES);
        steps.forEach(step => {
            Assert.contains(validTypes, step.type, `Type '${step.type}' invalide pour étape '${step.id}'`);
        });
    });

    it('chaque étape devrait avoir un message', () => {
        steps.forEach(step => {
            Assert.isDefined(step.message, `Message manquant pour étape '${step.id}'`);
            Assert.isType(step.message, 'string');
        });
    });

    it('les étapes INTRO/EXPLAIN devraient avoir un buttonText', () => {
        steps
            .filter(s => s.type === STEP_TYPES.INTRO || s.type === STEP_TYPES.EXPLAIN)
            .forEach(step => {
                Assert.isDefined(step.buttonText, `buttonText manquant pour étape '${step.id}'`);
            });
    });

    it('les étapes HIGHLIGHT devraient avoir un target', () => {
        steps
            .filter(s => s.type === STEP_TYPES.HIGHLIGHT)
            .forEach(step => {
                Assert.isDefined(step.target, `target manquant pour étape '${step.id}'`);
            });
    });

    it('les étapes avec condition devraient avoir un type de condition valide', () => {
        const validConditionTypes = [
            'building_count',
            'no_construction',
            'gathering_active',
            'multiplier_set',
            'message_sent',
            'population',
            'resource',
            'money'
        ];

        steps
            .filter(s => s.condition)
            .forEach(step => {
                Assert.contains(
                    validConditionTypes,
                    step.condition.type,
                    `Type de condition '${step.condition.type}' invalide pour étape '${step.id}'`
                );
            });
    });
});

describe('Tutorial Scenario - Progression de déblocage', () => {
    const steps = SCENARIOS.tutorial.steps;

    it('devrait débloquer progressivement les bâtiments', () => {
        let previousCount = 0;

        steps
            .filter(s => s.unlockBuildings)
            .forEach(step => {
                Assert.isTrue(
                    step.unlockBuildings.length >= previousCount,
                    `Étape '${step.id}' devrait débloquer au moins ${previousCount} bâtiments`
                );
                previousCount = step.unlockBuildings.length;
            });
    });

    it('devrait toujours inclure hut dans les déblocages', () => {
        steps
            .filter(s => s.unlockBuildings)
            .forEach(step => {
                Assert.contains(
                    step.unlockBuildings,
                    'hut',
                    `Étape '${step.id}' devrait inclure 'hut'`
                );
            });
    });
});

describe('Tutorial Scenario - Bonus', () => {
    const steps = SCENARIOS.tutorial.steps;
    const stepsWithBonus = steps.filter(s => s.bonus);

    it('devrait avoir des étapes avec bonus', () => {
        Assert.isTrue(stepsWithBonus.length > 0);
    });

    it('les bonus devraient être des objets valides', () => {
        stepsWithBonus.forEach(step => {
            Assert.isType(step.bonus, 'object');

            // Vérifier que les valeurs sont des nombres positifs
            Object.entries(step.bonus).forEach(([key, value]) => {
                Assert.isType(value, 'number', `Bonus '${key}' devrait être un nombre`);
                Assert.isGreaterThan(value, 0, `Bonus '${key}' devrait être positif`);
            });
        });
    });

    it('devrait donner un bonus de bois après avoir expliqué le multiplicateur', () => {
        const multiplierStep = steps.find(s => s.id === 'use_multiplier');
        Assert.isDefined(multiplierStep.bonus);
        Assert.isDefined(multiplierStep.bonus.wood);
    });

    it('devrait donner un bonus d\'oiseaux après la volière', () => {
        const waitAviaryStep = steps.find(s => s.id === 'wait_aviary');
        Assert.isDefined(waitAviaryStep.bonus);
        Assert.isDefined(waitAviaryStep.bonus.birds);
    });
});

// ==========================================
// TESTS - SCÉNARIO FREEPLAY
// ==========================================

describe('Freeplay Scenario - Structure', () => {
    const freeplay = SCENARIOS.freeplay;

    it('devrait avoir un ID correct', () => {
        Assert.equals(freeplay.id, 'freeplay');
    });

    it('devrait avoir un nom', () => {
        Assert.isType(freeplay.name, 'string');
    });

    it('devrait avoir une description', () => {
        Assert.isType(freeplay.description, 'string');
    });

    it('devrait avoir un icône', () => {
        Assert.isDefined(freeplay.icon);
    });

    it('ne devrait pas être recommandé', () => {
        Assert.isFalse(freeplay.recommended);
    });
});

describe('Freeplay Scenario - Config', () => {
    const config = SCENARIOS.freeplay.config;

    it('devrait avoir une config vide (utilise defaults)', () => {
        Assert.deepEquals(config, {});
    });
});

describe('Freeplay Scenario - Steps', () => {
    const freeplay = SCENARIOS.freeplay;

    it('devrait avoir steps = null (mode libre)', () => {
        Assert.isNull(freeplay.steps);
    });
});

// ==========================================
// TESTS - STEP_TYPES
// ==========================================

describe('STEP_TYPES - Valeurs', () => {
    it('INTRO devrait être "intro"', () => {
        Assert.equals(STEP_TYPES.INTRO, 'intro');
    });

    it('HIGHLIGHT devrait être "highlight"', () => {
        Assert.equals(STEP_TYPES.HIGHLIGHT, 'highlight');
    });

    it('WAIT devrait être "wait"', () => {
        Assert.equals(STEP_TYPES.WAIT, 'wait');
    });

    it('EXPLAIN devrait être "explain"', () => {
        Assert.equals(STEP_TYPES.EXPLAIN, 'explain');
    });

    it('FREE devrait être "free"', () => {
        Assert.equals(STEP_TYPES.FREE, 'free');
    });
});
