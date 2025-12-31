// ==========================================
// SYSTÈME DE STATISTIQUES
// ==========================================

import { BUILDINGS } from '../data/index.js';

class StatisticsSystem {
    constructor(game) {
        this.game = game;

        // Historique des ressources (pour calculer les deltas)
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

        // Production/consommation par minute (calculée)
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

        // Seuils d'alerte (threshold)
        this.thresholds = {
            food: { warning: 20, critical: 5 },
            water: { warning: 15, critical: 3 },
            money: { warning: 100, critical: 20 }
        };

        // Intervalle de mise à jour (en secondes)
        this.updateInterval = 5;
        this.lastUpdate = 0;

        // Historique max (pour moyenne sur 60 secondes)
        this.maxHistoryLength = 12; // 12 x 5 = 60 secondes
    }

    /**
     * Met à jour les statistiques
     */
    update(deltaTime) {
        this.lastUpdate += deltaTime;

        if (this.lastUpdate >= this.updateInterval) {
            this.recordSnapshot();
            this.calculateRates();
            this.lastUpdate = 0;
        }
    }

    /**
     * Enregistre un snapshot des ressources actuelles
     */
    recordSnapshot() {
        const state = this.game.state;

        this.pushToHistory('money', state.money);
        this.pushToHistory('food', state.food);
        this.pushToHistory('water', state.water);
        this.pushToHistory('population', state.population);
        this.pushToHistory('wood', state.resources.wood);
        this.pushToHistory('stone', state.resources.stone);
        this.pushToHistory('sand', state.resources.sand);
        this.pushToHistory('dirt', state.resources.dirt);
        this.pushToHistory('clay', state.resources.clay);
    }

    /**
     * Ajoute une valeur à l'historique
     */
    pushToHistory(key, value) {
        this.history[key].push({
            value,
            time: Date.now()
        });

        // Limiter la taille de l'historique
        while (this.history[key].length > this.maxHistoryLength) {
            this.history[key].shift();
        }
    }

    /**
     * Calcule les taux de variation par minute
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
                    // Convertir en variation par minute
                    this.rates[key] = (valueDiff / timeDiffSeconds) * 60;
                }
            }
        }
    }

    /**
     * Obtient le taux de variation d'une ressource
     */
    getRate(resourceKey) {
        return this.rates[resourceKey] || 0;
    }

    /**
     * Obtient le temps restant avant épuisement (en secondes)
     */
    getTimeToDepletion(resourceKey) {
        const rate = this.rates[resourceKey];
        if (rate >= 0) return Infinity; // Pas de diminution

        let currentValue;
        if (['wood', 'stone', 'sand', 'dirt', 'clay'].includes(resourceKey)) {
            currentValue = this.game.state.resources[resourceKey];
        } else {
            currentValue = this.game.state[resourceKey];
        }

        // Temps en minutes puis convertir en secondes
        const timeInMinutes = currentValue / Math.abs(rate);
        return timeInMinutes * 60;
    }

    /**
     * Vérifie le niveau d'alerte d'une ressource
     */
    getAlertLevel(resourceKey) {
        const threshold = this.thresholds[resourceKey];
        if (!threshold) return 'normal';

        let currentValue;
        if (['wood', 'stone', 'sand', 'dirt', 'clay'].includes(resourceKey)) {
            currentValue = this.game.state.resources[resourceKey];
        } else {
            currentValue = this.game.state[resourceKey];
        }

        if (currentValue <= threshold.critical) return 'critical';
        if (currentValue <= threshold.warning) return 'warning';
        return 'normal';
    }

    /**
     * Obtient les infos de tooltip pour une ressource
     */
    getTooltipInfo(resourceKey) {
        const rate = this.getRate(resourceKey);
        const alertLevel = this.getAlertLevel(resourceKey);
        const timeToDepletion = this.getTimeToDepletion(resourceKey);

        let rateText;
        if (Math.abs(rate) < 0.1) {
            rateText = 'Stable';
        } else if (rate > 0) {
            rateText = `+${rate.toFixed(1)}/min`;
        } else {
            rateText = `${rate.toFixed(1)}/min`;
        }

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
     * Obtient toutes les statistiques pour l'affichage
     */
    getAllStats() {
        const stats = {};
        const keys = ['money', 'food', 'water', 'population', 'wood', 'stone', 'sand', 'dirt', 'clay'];

        for (const key of keys) {
            let currentValue;
            if (['wood', 'stone', 'sand', 'dirt', 'clay'].includes(key)) {
                currentValue = this.game.state.resources[key];
            } else {
                currentValue = this.game.state[key];
            }

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
     * Calcule la production théorique basée sur les bâtiments
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

        for (const [buildingId, count] of Object.entries(this.game.state.buildings)) {
            const building = BUILDINGS[buildingId];
            if (!building || !building.effects) continue;

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
