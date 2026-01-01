// ==========================================
// MÉGA MENU STATISTIQUES AVEC GRAPHIQUES
// ==========================================
// Ce module gère le menu détaillé des statistiques accessible via le bouton stats.
// Fonctionnalités principales:
// - Graphique d'évolution temporelle des ressources (Canvas 2D)
// - Graphique camembert de répartition des bâtiments par tier
// - Statistiques de production en temps réel
// - Alertes et prévisions d'épuisement
// - Sélection de périodes (1min, 5min, 10min, 30min, 1h)
// ==========================================

import { BUILDINGS, UI_COLORS, formatTime } from '../data/index.js';

/**
 * Menu de statistiques détaillé avec graphiques interactifs
 * Permet de visualiser l'évolution des ressources et la composition du village
 */
class StatsMenu {
    /**
     * Crée une nouvelle instance du menu de statistiques
     * @param {Game} game - Instance du jeu principal
     */
    constructor(game) {
        /** @type {Game} Référence au jeu principal */
        this.game = game;

        /** @type {boolean} État d'ouverture du menu */
        this.isOpen = false;

        /** @type {string} Ressource actuellement sélectionnée pour le graphique */
        this.selectedResource = 'money';

        /** @type {number} Période affichée en secondes (défaut: 5 minutes) */
        this.selectedPeriod = 300;

        /**
         * Historique des valeurs pour les graphiques
         * Chaque ressource a un tableau de { time: timestamp, value: number }
         * @type {Object<string, Array<{time: number, value: number}>>}
         */
        this.graphHistory = {
            money: [],
            food: [],
            water: [],
            population: [],
            wood: [],
            stone: []
        };

        /** @type {number} Nombre maximum de points dans l'historique (1h à 5s d'intervalle = 720) */
        this.maxHistoryPoints = 720;

        // Initialiser les événements et le tracking
        this.setupEventListeners();
        this.startHistoryTracking();
    }

    /**
     * Configure tous les écouteurs d'événements du menu
     * Boutons, tabs, overlay et raccourcis clavier
     */
    setupEventListeners() {
        // Bouton pour ouvrir le menu
        const openBtn = document.getElementById('openStatsMenu');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }

