// ==========================================
// GESTION DES PANNEAUX UI
// ==========================================

import { FACTIONS, BUILDINGS } from '../data/index.js';

class PanelManager {
    constructor(game) {
        this.game = game;
        this.sidePanel = document.getElementById('sidePanel');
        this.panelContent = document.getElementById('panelContent');
        this.quickActions = document.getElementById('quickActions');
    }

    /**
     * Affiche le panneau latéral
     */
    showSidePanel() {
        this.sidePanel.classList.remove('hidden');
    }

    /**
     * Cache le panneau latéral
     */
    hideSidePanel() {
        this.sidePanel.classList.add('hidden');
    }

    /**
     * Affiche les actions rapides
     */
    showQuickActions() {
        this.quickActions.classList.remove('hidden');
    }

    /**
     * Cache les actions rapides
     */
    hideQuickActions() {
        this.quickActions.classList.add('hidden');
    }

    /**
     * Affiche les informations d'une armée
     */
    showArmyInfo(army) {
        const faction = FACTIONS[army.faction] || FACTIONS.rebels;

        const unitsHtml = army.units.map(unit => `
            <div class="unit-item">
                <div class="name">${unit.icon} ${unit.name}</div>
                <div class="stats">
                    ${unit.currentMen}/${unit.men} hommes |
                    Exp: ${unit.experience}
                </div>
            </div>
        `).join('');

        this.panelContent.innerHTML = `
            <h2>${faction.icon} ${army.name}</h2>
            <p><strong>Faction:</strong> ${faction.name}</p>
            ${army.general ? `<p><strong>Général:</strong> ${army.general.name}</p>` : ''}
            <p><strong>Mouvement:</strong> ${army.movementPoints}/${army.maxMovement}</p>
            <p><strong>Unités:</strong> ${army.units.length}</p>
            <div class="army-units">
                ${unitsHtml}
            </div>
        `;

        this.showSidePanel();
    }

    /**
     * Affiche les informations d'une ville
     */
    showCityInfo(city, isPlayerCity) {
        const faction = FACTIONS[city.faction] || FACTIONS.rebels;

        const buildingsHtml = city.buildings.map(bId => {
            const b = BUILDINGS[bId];
            return b ? `<div class="building-item"><div class="name">${b.icon} ${b.name}</div></div>` : '';
        }).join('');

        this.panelContent.innerHTML = `
            <h2>${city.name}</h2>
            <p><strong>Faction:</strong> ${faction.icon} ${faction.name}</p>
            <p><strong>Population:</strong> ${city.population.toLocaleString()}</p>
            <p><strong>Revenus:</strong> +${city.income} 💰</p>
            <p><strong>Nourriture:</strong> +${city.foodProduction} 🌾</p>
            <p><strong>Hygiène:</strong> ${city.health}%</p>
            <p><strong>Ordre:</strong> ${city.order}%</p>
            <h3>Bâtiments</h3>
            <div class="city-buildings-list">
                ${buildingsHtml}
            </div>
            ${isPlayerCity ?
                `<button type="button" onclick="game.cityManager.openCityView('${city.id}')" style="margin-top: 15px; width: 100%;">Gérer la ville</button>`
                : ''}
        `;

        this.showSidePanel();
    }

    /**
     * Cache tous les panneaux
     */
    hideAll() {
        this.hideSidePanel();
        this.hideQuickActions();
    }
}

export default PanelManager;
