/**
 * Classe principale du jeu O'Cha'To
 * Gère la logique du jeu, les clients, les recettes et l'état général
 */

import { getRandomRecipe, calculateRecipeTime } from '../data/recipes.js';

class Game {
    /**
     * Crée une nouvelle instance du jeu
     */
    constructor() {
        /** @type {number} Nombre de vies restantes */
        this.lives = 3;

        /** @type {number} Nombre de clients servis avec succès */
        this.clientsServed = 0;

        /** @type {number} Score total du joueur */
        this.score = 0;

        /** @type {Object|null} Commande actuelle */
        this.currentOrder = null;

        /** @type {number|null} Timer de la commande actuelle */
        this.orderTimer = null;

        /** @type {number} Temps restant pour la commande en secondes */
        this.timeRemaining = 0;

        /** @type {number} Étape actuelle de la recette */
        this.currentStep = 0;

        /** @type {Array<string>} Ingrédients collectés */
        this.collectedIngredients = [];

        /** @type {boolean} Le jeu est-il en pause */
        this.paused = false;

        /** @type {boolean} Le jeu est-il terminé */
        this.gameOver = false;

        /** @type {string} Genre du personnage choisi */
        this.characterGender = 'male';

        /** @type {number} Timestamp du dernier update */
        this.lastUpdate = Date.now();
    }

    /**
     * Démarre une nouvelle partie
     * @param {string} gender - Genre du personnage ('male' ou 'female')
     */
    start(gender = 'male') {
        this.lives = 3;
        this.clientsServed = 0;
        this.score = 0;
        this.currentOrder = null;
        this.orderTimer = null;
        this.timeRemaining = 0;
        this.currentStep = 0;
        this.collectedIngredients = [];
        this.paused = false;
        this.gameOver = false;
        this.characterGender = gender;
        this.lastUpdate = Date.now();

        this.generateNewOrder();
    }

    /**
     * Génère une nouvelle commande client
     */
    generateNewOrder() {
        const progress = this.clientsServed / 100;
        const maxDifficulty = Math.min(5, Math.floor(progress * 5) + 1);

        this.currentOrder = getRandomRecipe(maxDifficulty);
        this.timeRemaining = calculateRecipeTime(this.currentOrder, progress);
        this.currentStep = 0;
        this.collectedIngredients = [];

        console.log(`Nouvelle commande: ${this.currentOrder.name} - ${this.timeRemaining}s`);
    }

    /**
     * Collecte un ingrédient
     * @param {string} ingredientId - ID de l'ingrédient
     * @returns {boolean} True si l'ingrédient est valide pour la recette actuelle
     */
    collectIngredient(ingredientId) {
        if (!this.currentOrder) {
            return false;
        }

        const needed = this.currentOrder.ingredients.includes(ingredientId);
        if (needed && !this.collectedIngredients.includes(ingredientId)) {
            this.collectedIngredients.push(ingredientId);
            return true;
        }

        return false;
    }

    /**
     * Vérifie si tous les ingrédients ont été collectés
     * @returns {boolean}
     */
    hasAllIngredients() {
        if (!this.currentOrder) {
            return false;
        }

        return this.currentOrder.ingredients.every(ing =>
            this.collectedIngredients.includes(ing)
        );
    }

    /**
     * Utilise un ustensile pour progresser dans la recette
     * @param {string} utensilId - ID de l'ustensile
     * @returns {boolean} True si l'ustensile correspond à l'étape actuelle
     */
    useUtensil(utensilId) {
        if (!this.currentOrder || !this.hasAllIngredients()) {
            return false;
        }

        const step = this.currentOrder.steps[this.currentStep];
        if (step && step.utensil === utensilId) {
            this.currentStep++;
            return true;
        }

        return false;
    }

    /**
     * Vérifie si la recette est terminée
     * @returns {boolean}
     */
    isRecipeComplete() {
        if (!this.currentOrder) {
            return false;
        }

        return this.currentStep >= this.currentOrder.steps.length;
    }

    /**
     * Complète la commande avec succès
     */
    completeOrder() {
        if (!this.currentOrder) {
            return;
        }

        this.clientsServed++;

        const timeBonus = Math.floor(this.timeRemaining * 10);
        const difficultyBonus = this.currentOrder.difficulty * 100;
        const orderScore = 500 + timeBonus + difficultyBonus;

        this.score += orderScore;

        console.log(`Commande terminée ! +${orderScore} points`);

        if (this.clientsServed >= 100) {
            this.win();
        } else {
            this.generateNewOrder();
        }
    }

    /**
     * Échoue la commande actuelle
     */
    failOrder() {
        this.lives--;

        console.log(`Commande échouée ! Vies restantes: ${this.lives}`);

        if (this.lives <= 0) {
            this.lose();
        } else {
            this.generateNewOrder();
        }
    }

    /**
     * Met à jour le jeu (appelé à chaque frame)
     * @param {number} deltaTime - Temps écoulé depuis le dernier update en ms
     */
    update(deltaTime) {
        if (this.paused || this.gameOver) {
            return;
        }

        const deltaSeconds = deltaTime / 1000;
        this.timeRemaining -= deltaSeconds;

        if (this.timeRemaining <= 0) {
            this.failOrder();
        }
    }

    /**
     * Met le jeu en pause
     */
    pause() {
        this.paused = true;
    }

    /**
     * Reprend le jeu
     */
    resume() {
        this.paused = false;
        this.lastUpdate = Date.now();
    }

    /**
     * Gère la victoire
     */
    win() {
        this.gameOver = true;
        console.log('VICTOIRE !');
    }

    /**
     * Gère la défaite
     */
    lose() {
        this.gameOver = true;
        console.log('GAME OVER');
    }

    /**
     * Obtient les statistiques actuelles du jeu
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            lives: this.lives,
            clientsServed: this.clientsServed,
            score: this.score,
            timeRemaining: Math.max(0, Math.floor(this.timeRemaining)),
            currentOrder: this.currentOrder,
            currentStep: this.currentStep,
            collectedIngredients: this.collectedIngredients
        };
    }
}

export default Game;
