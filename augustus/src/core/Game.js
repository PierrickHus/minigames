// ==========================================
// CLASSE PRINCIPALE DU JEU
// ==========================================

import { FACTIONS } from '../data/index.js';
import { parseMarkdown } from '../utils/markdown.js';

import ScreenManager from '../ui/screens.js';
import NotificationManager from '../ui/notifications.js';
import PanelManager from '../ui/panels.js';
import ResourceDisplay from '../ui/resources.js';

import CampaignMap from '../systems/campaign-map.js';
import CityManager from '../systems/city-manager.js';
import ArmyManager from '../systems/army-manager.js';
import BattleSystem from '../systems/battle.js';
import AISystem from '../systems/ai.js';
import DiplomacySystem from '../systems/diplomacy.js';

// Nouveaux imports pour le système de tuiles
import TerrainMap from './TerrainMap.js';
import { generateEuropeMap } from '../utils/map-generator.js';
import { loadMapFromImage, downloadMap } from '../utils/map-loader.js';
import Pathfinder from '../systems/pathfinder.js';
import CityTileManager from '../systems/city-tile-manager.js';

// Chemins vers les fichiers de carte
const MAP_IMAGE_PATH = './assets/maps/europe_map.png';
const CITIES_IMAGE_PATH = './assets/maps/europe_cities.png';
const CITIES_JSON_PATH = './assets/maps/europe_cities.json';

class Game {
    constructor() {
        // État du jeu
        this.state = 'menu';
        this.playerFaction = null;
        this.turn = 1;
        this.year = 270;
        this.season = 0;
        this.seasons = ['Printemps', 'Été', 'Automne', 'Hiver'];

        // Ressources
        this.resources = {
            gold: 5000,
            food: 1000,
            population: 50000,
            politics: 50,
            iron: 100
        };

        // Données de jeu
        this.cities = {};
        this.armies = [];

        // Système de terrain (tuiles)
        this.terrainMap = null;
        this.pathfinder = null;
        this.cityTileManager = null;

        // État du mouvement
        this.movementPreview = null;
        this.reachableTiles = null;
        this.lastMouseTile = { x: 0, y: 0 };

        // Sélection
        this.selectedArmy = null;
        this.selectedCity = null;

        // Initialiser les managers
        this.screens = new ScreenManager();
        this.notifications = new NotificationManager();
        this.panels = new PanelManager(this);
        this.resourceDisplay = new ResourceDisplay();

        this.campaignMap = new CampaignMap(this);
        this.cityManager = new CityManager(this);
        this.armyManager = new ArmyManager(this);
        this.battle = new BattleSystem(this);
        this.ai = new AISystem(this);
        this.diplomacy = new DiplomacySystem(this);

        this.init();
    }

    /**
     * Initialise le jeu
     */
    init() {
        // Vérifier sauvegarde existante
        if (localStorage.getItem('augustus_save')) {
            document.getElementById('loadBtn').disabled = false;
        }

        this.setupFactionSelect();
    }

    /**
     * Configure la sélection de faction
     */
    setupFactionSelect() {
        const grid = document.getElementById('factionGrid');
        grid.innerHTML = '';

        Object.values(FACTIONS).forEach(faction => {
            if (faction.id === 'rebels' || faction.id === 'senate') return;

            const card = document.createElement('div');
            card.className = `faction-card ${faction.isRoman ? 'roman' : ''} ${!faction.playable ? 'locked' : ''}`;
            card.innerHTML = `
                <div class="faction-icon">${faction.icon}</div>
                <div class="faction-name">${faction.name}</div>
                <div class="faction-desc">${faction.description}</div>
                ${!faction.playable ? '<div class="locked-text">🔒 Bientôt disponible</div>' : ''}
            `;
            card.style.borderColor = faction.color;

            if (faction.playable) {
                card.onclick = () => this.selectFaction(faction.id);
            }

            grid.appendChild(card);
        });
    }

    // ========== NAVIGATION ==========

    showMenu() {
        this.state = 'menu';
        this.screens.show('mainMenu');
    }

