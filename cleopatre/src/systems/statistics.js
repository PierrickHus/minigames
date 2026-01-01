// ==========================================
// SYSTÈME DE STATISTIQUES
// ==========================================
// Ce module calcule et affiche les statistiques de production du jeu:
// - Taux de production/consommation par minute pour chaque ressource
// - Temps estimé avant épuisement des ressources critiques
// - Niveaux d'alerte (normal, warning, critical)
// - Production théorique basée sur les bâtiments construits
// ==========================================

import { BUILDINGS } from '../data/index.js';

/**
 * Système de calcul et suivi des statistiques de production
 * Analyse les variations de ressources dans le temps pour fournir
 * des métriques utiles au joueur (taux, alertes, prévisions)
 */
class StatisticsSystem {
    /**
     * Crée une nouvelle instance du système de statistiques
     * @param {Game} game - Instance du jeu principal
     */
    constructor(game) {
        /** @type {Game} Référence au jeu principal */
        this.game = game;

        /**
         * Historique des valeurs de ressources pour calculer les deltas
         * Chaque entrée contient { value: number, time: timestamp }
         * @type {Object<string, Array<{value: number, time: number}>>}
         */
        this.history = {
            money: [],
            food: [],
            water: [],
            population: [],
            wood: [],
            stone: [],
            sand: [],
            dirt: [],
            clay: []
        };

        /**
         * Taux de variation calculés (unité: par minute)
         * Valeur positive = production, négative = consommation
         * @type {Object<string, number>}
         */
        this.rates = {
            money: 0,
            food: 0,
            water: 0,
            population: 0,
            wood: 0,
            stone: 0,
            sand: 0,
            dirt: 0,
            clay: 0
        };

        /**
         * Seuils d'alerte pour les ressources critiques
         * warning: seuil d'attention, critical: seuil critique
         * @type {Object<string, {warning: number, critical: number}>}
         */
        this.thresholds = {
            food: { warning: 20, critical: 5 },
            water: { warning: 15, critical: 3 },
            money: { warning: 100, critical: 20 }
        };

        /** @type {number} Intervalle entre les mises à jour (en secondes) */
        this.updateInterval = 5;

        /** @type {number} Temps écoulé depuis la dernière mise à jour */
        this.lastUpdate = 0;

        /** @type {number} Nombre maximum d'entrées dans l'historique (12 x 5s = 60s de données) */
        this.maxHistoryLength = 12;
    }

    /**
     * Met à jour les statistiques à chaque frame du jeu
     * Les calculs sont effectués à intervalles réguliers pour optimiser les performances
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame (en secondes)
     */
    update(deltaTime) {
        this.lastUpdate += deltaTime;

        // Mettre à jour uniquement à l'intervalle défini
        if (this.lastUpdate >= this.updateInterval) {
            this.recordSnapshot();
            this.calculateRates();
            this.lastUpdate = 0;
        }
    }

    /**
     * Enregistre un snapshot des valeurs actuelles de toutes les ressources
     * Ces données sont utilisées pour calculer les taux de variation
     */
    recordSnapshot() {
        const state = this.game.state;

        // Ressources principales
        this.pushToHistory('money', state.money);
        this.pushToHistory('food', state.food);
        this.pushToHistory('water', state.water);
        this.pushToHistory('population', state.population);

        // Ressources de construction
        this.pushToHistory('wood', state.resources.wood);
        this.pushToHistory('stone', state.resources.stone);
        this.pushToHistory('sand', state.resources.sand);
        this.pushToHistory('dirt', state.resources.dirt);
        this.pushToHistory('clay', state.resources.clay);
    }

    /**
     * Ajoute une valeur à l'historique d'une ressource
     * Limite automatiquement la taille de l'historique
     * @param {string} key - Clé de la ressource
     * @param {number} value - Valeur actuelle de la ressource
     */
    pushToHistory(key, value) {
        this.history[key].push({
            value,
            time: Date.now()
        });

        // Supprimer les entrées les plus anciennes si dépassement
        while (this.history[key].length > this.maxHistoryLength) {
            this.history[key].shift();
        }
    }

    /**
     * Calcule les taux de variation par minute pour toutes les ressources
     * Utilise la différence entre la plus ancienne et la plus récente valeur de l'historique
     */
    calculateRates() {
        for (const key of Object.keys(this.rates)) {
            const history = this.history[key];

            if (history.length >= 2) {
                const oldest = history[0];
                const newest = history[history.length - 1];
                const timeDiffSeconds = (newest.time - oldest.time) / 1000;

                if (timeDiffSeconds > 0) {
                    const valueDiff = newest.value - oldest.value;
                    // Convertir la variation en unité par minute
                    this.rates[key] = (valueDiff / timeDiffSeconds) * 60;
                }
            }
        }
    }

    /**
     * Retourne le taux de variation actuel d'une ressource
     * @param {string} resourceKey - Clé de la ressource
     * @returns {number} Taux de variation par minute (positif = gain, négatif = perte)
     */
    getRate(resourceKey) {
        return this.rates[resourceKey] || 0;
    }

