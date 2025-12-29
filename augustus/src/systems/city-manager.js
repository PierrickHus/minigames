// ==========================================
// SYSTÈME DE GESTION DES VILLES
// ==========================================

import { BUILDINGS, UNIT_TYPES, FACTIONS } from '../data/index.js';

class CityManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Initialise une ville avec ses données de base
     */
    initializeCity(id, cityData) {
        const city = {
            ...cityData,
            id: id,
            buildings: ['governor_palace'],
            constructionQueue: [],
            recruitmentQueue: [],
            garrison: [],
            income: 100,
            foodProduction: 50,
            health: 50,
            order: 70,
            happiness: 60,
            workersAvailable: Math.floor(cityData.population * 0.4)
        };

        // Ajouter des bâtiments selon la taille
        if (cityData.population > 20000) {
            city.buildings.push('farm', 'market', 'barracks', 'walls');
        } else if (cityData.population > 10000) {
            city.buildings.push('farm', 'market');
        }

        return city;
    }

    /**
     * Ouvre la vue de gestion de ville
     */
    openCityView(cityId) {
        const city = this.game.cities[cityId];
        if (!city || city.faction !== this.game.playerFaction) return;

        this.game.selectedCity = cityId;
        this.game.screens.show('cityScreen');
        this.updateCityView();
    }

    /**
     * Ferme la vue de ville
     */
    closeCityView() {
        this.game.screens.show('campaignScreen');
    }

    /**
     * Met à jour l'affichage de la ville
     */
    updateCityView() {
        const city = this.game.cities[this.game.selectedCity];
        if (!city) return;

        document.getElementById('cityName').textContent = city.name;
        document.getElementById('cityPop').textContent = city.population.toLocaleString();
        document.getElementById('cityIncome').textContent = `+${city.income}`;
        document.getElementById('cityFood').textContent = `+${city.foodProduction}`;
        document.getElementById('cityHealth').textContent = `${city.health}%`;
        document.getElementById('cityOrder').textContent = `${city.order}%`;

        this.renderBuildings(city);
        this.renderConstructionQueue(city);
        this.renderAvailableBuildings(city);
        this.renderRecruitmentQueue(city);
        this.renderAvailableUnits(city);
    }

    /**
     * Affiche les bâtiments construits
     */
    renderBuildings(city) {
        const container = document.getElementById('buildingsList');
        container.innerHTML = city.buildings.map(bId => {
            const b = BUILDINGS[bId];
            if (!b) return '';
            return `
                <div class="building-item">
                    <div class="name">${b.icon} ${b.name}</div>
                    <div class="cost">${this.getBuildingEffectsText(b)}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Affiche la file de construction
     */
    renderConstructionQueue(city) {
        const container = document.getElementById('constructionQueue');
        container.innerHTML = city.constructionQueue.map(item => {
            const b = BUILDINGS[item.buildingId];
            return `
                <div class="building-item constructing">
                    <div class="name">${b.icon} ${b.name}</div>
                    <div class="turns">${item.turnsLeft} tour(s) restant(s)</div>
                </div>
            `;
        }).join('') || '<p style="color: #888;">Aucune construction en cours</p>';
    }

    /**
     * Affiche les bâtiments disponibles à la construction
     */
    renderAvailableBuildings(city) {
        const container = document.getElementById('availableBuildings');
        const buildable = this.getAvailableBuildings(city);
        container.innerHTML = buildable.map(b => `
            <div class="building-item" onclick="game.cityManager.startConstruction('${b.id}')" style="cursor: pointer;">
                <div class="name">${b.icon} ${b.name}</div>
                <div class="cost">💰 ${b.cost} | ⏱️ ${b.turns} tours</div>
                <div class="turns">${b.description}</div>
            </div>
        `).join('') || '<p style="color: #888;">Aucun bâtiment disponible</p>';
    }

    /**
     * Affiche la file de recrutement
     */
    renderRecruitmentQueue(city) {
        const container = document.getElementById('recruitmentQueue');
        container.innerHTML = city.recruitmentQueue.map(item => {
            const u = UNIT_TYPES[item.unitId];
            return `
                <div class="unit-item constructing">
                    <div class="name">${u.icon} ${u.name}</div>
                    <div class="turns">${item.turnsLeft} tour(s) restant(s)</div>
                </div>
            `;
        }).join('') || '<p style="color: #888;">Aucun recrutement en cours</p>';
    }

    /**
     * Affiche les unités disponibles au recrutement
     */
    renderAvailableUnits(city) {
        const container = document.getElementById('availableUnits');
        const recruitable = this.getRecruitableUnits(city);
        container.innerHTML = recruitable.map(u => `
            <div class="unit-item" onclick="game.cityManager.startRecruitment('${u.id}')" style="cursor: pointer;">
                <div class="name">${u.icon} ${u.name}</div>
                <div class="cost">💰 ${u.cost} | 👥 ${u.populationCost} pop | ⏱️ ${u.recruitTime} tours</div>
            </div>
        `).join('') || '<p style="color: #888;">Construisez une caserne pour recruter des unités</p>';
    }

    /**
     * Retourne le texte des effets d'un bâtiment
     */
    getBuildingEffectsText(building) {
        const effects = [];
        if (building.effects.income) effects.push(`+${building.effects.income} 💰`);
        if (building.effects.food) effects.push(`+${building.effects.food} 🌾`);
        if (building.effects.health) effects.push(`+${building.effects.health}% santé`);
        if (building.effects.order) effects.push(`+${building.effects.order}% ordre`);
        if (building.effects.happiness) effects.push(`+${building.effects.happiness}% bonheur`);
        if (building.effects.politics) effects.push(`+${building.effects.politics} politique`);
        return effects.join(' | ');
    }

    /**
     * Retourne les bâtiments constructibles
     */
    getAvailableBuildings(city) {
        return Object.values(BUILDINGS).filter(b => {
            if (city.buildings.includes(b.id)) return false;
            if (city.constructionQueue.some(c => c.buildingId === b.id)) return false;
            if (b.prerequisite && !city.buildings.includes(b.prerequisite)) return false;
            if (b.coastal && !city.coastal) return false;
            if (b.cost > this.game.resources.gold) return false;
            return true;
        });
    }

    /**
     * Retourne les unités recrutables
     */
    getRecruitableUnits(city) {
        const unlockedUnits = new Set();
        city.buildings.forEach(bId => {
            const b = BUILDINGS[bId];
            if (b && b.unlocksUnits) {
                b.unlocksUnits.forEach(u => unlockedUnits.add(u));
            }
        });

        return Object.values(UNIT_TYPES).filter(u => {
            if (!unlockedUnits.has(u.id)) return false;
            if (u.faction !== 'roman' && !FACTIONS[this.game.playerFaction].isRoman) return false;
            if (u.cost > this.game.resources.gold) return false;
            if (u.populationCost > city.workersAvailable) return false;
            return true;
        });
    }

    /**
     * Démarre une construction
     */
    startConstruction(buildingId) {
        const city = this.game.cities[this.game.selectedCity];
        const building = BUILDINGS[buildingId];

        if (!building || this.game.resources.gold < building.cost) {
            this.game.notify('Ressources insuffisantes!', 'error');
            return;
        }

        this.game.resources.gold -= building.cost;
        city.constructionQueue.push({
            buildingId: buildingId,
            turnsLeft: building.turns
        });

        this.game.notify(`Construction de ${building.name} commencée!`, 'success');
        this.updateCityView();
        this.game.updateUI();
    }

    /**
     * Démarre un recrutement
     */
    startRecruitment(unitId) {
        const city = this.game.cities[this.game.selectedCity];
        const unit = UNIT_TYPES[unitId];

        if (!unit) return;

        if (this.game.resources.gold < unit.cost) {
            this.game.notify('Or insuffisant!', 'error');
            return;
        }

        if (city.workersAvailable < unit.populationCost) {
            this.game.notify('Population insuffisante!', 'error');
            return;
        }

        this.game.resources.gold -= unit.cost;
        city.population -= unit.populationCost;
        city.workersAvailable -= unit.populationCost;

        city.recruitmentQueue.push({
            unitId: unitId,
            turnsLeft: unit.recruitTime
        });

        this.game.notify(`Recrutement de ${unit.name} commencé!`, 'success');
        this.updateCityView();
        this.game.updateUI();
    }

    /**
     * Applique les effets d'un bâtiment terminé
     */
    applyBuildingEffects(city, building) {
        if (building.effects.income) city.income += building.effects.income;
        if (building.effects.food) city.foodProduction += building.effects.food;
        if (building.effects.health) city.health = Math.min(100, city.health + building.effects.health);
        if (building.effects.order) city.order = Math.min(100, city.order + building.effects.order);
        if (building.effects.happiness) city.happiness = Math.min(100, city.happiness + building.effects.happiness);
        if (building.effects.politics) this.game.resources.politics += building.effects.politics;
    }

    /**
     * Traite les constructions et recrutements en fin de tour
     */
    processTurn(city) {
        // Constructions
        city.constructionQueue = city.constructionQueue.filter(item => {
            item.turnsLeft--;
            if (item.turnsLeft <= 0) {
                city.buildings.push(item.buildingId);
                const b = BUILDINGS[item.buildingId];
                this.game.notify(`${b.name} terminé à ${city.name}!`, 'success');
                this.applyBuildingEffects(city, b);
                return false;
            }
            return true;
        });

        // Recrutements
        city.recruitmentQueue = city.recruitmentQueue.filter(item => {
            item.turnsLeft--;
            if (item.turnsLeft <= 0) {
                const unit = this.game.armyManager.createUnit(item.unitId);
                // Chercher une armée proche (distance en tuiles)
                const nearbyArmy = this.game.armies.find(a =>
                    a.faction === city.faction &&
                    Math.abs(a.tileX - city.tileX) <= 5 &&
                    Math.abs(a.tileY - city.tileY) <= 5
                );

                if (nearbyArmy) {
                    // Ajouter à l'armée proche
                    nearbyArmy.units.push(unit);
                    this.game.notify(`${unit.name} a rejoint ${nearbyArmy.name}!`, 'success');
                } else {
                    // Créer une nouvelle armée à côté de la ville (en coordonnées tuiles)
                    const armyCount = this.game.armies.filter(a => a.faction === city.faction).length;
                    const newArmy = this.game.armyManager.createArmy(
                        city.faction,
                        city.tileX + 2,
                        city.tileY + 1,
                        `Legio ${this.toRoman(armyCount + 1)}`,
                        [unit]
                    );
                    this.game.armies.push(newArmy);
                    this.game.notify(`${unit.name} recruté - Nouvelle armée créée: ${newArmy.name}!`, 'success');
                }
                return false;
            }
            return true;
        });

        // Revenus et nourriture
        this.game.resources.gold += city.income;
        this.game.resources.food += city.foodProduction;

        // Croissance de population
        if (this.game.resources.food > 0) {
            const growth = Math.floor(city.population * 0.01 * (city.health / 100));
            city.population += growth;
            city.workersAvailable = Math.floor(city.population * 0.4);
        }
    }
    /**
     * Convertit un nombre en chiffres romains
     */
    toRoman(num) {
        const romanNumerals = [
            ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
        ];
        let result = '';
        for (const [roman, value] of romanNumerals) {
            while (num >= value) {
                result += roman;
                num -= value;
            }
        }
        return result;
    }
}

export default CityManager;