    newGame() {
        this.screens.show('factionSelect');
    }

    selectFaction(factionId) {
        this.playerFaction = factionId;
        this.screens.show('campaignScreen');
        this.state = 'campaign';
        this.startCampaign();
    }

    // ========== INITIALISATION ==========

    /**
     * Initialise le système de terrain (carte de tuiles)
     * Essaie d'abord de charger depuis une image, sinon génère procéduralement
     */
    async initializeTerrainSystem() {
        console.log('Initialisation de la carte...');
        const startTime = performance.now();

        // Créer la carte de terrain
        this.terrainMap = new TerrainMap();

        // Essayer de charger depuis l'image
        try {
            await loadMapFromImage(MAP_IMAGE_PATH, this.terrainMap);
            console.log('Carte chargée depuis l\'image');
        } catch (error) {
            console.log('Image non trouvée, génération procédurale...', error.message);
            // Fallback: générer la carte procéduralement
            generateEuropeMap(this.terrainMap);
        }

        // Créer le pathfinder
        this.pathfinder = new Pathfinder(this.terrainMap);

        // Créer le gestionnaire de tuiles de ville
        this.cityTileManager = new CityTileManager(this);

        const endTime = performance.now();
        console.log(`Carte initialisée en ${(endTime - startTime).toFixed(2)}ms`);
    }

    /**
     * Télécharge la carte actuelle comme image PNG
     * Utile pour créer/modifier des cartes
     */
    downloadCurrentMap() {
        if (this.terrainMap) {
            downloadMap(this.terrainMap, 'europe.png');
            console.log('Carte téléchargée');
        }
    }

