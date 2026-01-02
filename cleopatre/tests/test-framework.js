// ==========================================
// FRAMEWORK DE TESTS UNITAIRES MINIMALISTE
// ==========================================
// Framework simple pour exécuter des tests dans le navigateur.
// Pas de dépendances externes.
// ==========================================

/**
 * Classe de gestion des tests
 */
class TestRunner {
    constructor() {
        /** @type {object[]} Liste des suites de tests */
        this.suites = [];

        /** @type {object} Suite de tests courante */
        this.currentSuite = null;

        /** @type {number} Compteur de tests réussis */
        this.passed = 0;

        /** @type {number} Compteur de tests échoués */
        this.failed = 0;

        /** @type {number} Compteur de tests ignorés */
        this.skipped = 0;

        /** @type {string[]} Logs des résultats */
        this.logs = [];

        /** @type {HTMLElement|null} Container d'affichage */
        this.outputContainer = null;
    }

    /**
     * Définit une suite de tests
     * @param {string} name - Nom de la suite
     * @param {Function} fn - Fonction contenant les tests
     */
    describe(name, fn) {
        this.currentSuite = {
            name,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };
        this.suites.push(this.currentSuite);

        // Exécuter la fonction pour enregistrer les tests
        fn();
    }

    /**
     * Définit un test
     * @param {string} name - Nom du test
     * @param {Function} fn - Fonction de test (peut être async)
     */
    it(name, fn) {
        if (!this.currentSuite) {
            throw new Error('it() doit être appelé dans un describe()');
        }
        this.currentSuite.tests.push({ name, fn, skip: false });
    }

    /**
     * Définit un test à ignorer
     * @param {string} name - Nom du test
     * @param {Function} fn - Fonction de test
     */
    xit(name, fn) {
        if (!this.currentSuite) {
            throw new Error('xit() doit être appelé dans un describe()');
        }
        this.currentSuite.tests.push({ name, fn, skip: true });
    }

    /**
     * Fonction à exécuter avant chaque test
     * @param {Function} fn - Fonction de setup
     */
    beforeEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = fn;
        }
    }

    /**
     * Fonction à exécuter après chaque test
     * @param {Function} fn - Fonction de teardown
     */
    afterEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = fn;
        }
    }

    /**
     * Fonction à exécuter avant tous les tests de la suite
     * @param {Function} fn - Fonction de setup
     */
    beforeAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll = fn;
        }
    }

    /**
     * Fonction à exécuter après tous les tests de la suite
     * @param {Function} fn - Fonction de teardown
     */
    afterAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterAll = fn;
        }
    }

    /**
     * Exécute tous les tests
     * @returns {Promise<object>} Résultats des tests
     */
    async run() {
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this.logs = [];

        this.log('='.repeat(50));
        this.log('EXÉCUTION DES TESTS');
        this.log('='.repeat(50));

        for (const suite of this.suites) {
            await this.runSuite(suite);
        }

        this.log('');
        this.log('='.repeat(50));
        this.log('RÉSULTATS');
        this.log('='.repeat(50));
        this.log(`✅ Réussis: ${this.passed}`);
        this.log(`❌ Échoués: ${this.failed}`);
        this.log(`⏭️ Ignorés: ${this.skipped}`);
        this.log(`📊 Total: ${this.passed + this.failed + this.skipped}`);

        this.updateOutput();

        return {
            passed: this.passed,
            failed: this.failed,
            skipped: this.skipped,
            success: this.failed === 0
        };
    }

    /**
     * Exécute une suite de tests
     * @param {object} suite - Suite à exécuter
     */
    async runSuite(suite) {
        this.log('');
        this.log(`📁 ${suite.name}`);

        // beforeAll
        if (suite.beforeAll) {
            try {
                await suite.beforeAll();
            } catch (error) {
                this.log(`   ❌ beforeAll a échoué: ${error.message}`);
                return;
            }
        }

        for (const test of suite.tests) {
            await this.runTest(suite, test);
        }

        // afterAll
        if (suite.afterAll) {
            try {
                await suite.afterAll();
            } catch (error) {
                this.log(`   ❌ afterAll a échoué: ${error.message}`);
            }
        }
    }

    /**
     * Exécute un test individuel
     * @param {object} suite - Suite parente
     * @param {object} test - Test à exécuter
     */
    async runTest(suite, test) {
        if (test.skip) {
            this.skipped++;
            this.log(`   ⏭️ ${test.name} (ignoré)`);
            return;
        }

        try {
            // beforeEach
            if (suite.beforeEach) {
                await suite.beforeEach();
            }

            // Exécuter le test
            await test.fn();

            // afterEach
            if (suite.afterEach) {
                await suite.afterEach();
            }

            this.passed++;
            this.log(`   ✅ ${test.name}`);
        } catch (error) {
            this.failed++;
            this.log(`   ❌ ${test.name}`);
            this.log(`      → ${error.message}`);
            if (error.stack) {
                const stackLines = error.stack.split('\n').slice(1, 3);
                stackLines.forEach(line => {
                    this.log(`      ${line.trim()}`);
                });
            }
        }
    }

    /**
     * Ajoute un message au log
     * @param {string} message - Message à logger
     */
    log(message) {
        this.logs.push(message);
        console.log(message);
    }

    /**
     * Met à jour l'affichage HTML
     */
    updateOutput() {
        if (!this.outputContainer) {
            this.outputContainer = document.getElementById('testOutput');
        }

        if (this.outputContainer) {
            this.outputContainer.innerHTML = this.logs
                .map(line => {
                    let className = '';
                    if (line.includes('✅')) className = 'test-pass';
                    else if (line.includes('❌')) className = 'test-fail';
                    else if (line.includes('⏭️')) className = 'test-skip';
                    else if (line.includes('📁')) className = 'test-suite';
                    return `<div class="${className}">${this.escapeHtml(line)}</div>`;
                })
                .join('');
        }
    }

    /**
     * Échappe les caractères HTML
     * @param {string} text - Texte à échapper
     * @returns {string} Texte échappé
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==========================================
// ASSERTIONS
// ==========================================

/**
 * Classe d'assertions pour les tests
 */
