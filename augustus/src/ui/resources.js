// ==========================================
// AFFICHAGE DES RESSOURCES
// ==========================================

class ResourceDisplay {
    constructor() {
        this.elements = {
            gold: document.getElementById('goldDisplay'),
            food: document.getElementById('foodDisplay'),
            population: document.getElementById('populationDisplay'),
            politics: document.getElementById('politicsDisplay'),
            turn: document.getElementById('turnDisplay'),
            season: document.getElementById('seasonDisplay')
        };

        this.seasons = ['Printemps', 'Été', 'Automne', 'Hiver'];
    }

    /**
     * Met à jour l'affichage des ressources
     */
    update(resources, turn, season, year) {
        if (this.elements.gold) {
            this.elements.gold.textContent = `💰 ${resources.gold.toLocaleString()}`;
        }
        if (this.elements.food) {
            this.elements.food.textContent = `🌾 ${resources.food.toLocaleString()}`;
        }
        if (this.elements.population) {
            this.elements.population.textContent = `👥 ${resources.population.toLocaleString()}`;
        }
        if (this.elements.politics) {
            this.elements.politics.textContent = `🏛️ ${resources.politics}`;
        }
        if (this.elements.turn) {
            this.elements.turn.textContent = `Tour ${turn}`;
        }
        if (this.elements.season) {
            this.elements.season.textContent = `${this.seasons[season]} ${year} av. J.-C.`;
        }
    }

    /**
     * Met à jour la population totale
     */
    updatePopulation(totalPopulation) {
        if (this.elements.population) {
            this.elements.population.textContent = `👥 ${totalPopulation.toLocaleString()}`;
        }
    }
}

export default ResourceDisplay;