        // Bouton pour fermer le menu
        const closeBtn = document.getElementById('closeStatsMenu');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Clic sur l'overlay (fond sombre) pour fermer
        const overlay = document.getElementById('statsOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.close();
            });
        }

        // Onglets de sélection de ressource pour le graphique
        document.querySelectorAll('.graph-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.selectResource(tab.dataset.resource);
            });
        });

        // Boutons de sélection de période (zoom temporel)
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPeriod(parseInt(btn.dataset.zoom));
            });
        });

        // Touche Escape pour fermer le menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Démarre l'enregistrement périodique des données pour les graphiques
     * Enregistre un snapshot toutes les 5 secondes
     */
    startHistoryTracking() {
        setInterval(() => {
            if (this.game.isRunning) {
                this.recordHistory();
            }
        }, 5000);
    }

    /**
     * Enregistre l'état actuel de toutes les ressources dans l'historique
     * Limite automatiquement la taille de l'historique
     */
    recordHistory() {
        const state = this.game.state;
        const now = Date.now();

        // Ressources à tracker
        const resources = {
            money: state.money,
            food: state.food,
            water: state.water,
            population: state.population,
            wood: state.resources.wood,
            stone: state.resources.stone
        };

        // Ajouter chaque valeur à l'historique correspondant
        for (const [key, value] of Object.entries(resources)) {
            this.graphHistory[key].push({ time: now, value });

            // Limiter la taille de l'historique
            while (this.graphHistory[key].length > this.maxHistoryPoints) {
                this.graphHistory[key].shift();
            }
        }
    }

    /**
     * Ouvre le menu de statistiques et rafraîchit son contenu
     */
    open() {
        const overlay = document.getElementById('statsOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.isOpen = true;
            this.refresh();
        }
    }

    /**
     * Ferme le menu de statistiques
     */
    close() {
        const overlay = document.getElementById('statsOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            this.isOpen = false;
        }
    }

    /**
     * Sélectionne une ressource pour l'affichage dans le graphique
     * @param {string} resource - Clé de la ressource (money, food, water, etc.)
     */
    selectResource(resource) {
        this.selectedResource = resource;

        // Mettre à jour l'état visuel des onglets
        document.querySelectorAll('.graph-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.resource === resource);
        });

        // Redessiner le graphique avec la nouvelle ressource
        this.drawResourceGraph();
    }

    /**
     * Sélectionne une période pour l'affichage du graphique
     * @param {number} periodSeconds - Période en secondes (60, 300, 600, 1800, 3600)
     */
    selectPeriod(periodSeconds) {
        this.selectedPeriod = periodSeconds;

        // Mettre à jour l'état visuel des boutons
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.zoom) === periodSeconds);
        });

        // Redessiner le graphique avec la nouvelle période
        this.drawResourceGraph();
    }

    /**
     * Rafraîchit tout le contenu du menu
     * Appelé à l'ouverture et périodiquement si le menu est ouvert
     */
    refresh() {
        if (!this.isOpen) return;

        this.drawResourceGraph();
        this.drawBuildingsGraph();
        this.updateProductionStats();
        this.updateTheoreticalStats();
        this.updateAlertsStats();
        this.updateGeneralStats();
    }

    /**
     * Dessine le graphique d'évolution temporelle de la ressource sélectionnée
     * Utilise Canvas 2D pour le rendu avec courbe lissée et remplissage
     */
    drawResourceGraph() {
        const canvas = document.getElementById('resourceGraph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();

        // Ajuster la taille du canvas au conteneur
        canvas.width = rect.width - 20;
        canvas.height = 200;

        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 20, right: 20, bottom: 30, left: 60 };

        // Effacer le canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Filtrer l'historique selon la période sélectionnée
        const fullHistory = this.graphHistory[this.selectedResource];
        const now = Date.now();
        const periodMs = this.selectedPeriod * 1000;
        const cutoffTime = now - periodMs;

        const history = fullHistory.filter(point => point.time >= cutoffTime);

        // Afficher un message si pas assez de données
        if (history.length < 2) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            const periodLabel = this.getPeriodLabel(this.selectedPeriod);
            ctx.fillText(`En attente de données (${periodLabel})...`, width / 2, height / 2);
            this.updateGraphLegend(null, this.selectedPeriod);
            return;
        }

        // Calculer les valeurs min/max pour l'échelle
        const values = history.map(h => h.value);
        let minVal = Math.min(...values);
        let maxVal = Math.max(...values);

        // Ajouter une marge de 10% pour l'espace visuel
        const range = maxVal - minVal || 1;
        minVal = Math.max(0, minVal - range * 0.1);
        maxVal = maxVal + range * 0.1;

        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        // Palette de couleurs par ressource
        const colors = {
            money: { line: '#ffd700', fill: 'rgba(255, 215, 0, 0.2)' },
            food: { line: '#4ade80', fill: 'rgba(74, 222, 128, 0.2)' },
            water: { line: '#60a5fa', fill: 'rgba(96, 165, 250, 0.2)' },
            population: { line: '#c084fc', fill: 'rgba(192, 132, 252, 0.2)' },
            wood: { line: '#a78b5a', fill: 'rgba(167, 139, 90, 0.2)' },
            stone: { line: '#888', fill: 'rgba(136, 136, 136, 0.2)' }
        };
        const color = colors[this.selectedResource] || colors.money;

        // Dessiner la grille de fond
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        // Lignes horizontales avec labels de valeur
        const ySteps = 5;
        ctx.font = '11px Arial';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'right';

        for (let i = 0; i <= ySteps; i++) {
            const y = padding.top + (graphHeight / ySteps) * i;
            const value = maxVal - ((maxVal - minVal) / ySteps) * i;

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillText(this.formatNumber(value), padding.left - 5, y + 4);
        }

        // Dessiner la zone de remplissage sous la courbe
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + graphHeight);

        history.forEach((point, i) => {
            const timeRatio = (point.time - cutoffTime) / periodMs;
            const x = padding.left + timeRatio * graphWidth;
            const y = padding.top + graphHeight - ((point.value - minVal) / (maxVal - minVal)) * graphHeight;

            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.lineTo(padding.left + graphWidth, padding.top + graphHeight);
        ctx.closePath();

        ctx.fillStyle = color.fill;
        ctx.fill();

        // Dessiner la ligne de la courbe
        ctx.beginPath();
        history.forEach((point, i) => {
            const timeRatio = (point.time - cutoffTime) / periodMs;
            const x = padding.left + timeRatio * graphWidth;
            const y = padding.top + graphHeight - ((point.value - minVal) / (maxVal - minVal)) * graphHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.strokeStyle = color.line;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dessiner le point actuel (dernier point)
        const lastPoint = history[history.length - 1];
        const lastTimeRatio = (lastPoint.time - cutoffTime) / periodMs;
        const lastX = padding.left + lastTimeRatio * graphWidth;
        const lastY = padding.top + graphHeight - ((lastPoint.value - minVal) / (maxVal - minVal)) * graphHeight;

        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fillStyle = color.line;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels de temps en bas du graphique
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';

        const timeLabels = this.getTimeLabels(this.selectedPeriod);
        timeLabels.forEach((label, i) => {
            const x = padding.left + (i / (timeLabels.length - 1)) * graphWidth;
            ctx.fillText(label, x, height - 5);
        });

        // Mettre à jour la légende sous le graphique
        this.updateGraphLegend(history, this.selectedPeriod);
    }

    /**
     * Retourne les labels de temps pour l'axe X selon la période
     * @param {number} periodSeconds - Période en secondes
     * @returns {string[]} Tableau de labels
     */
    getTimeLabels(periodSeconds) {
        switch (periodSeconds) {
            case 60:
                return ['-1min', '-45s', '-30s', '-15s', 'Maintenant'];
            case 300:
                return ['-5min', '-4min', '-3min', '-2min', '-1min', 'Maintenant'];
            case 600:
                return ['-10min', '-8min', '-6min', '-4min', '-2min', 'Maintenant'];
            case 1800:
                return ['-30min', '-24min', '-18min', '-12min', '-6min', 'Maintenant'];
            case 3600:
                return ['-1h', '-48min', '-36min', '-24min', '-12min', 'Maintenant'];
            default:
                return ['-5min', '-4min', '-3min', '-2min', '-1min', 'Maintenant'];
        }
    }

    /**
     * Retourne le label lisible d'une période
     * @param {number} periodSeconds - Période en secondes
     * @returns {string} Label formaté
     */
    getPeriodLabel(periodSeconds) {
        switch (periodSeconds) {
            case 60: return '1 minute';
            case 300: return '5 minutes';
            case 600: return '10 minutes';
            case 1800: return '30 minutes';
            case 3600: return '1 heure';
            default: return `${periodSeconds}s`;
        }
    }

    /**
     * Met à jour la légende affichée sous le graphique
     * Montre la valeur actuelle et la variation sur la période
     * @param {Array|null} history - Historique des données
     * @param {number} periodSeconds - Période sélectionnée
     */
    updateGraphLegend(history, periodSeconds) {
        const legend = document.getElementById('graphLegend');
        if (!legend) return;

        if (!history || history.length < 2) {
            legend.innerHTML = '';
            return;
        }

        const current = history[history.length - 1].value;
        const oldest = history[0].value;
        const change = current - oldest;
        const changePercent = oldest > 0 ? ((change / oldest) * 100).toFixed(1) : 0;

        const names = {
            money: 'Or',
            food: 'Nourriture',
            water: 'Eau',
            population: 'Population',
            wood: 'Bois',
            stone: 'Pierre'
        };

        const changeColor = change > 0 ? UI_COLORS.success : change < 0 ? UI_COLORS.error : UI_COLORS.neutral;
        const changeSign = change > 0 ? '+' : '';
        const periodLabel = this.getPeriodLabel(periodSeconds);

        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-label">Actuel:</span>
                <span class="legend-value">${this.formatNumber(current)}</span>
            </div>
            <div class="legend-item">
                <span class="legend-label">Variation (${periodLabel}):</span>
                <span class="legend-value" style="color: ${changeColor}">
                    ${changeSign}${this.formatNumber(change)} (${changeSign}${changePercent}%)
                </span>
            </div>
        `;
    }

    /**
     * Dessine le graphique camembert de répartition des bâtiments par tier
     * Affiche également une légende avec les pourcentages
     */
    drawBuildingsGraph() {
        const canvas = document.getElementById('buildingsGraph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();

        canvas.width = Math.min(rect.width - 20, 250);
        canvas.height = 180;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        // Effacer le canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Compter les bâtiments par tier
        const buildingCounts = { 1: 0, 2: 0, 3: 0 };
        const buildingDetails = [];

        for (const [buildingId, count] of Object.entries(this.game.state.buildings)) {
            if (count > 0) {
                const building = BUILDINGS[buildingId];
                if (building) {
                    const tier = building.tier || 1;
                    buildingCounts[tier] += count;
                    buildingDetails.push({
                        name: building.name,
                        icon: building.icon,
                        count,
                        tier
                    });
                }
            }
        }

        const total = buildingCounts[1] + buildingCounts[2] + buildingCounts[3];

        // Afficher un message si aucun bâtiment
        if (total === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Aucun bâtiment', centerX, centerY);
            return;
        }

        // Couleurs par tier
        const tierColors = {
            1: '#4ade80', // Vert - Basique
            2: '#60a5fa', // Bleu - Avancé
            3: '#ffd700'  // Or - Monument
        };

        // Dessiner les tranches du camembert
        let startAngle = -Math.PI / 2;

        [1, 2, 3].forEach(tier => {
            if (buildingCounts[tier] === 0) return;

            const sliceAngle = (buildingCounts[tier] / total) * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();

            ctx.fillStyle = tierColors[tier];
            ctx.fill();

            // Bordure entre les tranches
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label au centre de la tranche (si assez grande)
            if (sliceAngle > 0.3) {
                const labelAngle = startAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * radius * 0.6;
                const labelY = centerY + Math.sin(labelAngle) * radius * 0.6;

                ctx.fillStyle = '#000';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(buildingCounts[tier].toString(), labelX, labelY);
            }

            startAngle += sliceAngle;
        });

        // Mettre à jour la légende HTML
        const legendContainer = document.getElementById('buildingsLegend');
        if (legendContainer) {
            const tierNames = { 1: 'Tier 1 - Basique', 2: 'Tier 2 - Avancé', 3: 'Tier 3 - Monument' };

            let legendHtml = '';
            [1, 2, 3].forEach(tier => {
                const count = buildingCounts[tier];
                const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                legendHtml += `
                    <div class="building-legend-item">
                        <span class="legend-color" style="background: ${tierColors[tier]}"></span>
                        <span class="legend-text">${tierNames[tier]}</span>
                        <span class="legend-count">${count} (${percent}%)</span>
                    </div>
                `;
            });

            legendHtml += `<div class="building-legend-total">Total: ${total} bâtiments</div>`;
            legendContainer.innerHTML = legendHtml;
        }
    }

    /**
     * Met à jour la section des statistiques de production
     * Affiche le stock actuel et le taux de variation de chaque ressource
     */
    updateProductionStats() {
        const container = document.getElementById('megaStatsProduction');
        if (!container || !this.game.statistics) return;

        const allStats = this.game.statistics.getAllStats();
        const resourceNames = {
            money: { name: 'Or', icon: '💰' },
            food: { name: 'Nourriture', icon: '🍞' },
            water: { name: 'Eau', icon: '💧' },
            population: { name: 'Population', icon: '👥' },
            wood: { name: 'Bois', icon: '🪵' },
            stone: { name: 'Pierre', icon: '🪨' },
            sand: { name: 'Sable', icon: '🏜️' },
            dirt: { name: 'Terre', icon: '🟤' },
            clay: { name: 'Argile', icon: '🧱' }
        };

        let html = '';
        for (const [key, stat] of Object.entries(allStats)) {
            const res = resourceNames[key];
            if (!res) continue;

            const rateColor = stat.rate > 0 ? UI_COLORS.success : stat.rate < 0 ? UI_COLORS.error : UI_COLORS.neutral;

            html += `
                <div class="mega-stat-item">
                    <span class="mega-stat-icon">${res.icon}</span>
                    <span class="mega-stat-name">${res.name}</span>
                    <span class="mega-stat-value">${this.formatNumber(stat.current)}</span>
                    <span class="mega-stat-rate" style="color: ${rateColor}">${stat.rateText}</span>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Met à jour la section des statistiques de production théorique
     * Affiche ce que les bâtiments devraient produire par minute
     */
    updateTheoreticalStats() {
        const container = document.getElementById('megaStatsTheoretical');
        if (!container || !this.game.statistics) return;

        const theoretical = this.game.statistics.getTheoreticalProduction();
        const items = [
            { icon: '🍞', name: 'Nourriture', value: theoretical.food },
            { icon: '💧', name: 'Eau', value: theoretical.water },
            { icon: '💰', name: 'Or', value: theoretical.money },
            { icon: '🪵', name: 'Bois', value: theoretical.wood },
            { icon: '🪨', name: 'Pierre', value: theoretical.stone }
        ];

        let html = '';
        items.forEach(item => {
            if (item.value !== 0) {
                html += `
                    <div class="mega-stat-item">
                        <span class="mega-stat-icon">${item.icon}</span>
                        <span class="mega-stat-name">${item.name}</span>
                        <span class="mega-stat-rate" style="color: #4ade80">+${item.value.toFixed(1)}/min</span>
                    </div>
                `;
            }
        });

        if (html === '') {
            html = '<div class="no-data">Construisez des bâtiments productifs</div>';
        }

        container.innerHTML = html;
    }

    /**
     * Met à jour la section des alertes
     * Affiche les ressources en danger avec leur temps avant épuisement
     */
    updateAlertsStats() {
        const container = document.getElementById('megaStatsAlerts');
        if (!container || !this.game.statistics) return;

        const allStats = this.game.statistics.getAllStats();
        const alerts = [];

        const names = {
            money: 'Or', food: 'Nourriture', water: 'Eau',
            population: 'Population', wood: 'Bois', stone: 'Pierre',
            sand: 'Sable', dirt: 'Terre', clay: 'Argile'
        };

        // Collecter les ressources avec alertes
        for (const [key, stat] of Object.entries(allStats)) {
            if (stat.alertLevel !== 'normal' || stat.depletionText) {
                alerts.push({
                    name: names[key],
                    level: stat.alertLevel,
                    depletionText: stat.depletionText,
                    rate: stat.rate
                });
            }
        }

        if (alerts.length === 0) {
            container.innerHTML = '<div class="no-alerts-mega">Tout va bien ! Aucune alerte.</div>';
            return;
        }

        let html = '';
        alerts.forEach(alert => {
            const icon = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : '📉';
            const color = alert.level === 'critical' ? UI_COLORS.error : alert.level === 'warning' ? UI_COLORS.warning : '#60a5fa';

            html += `
                <div class="mega-alert-item" style="border-left-color: ${color}">
                    <span class="mega-alert-icon">${icon}</span>
                    <div class="mega-alert-content">
                        <span class="mega-alert-name">${alert.name}</span>
                        ${alert.depletionText ? `<span class="mega-alert-depletion">${alert.depletionText}</span>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Met à jour la section des statistiques générales
     * Affiche temps de jeu, nombre de bâtiments, paysans, etc.
     */
    updateGeneralStats() {
        const container = document.getElementById('megaStatsGeneral');
        if (!container) return;

        const state = this.game.state;
        const gameTime = state.gameTime || 0;

        // Compter le total de bâtiments
        let totalBuildings = 0;
        for (const count of Object.values(state.buildings)) {
            totalBuildings += count;
        }

        const constructionsInProgress = state.constructions.length;
        const gatheringsInProgress = state.gatheringTasks.length;

        const stats = [
            { label: 'Temps de jeu', value: formatTime(gameTime) },
            { label: 'Bâtiments construits', value: totalBuildings },
            { label: 'Constructions en cours', value: constructionsInProgress },
            { label: 'Collectes en cours', value: gatheringsInProgress },
            { label: 'Paysans disponibles', value: `${state.availablePeasants}/${state.totalPeasants}` },
            { label: 'Humeur Cléopâtre', value: `${state.cleopatraMood}%` }
        ];

        let html = '';
        stats.forEach(stat => {
            html += `
                <div class="mega-general-item">
                    <span class="mega-general-label">${stat.label}</span>
                    <span class="mega-general-value">${stat.value}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Formate un nombre pour l'affichage (K pour milliers, M pour millions)
     * @param {number} num - Nombre à formater
     * @returns {string} Nombre formaté
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    }

    /**
     * Met à jour le menu si ouvert
     * Appelé périodiquement par le game loop
     */
    update() {
        if (this.isOpen) {
            this.refresh();
        }
    }
}

export default StatsMenu;