class Assert {
    /**
     * Vérifie qu'une valeur est vraie
     * @param {*} value - Valeur à vérifier
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isTrue(value, message) {
        if (value !== true) {
            throw new Error(message || `Attendu: true, Reçu: ${value}`);
        }
    }

    /**
     * Vérifie qu'une valeur est fausse
     * @param {*} value - Valeur à vérifier
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isFalse(value, message) {
        if (value !== false) {
            throw new Error(message || `Attendu: false, Reçu: ${value}`);
        }
    }

    /**
     * Vérifie l'égalité stricte de deux valeurs
     * @param {*} actual - Valeur actuelle
     * @param {*} expected - Valeur attendue
     * @param {string} [message] - Message d'erreur optionnel
     */
    static equals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Attendu: ${JSON.stringify(expected)}, Reçu: ${JSON.stringify(actual)}`);
        }
    }

    /**
     * Vérifie la non-égalité de deux valeurs
     * @param {*} actual - Valeur actuelle
     * @param {*} notExpected - Valeur non attendue
     * @param {string} [message] - Message d'erreur optionnel
     */
    static notEquals(actual, notExpected, message) {
        if (actual === notExpected) {
            throw new Error(message || `Ne devrait pas être: ${JSON.stringify(notExpected)}`);
        }
    }

    /**
     * Vérifie l'égalité profonde de deux objets
     * @param {*} actual - Valeur actuelle
     * @param {*} expected - Valeur attendue
     * @param {string} [message] - Message d'erreur optionnel
     */
    static deepEquals(actual, expected, message) {
        if (!this.isDeepEqual(actual, expected)) {
            throw new Error(message || `Attendu: ${JSON.stringify(expected)}, Reçu: ${JSON.stringify(actual)}`);
        }
    }

    /**
     * Vérifie qu'une valeur est null
     * @param {*} value - Valeur à vérifier
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isNull(value, message) {
        if (value !== null) {
            throw new Error(message || `Attendu: null, Reçu: ${value}`);
        }
    }

    /**
     * Vérifie qu'une valeur n'est pas null
     * @param {*} value - Valeur à vérifier
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isNotNull(value, message) {
        if (value === null) {
            throw new Error(message || 'Valeur ne devrait pas être null');
        }
    }

    /**
     * Vérifie qu'une valeur est undefined
     * @param {*} value - Valeur à vérifier
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isUndefined(value, message) {
        if (value !== undefined) {
            throw new Error(message || `Attendu: undefined, Reçu: ${value}`);
        }
    }

    /**
     * Vérifie qu'une valeur est définie (non undefined)
     * @param {*} value - Valeur à vérifier
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isDefined(value, message) {
        if (value === undefined) {
            throw new Error(message || 'Valeur ne devrait pas être undefined');
        }
    }

    /**
     * Vérifie qu'une valeur est d'un type donné
     * @param {*} value - Valeur à vérifier
     * @param {string} type - Type attendu
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isType(value, type, message) {
        if (typeof value !== type) {
            throw new Error(message || `Attendu type: ${type}, Reçu: ${typeof value}`);
        }
    }

    /**
     * Vérifie qu'une valeur est une instance d'une classe
     * @param {*} value - Valeur à vérifier
     * @param {Function} constructor - Constructeur de la classe
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isInstanceOf(value, constructor, message) {
        if (!(value instanceof constructor)) {
            throw new Error(message || `Attendu instance de: ${constructor.name}`);
        }
    }

    /**
     * Vérifie qu'un tableau contient une valeur
     * @param {Array} array - Tableau à vérifier
     * @param {*} value - Valeur à chercher
     * @param {string} [message] - Message d'erreur optionnel
     */
    static contains(array, value, message) {
        if (!array.includes(value)) {
            throw new Error(message || `Le tableau ne contient pas: ${JSON.stringify(value)}`);
        }
    }

    /**
     * Vérifie qu'un tableau a une longueur donnée
     * @param {Array} array - Tableau à vérifier
     * @param {number} length - Longueur attendue
     * @param {string} [message] - Message d'erreur optionnel
     */
    static hasLength(array, length, message) {
        if (array.length !== length) {
            throw new Error(message || `Attendu longueur: ${length}, Reçu: ${array.length}`);
        }
    }

    /**
     * Vérifie qu'une fonction lève une erreur
     * @param {Function} fn - Fonction à exécuter
     * @param {string|RegExp} [expectedMessage] - Message d'erreur attendu (optionnel)
     * @param {string} [message] - Message d'erreur optionnel
     */
    static throws(fn, expectedMessage, message) {
        let threw = false;
        let error = null;

        try {
            fn();
        } catch (e) {
            threw = true;
            error = e;
        }

        if (!threw) {
            throw new Error(message || 'La fonction aurait dû lever une erreur');
        }

        if (expectedMessage) {
            if (expectedMessage instanceof RegExp) {
                if (!expectedMessage.test(error.message)) {
                    throw new Error(message || `Message d'erreur attendu: ${expectedMessage}, Reçu: ${error.message}`);
                }
            } else if (error.message !== expectedMessage) {
                throw new Error(message || `Message d'erreur attendu: ${expectedMessage}, Reçu: ${error.message}`);
            }
        }
    }

    /**
     * Vérifie qu'une fonction async lève une erreur
     * @param {Function} fn - Fonction async à exécuter
     * @param {string|RegExp} [expectedMessage] - Message d'erreur attendu (optionnel)
     * @param {string} [message] - Message d'erreur optionnel
     */
    static async throwsAsync(fn, expectedMessage, message) {
        let threw = false;
        let error = null;

        try {
            await fn();
        } catch (e) {
            threw = true;
            error = e;
        }

        if (!threw) {
            throw new Error(message || 'La fonction aurait dû lever une erreur');
        }

        if (expectedMessage) {
            if (expectedMessage instanceof RegExp) {
                if (!expectedMessage.test(error.message)) {
                    throw new Error(message || `Message d'erreur attendu: ${expectedMessage}, Reçu: ${error.message}`);
                }
            } else if (error.message !== expectedMessage) {
                throw new Error(message || `Message d'erreur attendu: ${expectedMessage}, Reçu: ${error.message}`);
            }
        }
    }

    /**
     * Vérifie qu'une valeur est supérieure à une autre
     * @param {number} actual - Valeur actuelle
     * @param {number} expected - Valeur de comparaison
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isGreaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `${actual} devrait être > ${expected}`);
        }
    }

    /**
     * Vérifie qu'une valeur est inférieure à une autre
     * @param {number} actual - Valeur actuelle
     * @param {number} expected - Valeur de comparaison
     * @param {string} [message] - Message d'erreur optionnel
     */
    static isLessThan(actual, expected, message) {
        if (actual >= expected) {
            throw new Error(message || `${actual} devrait être < ${expected}`);
        }
    }

    /**
     * Compare deux objets de manière profonde
     * @param {*} a - Premier objet
     * @param {*} b - Deuxième objet
     * @returns {boolean} True si égaux
     */
    static isDeepEqual(a, b) {
        if (a === b) return true;

        if (typeof a !== typeof b) return false;
        if (a === null || b === null) return false;
        if (typeof a !== 'object') return false;

        if (Array.isArray(a) !== Array.isArray(b)) return false;

        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            return a.every((item, i) => this.isDeepEqual(item, b[i]));
        }

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        return keysA.every(key => this.isDeepEqual(a[key], b[key]));
    }
}

// ==========================================
// EXPORTS
// ==========================================

// Instance globale du runner
const testRunner = new TestRunner();

// Fonctions globales pour faciliter l'écriture des tests
const describe = (name, fn) => testRunner.describe(name, fn);
const it = (name, fn) => testRunner.it(name, fn);
const xit = (name, fn) => testRunner.xit(name, fn);
const beforeEach = (fn) => testRunner.beforeEach(fn);
const afterEach = (fn) => testRunner.afterEach(fn);
const beforeAll = (fn) => testRunner.beforeAll(fn);
const afterAll = (fn) => testRunner.afterAll(fn);

export {
    TestRunner,
    Assert,
    testRunner,
    describe,
    it,
    xit,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll
};