    /**
     * Charge les villes depuis l'image PNG et le fichier JSON
     */
    async loadCitiesFromMap() {
        // Charger le JSON des villes
        const response = await fetch(CITIES_JSON_PATH);
        const citiesData = await response.json();

        // Charger l'image des villes pour récupérer les positions
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = CITIES_IMAGE_PATH;
        });

        // Créer un canvas pour lire les pixels
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Scanner l'image pour trouver les villes (pixels non-transparents)
        const cities = {};
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // Si le pixel n'est pas transparent, c'est une ville
                if (a > 0) {
                    const hexColor = '#' +
                        r.toString(16).padStart(2, '0') +
                        g.toString(16).padStart(2, '0') +
                        b.toString(16).padStart(2, '0');

                    // Chercher dans le JSON
                    const cityInfo = citiesData[hexColor];
                    if (cityInfo) {
                        cities[cityInfo.id] = {
                            ...cityInfo,
                            tileX: x,
                            tileY: y
                        };
                    }
                }
            }
        }

        return cities;
    }

    async initializeGame() {
        // Initialiser le système de terrain d'abord
        await this.initializeTerrainSystem();

        // Charger les villes depuis les fichiers de carte
        const citiesData = await this.loadCitiesFromMap();

        // Initialiser les villes
        Object.entries(citiesData).forEach(([id, cityData]) => {
            const city = this.cityManager.initializeCity(id, cityData);
            city.tileX = cityData.tileX;
            city.tileY = cityData.tileY;
            this.cities[id] = city;
        });

        // Générer les layouts de tuiles pour chaque ville
        this.cityTileManager.initializeAllCities();

        // Créer les armées
        this.armies = this.armyManager.createInitialArmies();

        // Initialiser la diplomatie
        this.diplomacy.initialize();

        // Centrer sur la capitale (utiliser tileX/tileY)
        const startCity = FACTIONS[this.playerFaction].startCity;
        if (startCity && this.cities[startCity]) {
            const city = this.cities[startCity];
            this.campaignMap.centerOn(city.tileX, city.tileY);
        }
    }

    async startCampaign() {
        // Afficher l'écran de chargement
        this.showLoadingScreen('Préparation de la campagne...');

        // Initialiser le canvas d'abord
        this.campaignMap.init();

        // Initialiser le gestionnaire de sprites
        await this.initializeSpriteManager();

        // Puis initialiser les données du jeu (async pour le chargement de carte)
        await this.initializeGame();

        // Cacher l'écran de chargement
        this.hideLoadingScreen();

        this.updateUI();
        this.gameLoop();
    }

    /**
     * Initialise le gestionnaire de sprites pour les armées
     */
    async initializeSpriteManager() {
        try {
            const { default: SpriteManager } = await import('../systems/sprite-manager.js');
            this.spriteManager = new SpriteManager();
            await this.spriteManager.initialize();

            // Passer la référence au renderer
            if (this.campaignMap.tileRenderer) {
                this.campaignMap.tileRenderer.spriteManager = this.spriteManager;
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des sprites:', error);
        }
    }

    // ========== BOUCLE DE JEU ==========

    gameLoop(timestamp = 0) {
        if (this.state !== 'campaign') return;

        // Mettre à jour le temps d'animation pour les sprites
        if (this.campaignMap.tileRenderer) {
            this.campaignMap.tileRenderer.updateAnimationTime(timestamp);
        }

        // Mettre à jour les animations de mouvement
        this.armyManager.updateAnimations();

        this.campaignMap.render();
        this.campaignMap.renderMinimap();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // ========== INTERACTIONS CARTE ==========

    handleMapClick(tilePos) {
        // Clic sur une armée = sélection
        const clickedArmy = this.armyManager.findArmyAt(tilePos.x, tilePos.y, 1);
        if (clickedArmy) {
            this.armyManager.selectArmy(clickedArmy);
            return;
        }

        // Clic sur une ville = sélection
        const clickedCity = this.cityTileManager.getCityAtTile(tilePos.x, tilePos.y);
        if (clickedCity) {
            this.selectCityObject(clickedCity);
            return;
        }

        // Clic dans le vide = désélectionner
        this.selectedArmy = null;
        this.selectedCity = null;
        this.movementPreview = null;
        this.reachableTiles = null;
        this.panels.hideAll();
    }

    handleMapRightClick(tilePos) {
        // Clic droit = déplacer l'armée sélectionnée
        if (!this.selectedArmy) return;
        if (this.selectedArmy.faction !== this.playerFaction) return;

        // Lancer le déplacement (avec système de waypoint)
        this.armyManager.setMovementTarget(this.selectedArmy, tilePos);
    }

    handleMapDoubleClick(tilePos) {
        const clickedCity = this.cityTileManager.getCityAtTile(tilePos.x, tilePos.y);
        if (clickedCity && clickedCity.faction === this.playerFaction) {
            this.cityManager.openCityView(clickedCity.id);
        }
    }

    /**
     * @deprecated Utiliser cityTileManager.getCityAtTile() à la place
     */
    findCityAt(tileX, tileY) {
        // Fallback pour compatibilité
        const city = this.cityTileManager.getCityAtTile(tileX, tileY);
        return city ? city.id : null;
    }

    selectCity(cityId) {
        this.selectedCity = cityId;
        this.selectedArmy = null;
        this.panels.hideQuickActions();
        this.panels.showCityInfo(this.cities[cityId], this.cities[cityId].faction === this.playerFaction);
    }

    selectCityObject(city) {
        this.selectedCity = city.id;
        this.selectedArmy = null;
        this.panels.hideQuickActions();
        this.panels.showCityInfo(city, city.faction === this.playerFaction);
    }

    // ========== ACTIONS ==========

    startMove() {
        this.armyManager.startMove();
    }

    /**
     * Lance une attaque depuis l'armée sélectionnée
     */
    attack() {
        if (!this.selectedArmy) {
            this.notify('Sélectionnez d\'abord une armée', 'warning');
            return;
        }

        if (this.selectedArmy.faction !== this.playerFaction) {
            this.notify('Vous ne pouvez pas contrôler cette armée', 'warning');
            return;
        }

        // Chercher une cible proche (armée ennemie ou ville)
        const nearbyEnemy = this.armyManager.findNearbyEnemy(this.selectedArmy);

        if (nearbyEnemy) {
            if (nearbyEnemy.type === 'army') {
                this.battle.start(this.selectedArmy, nearbyEnemy.target);
            } else if (nearbyEnemy.type === 'city') {
                this.armyManager.initiateSiege(this.selectedArmy, nearbyEnemy.target);
            }
        } else {
            this.notify('Aucune cible à portée. Déplacez-vous vers un ennemi.', 'info');
        }
    }

    /**
     * Affiche le menu de recrutement pour l'armée sélectionnée
     */
    showRecruit() {
        if (!this.selectedArmy) {
            this.notify('Sélectionnez d\'abord une armée', 'warning');
            return;
        }

        if (this.selectedArmy.faction !== this.playerFaction) {
            this.notify('Vous ne pouvez pas recruter pour cette armée', 'warning');
            return;
        }

        // Vérifier si l'armée est dans une ville alliée
        const city = this.findCityAtPosition(this.selectedArmy.tileX, this.selectedArmy.tileY);

        if (city && city.faction === this.playerFaction) {
            // Ouvrir la vue de la ville pour recruter
            this.openCityView(city.id);
        } else {
            this.notify('L\'armée doit être dans une ville alliée pour recruter', 'warning');
        }
    }

    /**
     * Trouve une ville à une position donnée
     */
    findCityAtPosition(tileX, tileY) {
        for (const [cityId, city] of Object.entries(this.cities)) {
            // Vérifier le centre de la ville
            if (city.tileX === tileX && city.tileY === tileY) {
                return { ...city, id: cityId };
            }
            // Vérifier les tuiles de la ville
            if (city.tiles) {
                for (const tile of city.tiles) {
                    if (tile.x === tileX && tile.y === tileY) {
                        return { ...city, id: cityId };
                    }
                }
            }
        }
        return null;
    }

    openCityView(cityId) {
        this.cityManager.openCityView(cityId);
    }

    closeCityView() {
        this.cityManager.closeCityView();
    }

    // ========== FIN DE TOUR ==========

    endTurn() {
        // Traiter les villes du joueur
        Object.values(this.cities)
            .filter(city => city.faction === this.playerFaction)
            .forEach(city => {
                this.cityManager.processTurn(city);
                // Mettre à jour les tuiles si la population a changé
                if (this.cityTileManager.updateCityTiles(city)) {
                    this.campaignMap.invalidateMinimapTerrain();
                }
            });

        // IA des autres factions
        this.ai.processTurn();

        // Réapprovisionner les armées dans les villes alliées
        this.armyManager.resupplyArmies();

        // Continuer les déplacements automatiques (waypoints) AVANT de reset les PM
        this.armyManager.continueWaypointMovements();

        // Réinitialiser les mouvements pour le prochain tour
        this.armyManager.resetMovementPoints();

        // Recalculer les tuiles accessibles si une armée du joueur est sélectionnée
        if (this.selectedArmy && this.selectedArmy.faction === this.playerFaction) {
            this.armyManager.calculateReachableTiles(this.selectedArmy);
        }

        // Avancer le temps
        this.season++;
        if (this.season > 3) {
            this.season = 0;
            this.year--;
        }
        this.turn++;

        this.updateUI();
        this.notify(`Tour ${this.turn} - ${this.seasons[this.season]} ${this.year} av. J.-C.`, 'info');
    }

    // ========== UI ==========

    updateUI() {
        this.resourceDisplay.update(
            { ...this.resources, population: this.getTotalPopulation() },
            this.turn,
            this.season,
            this.year
        );
    }

    getTotalPopulation() {
        return Object.values(this.cities)
            .filter(c => c.faction === this.playerFaction)
            .reduce((sum, c) => sum + c.population, 0);
    }

    notify(message, type = 'info') {
        this.notifications.show(message, type);
    }

    // ========== ÉCRAN DE CHARGEMENT ==========

    showLoadingScreen(message = 'Chargement...') {
        // Supprimer un écran de chargement existant si présent
        this.hideLoadingScreen();

        const loader = document.createElement('div');
        loader.id = 'gameLoadingScreen';
        loader.innerHTML = `
            <div class="loading-content">
                <h1>AUGUSTUS</h1>
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoadingScreen() {
        const loader = document.getElementById('gameLoadingScreen');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 300);
        }
    }

    // ========== GUIDE ==========

    async showGuide() {
        try {
            const response = await fetch('README.md');
            const markdown = await response.text();
            const html = parseMarkdown(markdown);
            document.getElementById('guideContent').innerHTML = html;
            this.screens.show('guideScreen');
        } catch (error) {
            this.notify('Erreur lors du chargement du guide', 'error');
            console.error(error);
        }
    }

    closeGuide() {
        this.screens.show('mainMenu');
    }

    showCredits() {
        this.notify('Augustus - Créé avec passion pour Rome!', 'info');
    }

    // ========== SAUVEGARDE ==========

    /**
     * Nettoie un objet des références circulaires pour la sérialisation JSON
     */
    cleanForSave(obj, seen = new WeakSet()) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // Éviter les références circulaires
        if (seen.has(obj)) {
            return undefined;
        }
        seen.add(obj);

        // Gérer les tableaux
        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanForSave(item, seen)).filter(item => item !== undefined);
        }

        // Gérer les objets
        const cleaned = {};
        for (const key of Object.keys(obj)) {
            // Ignorer les propriétés qui causent des références circulaires
            if (key === 'game' || key === 'target' || key === 'source' || key === 'manager') {
                continue;
            }
            const value = this.cleanForSave(obj[key], seen);
            if (value !== undefined) {
                cleaned[key] = value;
            }
        }
        return cleaned;
    }

    saveGame() {
        const saveData = {
            version: 2, // Version pour le nouveau système de tuiles
            playerFaction: this.playerFaction,
            turn: this.turn,
            year: this.year,
            season: this.season,
            resources: this.resources,
            cities: this.cleanForSave(this.cities),
            armies: this.cleanForSave(this.armies),
            diplomacy: this.diplomacy.export(),
            camera: this.campaignMap?.tileRenderer?.camera?.export() ?? null
        };

        localStorage.setItem('augustus_save', JSON.stringify(saveData));
        this.notify('Partie sauvegardée!', 'success');
    }

    async loadGame() {
        const saveData = localStorage.getItem('augustus_save');
        if (!saveData) {
            this.notify('Aucune sauvegarde trouvée!', 'error');
            return;
        }

        const data = JSON.parse(saveData);

        // Vérifier la version de sauvegarde
        if (!data.version || data.version < 2) {
            this.notify('Sauvegarde incompatible avec le nouveau système de carte!', 'error');
            return;
        }

        // Afficher l'écran de chargement
        this.showLoadingScreen('Chargement de la partie...');

        this.playerFaction = data.playerFaction;
        this.turn = data.turn;
        this.year = data.year;
        this.season = data.season;
        this.resources = data.resources;
        this.cities = data.cities;
        this.armies = data.armies;
        this.diplomacy.import(data.diplomacy);

        this.screens.show('campaignScreen');
        this.state = 'campaign';

        // Initialiser le canvas
        this.campaignMap.init();

        // Initialiser le gestionnaire de sprites
        await this.initializeSpriteManager();

        // Réinitialiser le système de terrain (async)
        await this.initializeTerrainSystem();

        // Régénérer les tuiles des villes (elles ne sont pas sauvegardées complètement)
        if (this.cityTileManager) {
            this.cityTileManager.initializeAllCities();
        }

        // Initialiser les positions visuelles des armées pour l'animation
        this.armyManager.initializeVisualPositions();

        // Restaurer la position de la caméra si sauvegardée
        if (data.camera && this.campaignMap.tileRenderer?.camera) {
            this.campaignMap.tileRenderer.camera.import(data.camera);
        } else {
            // Fallback: centrer sur la capitale du joueur
            const startCity = FACTIONS[this.playerFaction].startCity;
            if (startCity && this.cities[startCity]) {
                const city = this.cities[startCity];
                this.campaignMap.centerOn(city.tileX, city.tileY);
            }
        }

        // Cacher l'écran de chargement
        this.hideLoadingScreen();

        this.updateUI();
        this.gameLoop();

        this.notify('Partie chargée!', 'success');
    }
}

export default Game;