    /**
     * Calcule le temps restant avant épuisement d'une ressource
     * Basé sur le taux de consommation actuel
     * @param {string} resourceKey - Clé de la ressource
     * @returns {number} Temps en secondes avant épuisement (Infinity si pas de diminution)
     */
    getTimeToDepletion(resourceKey) {
        const rate = this.rates[resourceKey];

        // Pas de diminution = pas d'épuisement prévu
        if (rate >= 0) return Infinity;

        // Récupérer la valeur actuelle selon le type de ressource
        let currentValue;
        if (['wood', 'stone', 'sand', 'dirt', 'clay'].includes(resourceKey)) {
            currentValue = this.game.state.resources[resourceKey];
        } else {
            currentValue = this.game.state[resourceKey];
        }

        // Calculer le temps: valeur / (consommation par minute) → minutes, puis × 60 → secondes
        const timeInMinutes = currentValue / Math.abs(rate);
        return timeInMinutes * 60;
    }

    /**
     * Détermine le niveau d'alerte pour une ressource
     * Basé sur les seuils configurés (warning, critical)
     * @param {string} resourceKey - Clé de la ressource
     * @returns {string} Niveau d'alerte: 'normal', 'warning' ou 'critical'
     */
    getAlertLevel(resourceKey) {
        const threshold = this.thresholds[resourceKey];
        if (!threshold) return 'normal';

        // Récupérer la valeur actuelle
        let currentValue;
        if (['wood', 'stone', 'sand', 'dirt', 'clay'].includes(resourceKey)) {
            currentValue = this.game.state.resources[resourceKey];
        } else {
            currentValue = this.game.state[resourceKey];
        }

        // Comparer aux seuils
        if (currentValue <= threshold.critical) return 'critical';
        if (currentValue <= threshold.warning) return 'warning';
        return 'normal';
    }

    /**
     * Génère les informations de tooltip pour une ressource
     * Utilisé pour l'affichage détaillé dans l'interface
     * @param {string} resourceKey - Clé de la ressource
     * @returns {object} Objet contenant rate, rateText, alertLevel, timeToDepletion, depletionText
     */
    getTooltipInfo(resourceKey) {
        const rate = this.getRate(resourceKey);
        const alertLevel = this.getAlertLevel(resourceKey);
        const timeToDepletion = this.getTimeToDepletion(resourceKey);

        // Formater le texte du taux
        let rateText;
        if (Math.abs(rate) < 0.1) {
            rateText = 'Stable';
        } else if (rate > 0) {
            rateText = `+${rate.toFixed(1)}/min`;
        } else {
            rateText = `${rate.toFixed(1)}/min`;
        }

        // Formater le texte de temps avant épuisement
        let depletionText = '';
        if (timeToDepletion < Infinity && timeToDepletion > 0) {
            if (timeToDepletion < 60) {
                depletionText = `Épuisement dans ${Math.ceil(timeToDepletion)}s`;
            } else if (timeToDepletion < 3600) {
                depletionText = `Épuisement dans ${Math.ceil(timeToDepletion / 60)}min`;
            } else {
                depletionText = `Épuisement dans ${Math.floor(timeToDepletion / 3600)}h`;
            }
        }

        return {
            rate,
            rateText,
            alertLevel,
            timeToDepletion,
            depletionText
        };
    }

    /**
     * Retourne toutes les statistiques pour l'affichage dans l'onglet Stats
     * @returns {Object<string, object>} Statistiques complètes pour chaque ressource
     */
    getAllStats() {
        const stats = {};
        const keys = ['money', 'food', 'water', 'population', 'wood', 'stone', 'sand', 'dirt', 'clay'];

        for (const key of keys) {
            // Récupérer la valeur actuelle
            let currentValue;
            if (['wood', 'stone', 'sand', 'dirt', 'clay'].includes(key)) {
                currentValue = this.game.state.resources[key];
            } else {
                currentValue = this.game.state[key];
            }

            // Compiler toutes les informations
            stats[key] = {
                current: currentValue,
                rate: this.getRate(key),
                alertLevel: this.getAlertLevel(key),
                ...this.getTooltipInfo(key)
            };
        }

        return stats;
    }

    /**
     * Calcule la production théorique basée sur les bâtiments construits
     * Utile pour montrer ce que le joueur devrait produire avec ses bâtiments
     * @returns {object} Production théorique par ressource (par minute)
     */
    getTheoreticalProduction() {
        const production = {
            food: 0,
            water: 0,
            money: 0,
            wood: 0,
            stone: 0,
            population: 0
        };

        // Parcourir tous les bâtiments construits
        for (const [buildingId, count] of Object.entries(this.game.state.buildings)) {
            const building = BUILDINGS[buildingId];
            if (!building || !building.effects) continue;

            // Accumuler les effets de production
            const e = building.effects;
            if (e.foodPerMinute) production.food += e.foodPerMinute * count;
            if (e.waterPerMinute) production.water += e.waterPerMinute * count;
            if (e.moneyPerMinute) production.money += e.moneyPerMinute * count;
            if (e.woodPerMinute) production.wood += e.woodPerMinute * count;
            if (e.stonePerMinute) production.stone += e.stonePerMinute * count;
        }

        return production;
    }
}

export default StatisticsSystem;
