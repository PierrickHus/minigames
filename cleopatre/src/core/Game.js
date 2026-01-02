/**
 * Classe principale du jeu Cléopâtre
 * Gère l'état du jeu, les systèmes, la boucle de jeu et la sauvegarde/chargement
 */

import ScreenManager from '../ui/screens.js';
import NotificationManager from '../ui/notifications.js';
import PanelManager from '../ui/panels.js';
import VillageRenderer from '../systems/village-renderer.js';
import CleopatraSystem from '../systems/cleopatra.js';
import StatisticsSystem from '../systems/statistics.js';
import StatsMenu from '../ui/stats-menu.js';
import GameConfig from './game-config.js';
import ScenarioSystem from '../systems/scenario.js';
import SCENARIOS, { getScenarioList } from '../data/scenarios/index.js';
import { BUILDINGS, RESOURCES, CONSUMABLES, RATION_CONFIG, POPULATION_GROWTH_CONFIG } from '../data/index.js';

/**
 * Configuration du scaling logarithmique pour les coûts
 * Augmente progressivement les coûts des bâtiments et messages
 */
const SCALING_CONFIG = {
    buildingCostFactor: 1.15,  // +15% par bâtiment existant
    messageCostFactor: 1.8,    // +80% par message envoyé
    baseMessageCost: 150       // Coût de base pour un message à César
};

class Game {
    /**
     * Crée une nouvelle instance du jeu
     * Initialise tous les managers, l'état et les systèmes audio
     */
    constructor() {
        // Managers UI
        this.screens = new ScreenManager();
        this.notifications = new NotificationManager();

        // Configuration du jeu (API centralisée)
        this.config = new GameConfig();

        // Système de scénarios
        this.scenario = new ScenarioSystem(this);

        // État du jeu
        this.state = this.getInitialState();

        // Systèmes (initialisés au démarrage d'une partie)
        this.villageRenderer = null;
        this.cleopatra = null;
        this.panels = null;
        this.statistics = null;
        this.statsMenu = null;

        // Boucle de jeu
        this.lastTime = 0;
        this.gameLoop = null;
        this.isRunning = false;

        // Sauvegarde automatique
        this.autoSaveEnabled = false;
        this.autoSaveInterval = null;
        this.autoSaveDelay = 120; // 2 minutes en secondes

        // Musique de jeu et de menu
        this.musicTracks = [];
        this.menuTracks = [];
        this.currentTrackIndex = 0;
        this.musicPlaying = false;
        this.menuMusicPlaying = false;

        // Effets sonores organisés par catégorie
        this.sfx = {
            click: new Audio('./assets/sfx/click-ui.mp3'),
            clickMale: [
                new Audio('./assets/sfx/click-male-1.mp3'),
                new Audio('./assets/sfx/click-male-2.mp3')
            ],
            clickFemale: [
                new Audio('./assets/sfx/click-female-1.mp3'),
                new Audio('./assets/sfx/click-female-2.mp3')
            ],
            hoverMale: [
                new Audio('./assets/sfx/hover-male-1.mp3'),
                new Audio('./assets/sfx/hover-male-2.mp3'),
                new Audio('./assets/sfx/hover-male-3.mp3')
            ],
            hoverFemale: [
                new Audio('./assets/sfx/hover-female-1.mp3'),
                new Audio('./assets/sfx/hover-female-2.mp3'),
                new Audio('./assets/sfx/hover-female-3.mp3')
            ],
            cleopatraNewTask: [
                new Audio('./assets/sfx/cleopatra-new-task-1.mp3'),
                new Audio('./assets/sfx/cleopatra-new-task-2.mp3'),
                new Audio('./assets/sfx/cleopatra-new-task-3.mp3'),
                new Audio('./assets/sfx/cleopatra-new-task-4.mp3'),
                new Audio('./assets/sfx/cleopatra-new-task-5.mp3')
            ],
            cleopatraTaskSuccess: [
                new Audio('./assets/sfx/cleopatra-task-success-1.mp3'),
                new Audio('./assets/sfx/cleopatra-task-success-2.mp3'),
                new Audio('./assets/sfx/cleopatra-task-success-3.mp3'),
                new Audio('./assets/sfx/cleopatra-task-success-4.mp3')
            ],
            cleopatraTaskFailed: [
                new Audio('./assets/sfx/cleopatra-task-failed-1.mp3'),
                new Audio('./assets/sfx/cleopatra-task-failed-2.mp3'),
                new Audio('./assets/sfx/cleopatra-task-failed-3.mp3'),
                new Audio('./assets/sfx/cleopatra-task-failed-4.mp3')
            ]
        };

        // Configuration des volumes (1.0 par défaut, ajustés par les paramètres)
        this.sfx.click.volume = 1.0;
        this.sfx.clickMale.forEach(s => s.volume = 1.0);
        this.sfx.clickFemale.forEach(s => s.volume = 1.0);
        this.sfx.hoverMale.forEach(s => s.volume = 1.0);
        this.sfx.hoverFemale.forEach(s => s.volume = 1.0);
        this.sfx.cleopatraNewTask.forEach(s => s.volume = 1.0);
        this.sfx.cleopatraTaskSuccess.forEach(s => s.volume = 1.0);
        this.sfx.cleopatraTaskFailed.forEach(s => s.volume = 1.0);

        // Référence au son Cléopâtre en cours pour éviter les superpositions
        this.currentCleopatraSound = null;

        this.checkSaveGame();
        this.initButtonSounds();
        this.startMenuMusic();
    }

    /**
     * Retourne l'état initial du jeu avec toutes les valeurs par défaut
     * @returns {object} État initial complet
     */
    getInitialState() {
        return {
            // Infos joueur
            playerGender: null,

            // Ressources principales
            money: 1000,
            food: 50,
            water: 50,

            // Population
            population: 100,
            totalPeasants: 10,
            availablePeasants: 10,

            // Ressources de construction
            resources: {
                wood: 20,
                stone: 10,
                sand: 30,
                dirt: 50,
                clay: 15
            },

            // Bâtiments construits: { buildingId: count }
            buildings: {},

            // Constructions en cours
            constructions: [],

            // Tâches de collecte en cours
            gatheringTasks: [],

            // Compteur de messages envoyés à César (pour scaling)
            messagesSentToCaesar: 0,

            // Oiseaux messagers disponibles
            birds: 0,

            // Timer des rations (consommation périodique)
            rationTimer: RATION_CONFIG.interval,
            rationWarningShown: false,

            // Timer de croissance naturelle de la population
            growthTimer: POPULATION_GROWTH_CONFIG.growthInterval,

            // Humeur de Cléopâtre (0-100, game over à 0)
            cleopatraMood: 15,

            // Options
            autoSendResources: false,

            // Statistiques de partie
            startTime: null,
            gameTime: 0,
            buildingsBuilt: 0
        };
    }

    /**
     * Vérifie s'il existe une sauvegarde et active le bouton charger
     */
    checkSaveGame() {
        const saveData = localStorage.getItem('cleopatra_save');
        const loadBtn = document.getElementById('loadBtn');

        if (saveData && loadBtn) {
            loadBtn.disabled = false;
        }
    }

    /**
     * Démarre une nouvelle partie libre (mode freeplay)
     */
    newGame() {
        this.selectScenario('freeplay');
    }

    /**
     * Démarre le tutoriel
     */
    startTutorial() {
        this.selectScenario('tutorial');
    }

    /**
     * Affiche l'écran de sélection de scénarios
     * (Pour le moment, aucun scénario supplémentaire n'est disponible)
     */
    showScenarios() {
        this.renderScenarioSelect();
        this.screens.show('scenarioSelect');
    }

    /**
     * Génère le HTML des cartes de scénarios (exclut freeplay et tutorial)
     */
    renderScenarioSelect() {
        const container = document.getElementById('scenarioCards');
        if (!container) return;

        // Filtrer les scénarios pour n'afficher que les "bonus" (pas freeplay ni tutorial)
        const scenarios = getScenarioList().filter(s => s.id !== 'freeplay' && s.id !== 'tutorial');

        if (scenarios.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center;">Aucun scénario supplémentaire disponible pour le moment.</p>';
            return;
        }

        container.innerHTML = scenarios.map(scenario => `
            <div class="scenario-card ${scenario.recommended ? 'recommended' : ''}"
                 data-scenario="${scenario.id}">
                <div class="scenario-card-icon">${scenario.icon}</div>
                <div class="scenario-card-name">${scenario.name}</div>
                <div class="scenario-card-description">${scenario.description}</div>
            </div>
        `).join('');

        // Ajouter les event listeners
        container.querySelectorAll('.scenario-card').forEach(card => {
            card.addEventListener('click', () => {
                const scenarioId = card.dataset.scenario;
                this.selectScenario(scenarioId);
            });
        });
    }

    /**
     * Sélectionne un scénario et passe à la sélection de personnage
     * @param {string} scenarioId - ID du scénario sélectionné
     */
    selectScenario(scenarioId) {
        this.playClickSound();

        // Charger le scénario dans le système
        if (!this.scenario.loadScenario(scenarioId)) {
            this.notifications.error('Scénario non trouvé !');
            return;
        }

        // Stocker l'ID pour utilisation après sélection personnage
        this.pendingScenarioId = scenarioId;

        // Passer à la sélection de personnage
        this.screens.show('characterSelect');
    }

    /**
     * Sélectionne le genre du personnage et démarre la partie
     * @param {string} gender - 'male' ou 'female'
     */
    selectCharacter(gender) {
        this.playCharacterSound(gender);
        this.state = this.getInitialState();
        this.state.playerGender = gender;
        this.state.startTime = Date.now();
        this.state.scenarioId = this.pendingScenarioId || 'freeplay';
        this.startGame();
    }

    /**
     * Initialise les sons de clic sur les boutons et hover sur les personnages
     */
    initButtonSounds() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn, [data-action]')) {
                this.playClickSound();
            }
        });

        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                const gender = card.dataset.gender;
                this.playCharacterHoverSound(gender);
            });
        });
    }

    /**
     * Joue le son de clic standard
     */
    playClickSound() {
        this.sfx.click.currentTime = 0;
        this.sfx.click.play().catch(() => {});
    }

    /**
     * Joue un son aléatoire de hover sur carte personnage
     * @param {string} gender - 'male' ou 'female'
     */
    playCharacterHoverSound(gender) {
        const sounds = gender === 'male' ? this.sfx.hoverMale : this.sfx.hoverFemale;
        const randomIndex = Math.floor(Math.random() * sounds.length);
        const sound = sounds[randomIndex];
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    /**
     * Joue un son aléatoire de sélection de personnage
     * @param {string} gender - 'male' ou 'female'
     */
    playCharacterSound(gender) {
        const sounds = gender === 'male' ? this.sfx.clickMale : this.sfx.clickFemale;
        const randomIndex = Math.floor(Math.random() * sounds.length);
        const sound = sounds[randomIndex];
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    /**
     * Arrête le son Cléopâtre en cours et joue un nouveau
     * Évite les superpositions de sons
     * @param {Audio[]} sounds - Tableau de sons parmi lesquels choisir
     */
    playCleopatraSound(sounds) {
        if (this.currentCleopatraSound) {
            this.currentCleopatraSound.pause();
            this.currentCleopatraSound.currentTime = 0;
        }

        const randomIndex = Math.floor(Math.random() * sounds.length);
        const sound = sounds[randomIndex];
        sound.currentTime = 0;
        sound.play().catch(() => {});
        this.currentCleopatraSound = sound;
    }

    /**
     * Joue un son de nouvelle tâche Cléopâtre
     */
    playCleopatraNewTaskSound() {
        this.playCleopatraSound(this.sfx.cleopatraNewTask);
    }

    /**
     * Joue un son de tâche réussie Cléopâtre
     */
    playCleopatraTaskSuccessSound() {
        this.playCleopatraSound(this.sfx.cleopatraTaskSuccess);
    }

    /**
     * Joue un son de tâche échouée Cléopâtre
     */
    playCleopatraTaskFailedSound() {
        this.playCleopatraSound(this.sfx.cleopatraTaskFailed);
    }

    /**
     * Démarre le jeu après la sélection du personnage
     * Initialise tous les systèmes et lance la boucle de jeu
     */
    startGame() {
        this.screens.show('gameScreen');

        // Initialiser les systèmes de jeu
        this.villageRenderer = new VillageRenderer(this);
        this.cleopatra = new CleopatraSystem(this);
        this.panels = new PanelManager(this);
        this.statistics = new StatisticsSystem(this);
        this.statsMenu = new StatsMenu(this);

        this.initResourceTooltips();
        this.initAutoSave();
        this.cleopatra.updateMoodDisplay();

        // Mettre à jour l'affichage de l'objectif selon la config
        this.updateGoalDisplay();

        // Démarrer le scénario
        this.scenario.start();

        // Démarrer la boucle de jeu
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));

        this.notifications.success("Bienvenue dans votre village !");

        // Transition audio: menu -> jeu
        this.stopMenuMusic();
        this.startGameMusic();
    }

    /**
     * Met à jour l'affichage de l'objectif dans la barre supérieure
     */
    updateGoalDisplay() {
        const goalEl = document.getElementById('goalDisplay');
        if (!goalEl) return;

        const victory = this.config.victory;
        const goalText = this.getGoalSummaryText(victory);
        goalEl.textContent = goalText;

        // Mettre à jour le tooltip détaillé
        this.updateGoalTooltip();

        // Setup des événements du tooltip (une seule fois)
        this.setupGoalTooltipEvents();
    }

    /**
     * Génère le texte résumé de l'objectif principal
     * @param {object} victory - Conditions de victoire
     * @returns {string}
     */
    getGoalSummaryText(victory) {
        if (!victory) return 'Mode libre';

        // Compter les conditions simples (format plat)
        const simpleConditions = this.countSimpleConditions(victory);

        if (simpleConditions === 0) return 'Mode libre';
        if (simpleConditions === 1) {
            // Une seule condition : afficher directement
            return this.formatSingleCondition(victory);
        }

        // Plusieurs conditions : afficher un résumé
        return `Objectifs (${simpleConditions} conditions)`;
    }

    /**
     * Compte les conditions simples dans un objet de conditions
     */
    countSimpleConditions(conditions) {
        if (!conditions) return 0;
        let count = 0;
        for (const [key, value] of Object.entries(conditions)) {
            if (key === '$and' || key === '$or') {
                value.forEach(sub => count += this.countSimpleConditions(sub));
            } else {
                count++;
            }
        }
        return count;
    }

    /**
     * Formate une condition unique pour l'affichage
     */
    formatSingleCondition(victory) {
        for (const [key, value] of Object.entries(victory)) {
            if (key === '$and' || key === '$or') continue;
            const label = this.getConditionLabel(key);
            const target = typeof value === 'number' ? value : (value.min || value.max || value);
            return `Objectif: ${target.toLocaleString()} ${label}`;
        }
        return 'Mode libre';
    }

    /**
     * Configure les événements du tooltip d'objectifs
     */
    setupGoalTooltipEvents() {
        if (this._goalTooltipEventsSetup) return;

        const container = document.getElementById('goalContainer');
        const tooltip = document.getElementById('goalTooltip');
        if (!container || !tooltip) return;

        // Fonction pour cacher le tooltip avec délai (permet de passer au tooltip)
        const hideTooltipDelayed = () => {
            // Ne pas cacher si force-visible est actif (tutoriel)
            if (tooltip.classList.contains('force-visible')) return;

            // Petit délai pour permettre de passer au tooltip
            this._goalTooltipHideTimeout = setTimeout(() => {
                tooltip.classList.add('hidden');
            }, 100);
        };

        // Fonction pour annuler le hide
        const cancelHide = () => {
            if (this._goalTooltipHideTimeout) {
                clearTimeout(this._goalTooltipHideTimeout);
                this._goalTooltipHideTimeout = null;
            }
        };

        // Événements sur le container (bouton objectif)
        container.addEventListener('mouseenter', () => {
            cancelHide();
            this.updateGoalTooltip();
            tooltip.classList.remove('hidden');
        });

        container.addEventListener('mouseleave', hideTooltipDelayed);

        // Événements sur le tooltip lui-même
        tooltip.addEventListener('mouseenter', cancelHide);
        tooltip.addEventListener('mouseleave', hideTooltipDelayed);

        this._goalTooltipEventsSetup = true;
    }

    /**
     * Met à jour le contenu du tooltip des objectifs
     */
    updateGoalTooltip() {
        const victoryList = document.getElementById('victoryConditionsList');
        const defeatList = document.getElementById('defeatConditionsList');
        const victorySection = document.getElementById('goalVictoryConditions');
        const defeatSection = document.getElementById('goalDefeatConditions');

        if (!victoryList || !defeatList) return;

        const victory = this.config.victory;
        const defeat = this.config.defeat;

        // Conditions de victoire
        if (victory && Object.keys(victory).length > 0) {
            victoryList.innerHTML = this.renderConditionsHTML(victory, 'victory');
            victorySection?.classList.remove('hidden');
        } else {
            victoryList.innerHTML = '<li><span class="condition-label">Aucune condition</span></li>';
            victorySection?.classList.add('hidden');
        }

        // Conditions de défaite
        if (defeat && Object.keys(defeat).length > 0) {
            defeatList.innerHTML = this.renderConditionsHTML(defeat, 'defeat');
            defeatSection?.classList.remove('hidden');
        } else {
            defeatList.innerHTML = '<li><span class="condition-label">Aucune condition</span></li>';
            defeatSection?.classList.add('hidden');
        }
    }

    /**
     * Génère le HTML pour afficher les conditions (supporte $and/$or récursif)
     * @param {object} conditions - Objet de conditions
     * @param {string} type - 'victory' ou 'defeat'
     * @returns {string} HTML
     */
    renderConditionsHTML(conditions, type) {
        if (!conditions) return '';

        let html = '';

        for (const [key, value] of Object.entries(conditions)) {
            if (key === '$and') {
                // Groupe ET
                html += `<li class="condition-group condition-and">
                    <span class="group-label">Toutes ces conditions (ET):</span>
                    <ul>${value.map(sub => this.renderConditionsHTML(sub, type, 'and')).join('')}</ul>
                </li>`;
            } else if (key === '$or') {
                // Groupe OU
                html += `<li class="condition-group condition-or">
                    <span class="group-label">Une de ces conditions (OU):</span>
                    <ul>${value.map(sub => this.renderConditionsHTML(sub, type, 'or')).join('')}</ul>
                </li>`;
            } else {
                // Condition simple
                html += this.renderSimpleCondition(key, value, type);
            }
        }

        return html;
    }

    /**
     * Génère le HTML pour une condition simple
     */
    renderSimpleCondition(key, value, type) {
        const label = this.getConditionLabel(key);
        const current = this.getConditionCurrentValue(key);
        const { target, comparison } = this.parseConditionValue(value, type);
        const status = this.getConditionStatus(current, target, comparison, type);

        return `<li>
            <span class="condition-label">${label}</span>
            <span class="condition-value ${status}">${current.toLocaleString()} / ${target.toLocaleString()} ${comparison}</span>
        </li>`;
    }

    /**
     * Retourne le libellé lisible d'une condition
     */
    getConditionLabel(key) {
        const labels = {
            population: '👥 Population',
            money: '💰 Argent',
            birds: '🐦 Oiseaux',
            mood: '😊 Humeur',
            peasants: '🧑‍🌾 Paysans',
            food: '🍞 Nourriture',
            water: '💧 Eau',
            wood: '🪵 Bois',
            stone: '🪨 Pierre',
            sand: '🏖️ Sable',
            dirt: '🟤 Terre',
            clay: '🧱 Argile',
            hut: '🛖 Huttes',
            house: '🏠 Maisons',
            well: '🪣 Puits',
            field: '🌾 Champs',
            aviary: '🕊️ Volières',
            farm: '🏡 Fermes'
        };
        return labels[key] || key;
    }

    /**
     * Récupère la valeur actuelle d'une condition
     */
    getConditionCurrentValue(key) {
        if (!this.state) return 0;

        if (key === 'population') return this.state.population || 0;
        if (key === 'money') return this.state.money || 0;
        if (key === 'birds') return this.state.birds || 0;
        if (key === 'mood') return this.state.mood || 0;
        if (key === 'peasants') return this.state.availablePeasants || 0;
        if (this.state.resources?.[key] !== undefined) return this.state.resources[key];
        if (this.state.consumables?.[key] !== undefined) return this.state.consumables[key];
        if (this.state.buildings?.[key] !== undefined) return this.state.buildings[key];

        return 0;
    }

    /**
     * Parse la valeur d'une condition pour extraire la cible et le type de comparaison
     */
    parseConditionValue(value, type) {
        // Format simple: { population: 10000 }
        if (typeof value === 'number') {
            return {
                target: value,
                comparison: type === 'victory' ? '≥' : '≤'
            };
        }

        // Format objet: { min: X } ou { max: X }
        if (typeof value === 'object') {
            if (value.min !== undefined) {
                return { target: value.min, comparison: '≥' };
            }
            if (value.max !== undefined) {
                return { target: value.max, comparison: '≤' };
            }
        }

        return { target: 0, comparison: '=' };
    }

    /**
     * Détermine le statut CSS d'une condition
     */
    getConditionStatus(current, target, comparison, type) {
        if (type === 'victory') {
            // Victoire : on veut atteindre/dépasser
            if (comparison === '≥' && current >= target) return 'completed';
            if (comparison === '≤' && current <= target) return 'completed';
            // Proche de l'objectif (80%+)
            if (comparison === '≥' && current >= target * 0.8) return 'pending';
            return 'pending';
        } else {
            // Défaite : on veut éviter
            if (comparison === '≤' && current <= target) return 'danger';
            if (comparison === '≥' && current >= target) return 'danger';
            // Zone dangereuse (proche de la limite)
            if (comparison === '≤' && current <= target * 1.5) return 'pending';
            return 'completed';
        }
    }

    /**
     * Démarre la musique de menu avec playlist
     * Gère le cas où l'autoplay est bloqué par le navigateur
     */
    startMenuMusic() {
        if (this.menuMusicPlaying) return;

        this.menuTracks = [
            new Audio('./assets/music/menu-theme-1.mp3'),
            new Audio('./assets/music/menu-theme-2.mp3')
        ];

        this.menuTracks.forEach(track => {
            track.volume = 1.0;
            track.addEventListener('ended', () => this.playNextMenuTrack());
        });

        // Appliquer les paramètres audio sauvegardés
        if (window.settings) {
            window.settings.applySettings();
        }

        this.currentMenuTrackIndex = 0;
        this.menuMusicPlaying = true;

        this.menuTracks[0].play().catch(() => {
            // Autoplay bloqué: attendre une interaction utilisateur
            console.log('Lecture audio menu bloquée, en attente d\'interaction utilisateur');
            const startOnInteraction = () => {
                if (this.menuMusicPlaying) {
                    this.menuTracks[0].play();
                }
                document.removeEventListener('click', startOnInteraction);
            };
            document.addEventListener('click', startOnInteraction);
        });
    }

    /**
     * Passe à la piste de menu suivante
     */
    playNextMenuTrack() {
        if (!this.menuMusicPlaying) return;
        this.currentMenuTrackIndex = (this.currentMenuTrackIndex + 1) % this.menuTracks.length;
        this.menuTracks[this.currentMenuTrackIndex].play();
    }

    /**
     * Arrête la musique de menu
     */
    stopMenuMusic() {
        if (!this.menuMusicPlaying) return;

        this.menuTracks.forEach(track => {
            track.pause();
            track.currentTime = 0;
        });
        this.menuMusicPlaying = false;
    }

    /**
     * Démarre la musique de jeu avec playlist
     */
    startGameMusic() {
        if (this.musicPlaying) return;

        this.musicTracks = [
            new Audio('./assets/music/game-theme-1.mp3'),
            new Audio('./assets/music/game-theme-2.mp3')
        ];

        this.musicTracks.forEach(track => {
            track.volume = 1.0;
            track.addEventListener('ended', () => this.playNextTrack());
        });

        // Appliquer les paramètres audio sauvegardés
        if (window.settings) {
            window.settings.applySettings();
        }

        this.currentTrackIndex = 0;
        this.musicPlaying = true;

        this.musicTracks[0].play().catch(() => {
            console.log('Lecture audio bloquée, en attente d\'interaction utilisateur');
            const startOnInteraction = () => {
                this.musicTracks[0].play();
                document.removeEventListener('click', startOnInteraction);
            };
            document.addEventListener('click', startOnInteraction);
        });
    }

    /**
     * Passe à la piste de jeu suivante
     */
    playNextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
        this.musicTracks[this.currentTrackIndex].play();
    }

    /**
     * Arrête la musique de jeu
     */
    stopMusic() {
        if (!this.musicPlaying) return;

        this.musicTracks.forEach(track => {
            track.pause();
            track.currentTime = 0;
        });
        this.musicPlaying = false;
    }

    /**
     * Charge une partie sauvegardée depuis le localStorage
     * Restaure l'état complet incluant village, tâches et statistiques
     */
    loadGame() {
        const saveData = localStorage.getItem('cleopatra_save');
        if (!saveData) {
            this.notifications.error("Aucune sauvegarde trouvée");
            return;
        }

        try {
            const data = JSON.parse(saveData);
            this.state = data.state;

            this.startGame();

            // Restaurer l'état du village
            if (data.villageState) {
                this.villageRenderer.importState(data.villageState);
            } else if (data.grid) {
                // Compatibilité ancien format
                this.villageRenderer.grid = data.grid;
            }

            // Restaurer les tâches de Cléopâtre avec leurs timers
            if (this.cleopatra && data.cleopatraTasks && data.cleopatraTasks.length > 0) {
                const now = Date.now();

                const restoredTasks = data.cleopatraTasks.map(task => {
                    if (task.timeRemainingISO) {
                        task.timeRemaining = this.parseISODuration(task.timeRemainingISO);
                    }
                    task.startTime = now - ((task.timeLimit - task.timeRemaining) * 1000);
                    return task;
                });

                this.cleopatra.activeTasks = restoredTasks;
                this.cleopatra.lastTaskTime = now;
                this.cleopatra.updateTasksDisplay();

                if (restoredTasks.length > 0) {
                    this.notifications.info(`${restoredTasks.length} tâche(s) de Cléopâtre restaurée(s)`);
                }
            }

            // Restaurer l'historique des graphiques
            if (this.statsMenu && data.statsHistory) {
                this.statsMenu.graphHistory = data.statsHistory;
            }

            // Restaurer les multiplicateurs des panneaux
            if (this.panels && data.multipliers) {
                if (data.multipliers.build !== undefined) {
                    this.panels.setBuildMultiplier(data.multipliers.build);
                }
                if (data.multipliers.gather !== undefined) {
                    this.panels.setGatherMultiplier(data.multipliers.gather);
                }
            }

            this.notifications.success("Partie chargée !");
        } catch (e) {
            this.notifications.error("Erreur lors du chargement");
            console.error(e);
        }
    }

    /**
     * Sauvegarde la partie dans le localStorage
     * Inclut l'état complet, le village, les tâches et les préférences
     */
    saveGame() {
        const tasksToSave = this.cleopatra ? this.cleopatra.activeTasks.map(task => ({
            ...task,
            timeRemainingISO: this.toISODuration(task.timeRemaining)
        })) : [];

        const saveData = {
            state: this.state,
            villageState: this.villageRenderer ? this.villageRenderer.exportState() : null,
            cleopatraTasks: tasksToSave,
            statsHistory: this.statsMenu ? this.statsMenu.graphHistory : null,
            multipliers: this.panels ? {
                build: this.panels.buildMultiplier,
                gather: this.panels.gatherMultiplier
            } : null,
            savedAt: Date.now()
        };

        localStorage.setItem('cleopatra_save', JSON.stringify(saveData));
        this.notifications.success("Partie sauvegardée !");

        const loadBtn = document.getElementById('loadBtn');
        if (loadBtn) loadBtn.disabled = false;
    }

    /**
     * Affiche le menu principal et met le jeu en pause
     */
    showMenu() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.gameLoop) {
                cancelAnimationFrame(this.gameLoop);
            }
        }

        // Reset complet du scénario (cache l'overlay et réinitialise l'état)
        this.scenario?.reset();

        this.stopMusic();
        this.startMenuMusic();
        this.screens.show('mainMenu');
    }

    /**
     * Affiche l'écran du guide
     */
    showGuide() {
        this.screens.show('guideScreen');
        this.renderGuide();
    }

    /**
     * Ferme le guide et reprend le jeu si en cours
     */
    closeGuide() {
        if (this.state.startTime) {
            this.screens.show('gameScreen');
            if (!this.isRunning && this.state.startTime) {
                this.isRunning = true;
                this.lastTime = performance.now();
                this.gameLoop = requestAnimationFrame((time) => this.update(time));
            }
        } else {
            this.screens.show('mainMenu');
        }
    }

    /**
     * Charge et affiche le contenu du guide depuis GUIDE.md
     */
    async renderGuide() {
        const container = document.getElementById('guideContent');
        if (!container) return;

        try {
            const response = await fetch('./GUIDE.md');
            if (!response.ok) {
                throw new Error('Impossible de charger le guide');
            }
            const markdown = await response.text();
            let html = this.parseMarkdown(markdown);
            container.innerHTML = html;
        } catch (error) {
            console.error('Erreur lors du chargement du guide:', error);
            container.innerHTML = '<p>Erreur lors du chargement du guide. Veuillez réessayer.</p>';
        }
    }

    /**
     * Parse le markdown en HTML
     * Supporte: titres, listes, tableaux, gras, italique, code
     * @param {string} markdown - Contenu markdown brut
     * @returns {string} HTML généré
     */
    parseMarkdown(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inTable = false;
        let inList = false;
        let inParagraph = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Ignorer les lignes de séparation de tableau
            if (/^\|[\s\-:|]+$/.test(line) && line.includes('--')) {
                continue;
            }

            // Tableaux
            if (line.startsWith('|') && line.endsWith('|')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }

                const cells = line.split('|').filter(c => c.trim());

                if (!inTable) {
                    html += '<table><thead><tr>';
                    html += cells.map(c => `<th>${this.parseInline(c.trim())}</th>`).join('');
                    html += '</tr></thead><tbody>';
                    inTable = true;
                } else {
                    html += '<tr>';
                    html += cells.map(c => `<td>${this.parseInline(c.trim())}</td>`).join('');
                    html += '</tr>';
                }
                continue;
            } else if (inTable) {
                html += '</tbody></table>';
                inTable = false;
            }

            // Titres (h1-h4)
            if (line.startsWith('#### ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h4>${this.parseInline(line.slice(5))}</h4>`;
                continue;
            }
            if (line.startsWith('### ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h3>${this.parseInline(line.slice(4))}</h3>`;
                continue;
            }
            if (line.startsWith('## ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h2>${this.parseInline(line.slice(3))}</h2>`;
                continue;
            }
            if (line.startsWith('# ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h1>${this.parseInline(line.slice(2))}</h1>`;
                continue;
            }

            // Ligne horizontale
            if (line === '---') {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                html += '<hr>';
                continue;
            }

            // Listes (numérotées ou à puces)
            if (line.match(/^(\d+\.|-)\ /)) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const content = line.replace(/^(\d+\.|-)\s+/, '');
                html += `<li>${this.parseInline(content)}</li>`;
                continue;
            } else if (inList && line.trim() === '') {
                html += '</ul>';
                inList = false;
            }

            // Ligne vide
            if (line.trim() === '') {
                if (inParagraph) {
                    html += '</p>';
                    inParagraph = false;
                }
                continue;
            }

            // Paragraphe
            if (!inParagraph) {
                html += '<p>';
                inParagraph = true;
            } else {
                html += '<br>';
            }
            html += this.parseInline(line);
        }

        // Fermer les éléments ouverts
        if (inTable) html += '</tbody></table>';
        if (inList) html += '</ul>';
        if (inParagraph) html += '</p>';

        return html;
    }

    /**
     * Parse les éléments inline du markdown
     * @param {string} text - Texte à parser
     * @returns {string} HTML avec formatage inline
     */
    parseInline(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    }

    /**
     * Boucle de mise à jour principale du jeu
     * Appelée à chaque frame via requestAnimationFrame
     * @param {number} time - Timestamp de la frame courante
     */
    update(time) {
        if (!this.isRunning) return;

        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Limiter le delta pour éviter les sauts après pause/alt-tab
        const dt = Math.min(deltaTime, 0.1);

        this.state.gameTime += dt;

        // Mise à jour des systèmes de jeu
        this.updateProduction(dt);
        this.updateConsumption(dt);
        this.updatePopulationGrowth(dt);
        this.updateConstructions(dt);
        this.updateGathering(dt);

        if (this.cleopatra) {
            this.cleopatra.update(dt);
        }

        if (this.statistics) {
            this.statistics.update(dt);
        }

        if (this.statsMenu) {
            this.statsMenu.update();
        }

        if (this.villageRenderer) {
            this.villageRenderer.update(dt);
            this.villageRenderer.render();
        }

        // Mise à jour du système de scénarios
        if (this.scenario) {
            this.scenario.update(dt);
        }

        // Envoi automatique de messages à César si conditions réunies
        this.autoSendMessages();

        this.updateUI();

        // Vérifier victoire seulement si le scénario ne gère pas
        if (!this.scenario?.isActive) {
            this.checkVictory();
        }

        this.gameLoop = requestAnimationFrame((t) => this.update(t));
    }

    /**
     * Met à jour la production automatique des bâtiments
     * Parcourt tous les bâtiments et applique leurs effets de production
     * @param {number} dt - Delta time en secondes
     */
    updateProduction(dt) {
        // Ne pas mettre à jour si la production est en pause
        if (this.scenario?.isSystemPaused('production')) return;

        const perSecondFactor = dt / 60;

        for (const [buildingId, count] of Object.entries(this.state.buildings)) {
            if (count <= 0) continue;

            const building = BUILDINGS[buildingId];
            if (!building?.effects) continue;

            const effects = building.effects;

            if (effects.foodPerMinute) {
                this.state.food += count * effects.foodPerMinute * perSecondFactor;
            }
            if (effects.waterPerMinute) {
                this.state.water += count * effects.waterPerMinute * perSecondFactor;
            }
            if (effects.moneyPerMinute) {
                this.state.money += count * effects.moneyPerMinute * perSecondFactor;
            }
            if (effects.woodPerMinute) {
                this.state.resources.wood += count * effects.woodPerMinute * perSecondFactor;
            }
            if (effects.stonePerMinute) {
                this.state.resources.stone += count * effects.stonePerMinute * perSecondFactor;
            }
        }

        // Production d'oiseaux (cas spécial avec capacité limitée)
        const aviaries = this.state.buildings['aviary'] || 0;
        if (aviaries > 0) {
            const birdsPerSecond = aviaries / 180;
            this.state.birds = Math.min(
                this.state.birds + birdsPerSecond * dt,
                aviaries
            );
        }
    }

    /**
     * Met à jour la consommation (système de rations périodiques)
     * Les paysans consomment nourriture et eau toutes les X secondes
     * @param {number} dt - Delta time en secondes
     */
    updateConsumption(dt) {
        // Ne pas mettre à jour si la consommation est en pause
        if (this.scenario?.isSystemPaused('consumption')) return;

        this.state.rationTimer -= dt;

        // Avertissement proche de la distribution
        if (this.state.rationTimer <= RATION_CONFIG.warningThreshold && !this.state.rationWarningShown) {
            this.state.rationWarningShown = true;
            this.notifications.warning("Les paysans auront bientôt besoin de rations !");
        }

        // Distribution des rations
        if (this.state.rationTimer <= 0) {
            this.distributeRations();
            this.state.rationTimer = RATION_CONFIG.interval;
            this.state.rationWarningShown = false;
        }

        // Vérifier la famine (plus de ressources)
        if (this.state.food <= 0 && this.state.water <= 0) {
            if (this.state.availablePeasants > 0) {
                this.notifications.warning("Vos paysans ont faim et soif ! Ils ne peuvent plus travailler.");
                this.state.availablePeasants = 0;
            }
        } else {
            this.state.availablePeasants = this.state.totalPeasants - this.getWorkingPeasants();
        }
    }

    /**
     * Distribue les rations aux paysans
     * Prélève nourriture et eau proportionnellement au nombre de paysans
     */
    distributeRations() {
        const peasants = this.state.totalPeasants;

        const foodNeeded = peasants * CONSUMABLES.food.consumptionPerPeasant;
        const waterNeeded = peasants * CONSUMABLES.water.consumptionPerPeasant;

        const foodTaken = Math.min(this.state.food, foodNeeded);
        const waterTaken = Math.min(this.state.water, waterNeeded);

        this.state.food = Math.max(0, this.state.food - foodTaken);
        this.state.water = Math.max(0, this.state.water - waterTaken);

        if (foodTaken > 0 || waterTaken > 0) {
            this.notifications.info(`Rations distribuées: -${Math.floor(foodTaken)} 🍞 -${Math.floor(waterTaken)} 💧`);
        }

        if (foodTaken < foodNeeded) {
            this.notifications.error(`Pas assez de nourriture ! (${Math.floor(foodNeeded - foodTaken)} 🍞 manquant)`);
        }
        if (waterTaken < waterNeeded) {
            this.notifications.error(`Pas assez d'eau ! (${Math.floor(waterNeeded - waterTaken)} 💧 manquant)`);
        }
    }

    /**
     * Met à jour la croissance naturelle de la population
     * La population augmente si les réserves sont suffisantes
     * @param {number} dt - Delta time en secondes
     */
    updatePopulationGrowth(dt) {
        // Ne pas mettre à jour si la croissance est en pause
        if (this.scenario?.isSystemPaused('growth')) return;

        this.state.growthTimer -= dt;

        if (this.state.growthTimer <= 0) {
            this.state.growthTimer = POPULATION_GROWTH_CONFIG.growthInterval;

            // Vérifier les réserves minimales
            if (this.state.food < POPULATION_GROWTH_CONFIG.minFoodReserve ||
                this.state.water < POPULATION_GROWTH_CONFIG.minWaterReserve) {
                return;
            }

            // Calculer le bonus de logement
            const houses = this.state.buildings['house'] || 0;
            const villas = this.state.buildings['villa'] || 0;
            const inns = this.state.buildings['inn'] || 0;
            const baths = this.state.buildings['baths'] || 0;
            const gardens = this.state.buildings['gardens'] || 0;

            const housingBonus = 1 + (houses * 0.1) + (villas * 0.2) + (inns * 0.05) + (baths * 0.15) + (gardens * 0.25);

            // Calculer la croissance
            const baseGrowth = POPULATION_GROWTH_CONFIG.baseGrowthRate * (POPULATION_GROWTH_CONFIG.growthInterval / 60);
            let growth = Math.floor(baseGrowth * housingBonus * this.state.population / 100);
            growth = Math.max(1, Math.min(growth, POPULATION_GROWTH_CONFIG.maxGrowthPerTick));

            // Ajuster selon les ressources disponibles
            const maxByFood = Math.floor((this.state.food - POPULATION_GROWTH_CONFIG.minFoodReserve) / POPULATION_GROWTH_CONFIG.foodPerNewHabitant);
            const maxByWater = Math.floor((this.state.water - POPULATION_GROWTH_CONFIG.minWaterReserve) / POPULATION_GROWTH_CONFIG.waterPerNewHabitant);
            growth = Math.min(growth, maxByFood, maxByWater);

            if (growth > 0) {
                this.state.food -= growth * POPULATION_GROWTH_CONFIG.foodPerNewHabitant;
                this.state.water -= growth * POPULATION_GROWTH_CONFIG.waterPerNewHabitant;
                this.state.population += growth;
                this.notifications.info(`Croissance naturelle: +${growth} 👥 habitants`);
            }
        }
    }

    /**
     * Met à jour les constructions en cours
     * @param {number} dt - Delta time en secondes
     */
    updateConstructions(dt) {
        // Ne pas mettre à jour si les constructions sont en pause
        if (this.scenario?.isSystemPaused('constructions')) return;

        const completedIndices = [];

        this.state.constructions.forEach((construction, index) => {
            construction.elapsed += dt;
            if (construction.elapsed >= construction.totalTime) {
                completedIndices.push(index);
            }
        });

        // Traiter les constructions terminées (en ordre inverse pour éviter les problèmes d'index)
        completedIndices.reverse().forEach(index => {
            const construction = this.state.constructions[index];
            this.completeConstruction(construction);
            this.state.constructions.splice(index, 1);
        });
    }

    /**
     * Termine une construction et applique ses effets
     * @param {object} construction - Objet construction terminée
     */
    completeConstruction(construction) {
        const building = BUILDINGS[construction.buildingId];

        // Ajouter le bâtiment au compteur
        if (!this.state.buildings[construction.buildingId]) {
            this.state.buildings[construction.buildingId] = 0;
        }
        this.state.buildings[construction.buildingId]++;
        this.state.buildingsBuilt++;

        // Finaliser sur la grille visuelle
        if (this.villageRenderer && construction.position) {
            if (construction.position.uid !== undefined) {
                this.villageRenderer.finishBuilding(construction.position.uid);
            } else {
                this.villageRenderer.finishBuilding(construction.position.x, construction.position.y);
            }
        }

        // Libérer les paysans
        this.state.availablePeasants += construction.peasantsUsed;

        // Appliquer les effets du bâtiment
        if (building.effects.population) {
            this.state.population += building.effects.population;
        }
        if (building.effects.peasants) {
            this.state.totalPeasants += building.effects.peasants;
            this.state.availablePeasants += building.effects.peasants;
        }

        // Récompense
        this.state.money += building.reward;

        this.notifications.success(`${building.name} construit ! +${building.reward} 💰`);
    }

    /**
     * Met à jour les tâches de collecte en cours
     * @param {number} dt - Delta time en secondes
     */
    updateGathering(dt) {
        // Ne pas mettre à jour si les collectes sont en pause
        if (this.scenario?.isSystemPaused('gathering')) return;

        const completedIndices = [];

        this.state.gatheringTasks.forEach((task, index) => {
            task.elapsed += dt;
            if (task.elapsed >= task.totalTime) {
                completedIndices.push(index);
            }
        });

        completedIndices.reverse().forEach(index => {
            const task = this.state.gatheringTasks[index];
            this.completeGathering(task);
            this.state.gatheringTasks.splice(index, 1);
        });
    }

    /**
     * Termine une collecte et ajoute les ressources
     * @param {object} task - Tâche de collecte terminée
     */
    completeGathering(task) {
        const resource = RESOURCES[task.resourceId];

        this.state.resources[task.resourceId] += resource.gatherAmount;
        this.state.availablePeasants++;

        this.notifications.success(`+${resource.gatherAmount} ${resource.icon} ${resource.name}`);
    }

    /**
     * Met à jour l'interface utilisateur (barre de ressources, panneaux)
     * Optimisé pour ne modifier le DOM que si les valeurs ont changé
     */
    updateUI() {
        // Cache des éléments DOM pour éviter les querySelectorById répétés
        if (!this._uiElements) {
            this._uiElements = {
                money: document.getElementById('moneyDisplay'),
                food: document.getElementById('foodDisplay'),
                water: document.getElementById('waterDisplay'),
                population: document.getElementById('populationDisplay'),
                peasants: document.getElementById('peasantsDisplay'),
                rationTimer: document.getElementById('rationTimerDisplay'),
                growthTimer: document.getElementById('growthTimerDisplay')
            };
        }

        const els = this._uiElements;

        // Mettre à jour seulement si la valeur a changé
        const newMoney = `💰 ${Math.floor(this.state.money)}`;
        if (els.money && els.money.textContent !== newMoney) {
            els.money.textContent = newMoney;
        }

        const newFood = `🍞 ${Math.floor(this.state.food)}`;
        if (els.food && els.food.textContent !== newFood) {
            els.food.textContent = newFood;
        }

        const newWater = `💧 ${Math.floor(this.state.water)}`;
        if (els.water && els.water.textContent !== newWater) {
            els.water.textContent = newWater;
        }

        const newPopulation = `👥 ${Math.floor(this.state.population)}`;
        if (els.population && els.population.textContent !== newPopulation) {
            els.population.textContent = newPopulation;
        }

        const newPeasants = `🧑‍🌾 ${this.state.availablePeasants}/${this.state.totalPeasants}`;
        if (els.peasants && els.peasants.textContent !== newPeasants) {
            els.peasants.textContent = newPeasants;
        }

        // Timer des rations
        if (els.rationTimer) {
            const timer = Math.max(0, this.state.rationTimer);
            const minutes = Math.floor(timer / 60);
            const seconds = Math.floor(timer % 60);
            const newRationTimer = `🍽️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (els.rationTimer.textContent !== newRationTimer) {
                els.rationTimer.textContent = newRationTimer;
            }

            const shouldWarn = timer <= RATION_CONFIG.warningThreshold;
            if (els.rationTimer.classList.contains('warning') !== shouldWarn) {
                els.rationTimer.classList.toggle('warning', shouldWarn);
            }
        }

        // Timer de croissance de la population
        if (els.growthTimer) {
            const growthTime = Math.max(0, this.state.growthTimer);
            const growthMinutes = Math.floor(growthTime / 60);
            const growthSeconds = Math.floor(growthTime % 60);
            const newGrowthTimer = `📈 ${growthMinutes}:${growthSeconds.toString().padStart(2, '0')}`;
            if (els.growthTimer.textContent !== newGrowthTimer) {
                els.growthTimer.textContent = newGrowthTimer;
            }
        }

        if (this.panels) {
            this.panels.refresh();
        }
    }

    /**
     * Vérifie les conditions de victoire
     */
    checkVictory() {
        const victoryConfig = this.config.victory;
        if (!victoryConfig) return;

        if (victoryConfig.population && this.state.population >= victoryConfig.population) {
            this.victory();
        }
    }

    /**
     * Callback appelé quand le scénario se termine en victoire
     */
    onScenarioVictory() {
        this.victory();
    }

    /**
     * Callback appelé quand le scénario se termine en défaite
     */
    onScenarioDefeat() {
        this.gameOver("Vous avez échoué dans votre mission...");
    }

    /**
     * Déclenche l'écran de victoire
     */
    victory() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        const duration = Math.floor((Date.now() - this.state.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        // Message de victoire dynamique selon l'objectif du scénario
        const victoryMessage = document.getElementById('victoryMessage');
        if (victoryMessage) {
            const victory = this.config.victory;
            if (victory?.population) {
                victoryMessage.textContent = `Félicitations ! Votre village compte maintenant ${victory.population.toLocaleString('fr-FR')} habitants !`;
            } else {
                victoryMessage.textContent = 'Félicitations ! Vous avez atteint l\'objectif !';
            }
        }

        document.getElementById('victoryStats').innerHTML = `
            <p>Temps de jeu: ${minutes}m ${seconds}s</p>
            <p>Bâtiments construits: ${this.state.buildingsBuilt}</p>
            <p>Population finale: ${Math.floor(this.state.population)}</p>
            <p>Or accumulé: ${Math.floor(this.state.money)}</p>
        `;

        this.createEndScreenSprite('victorySprite', 'happy');
        this.screens.show('victoryScreen');
    }

    /**
     * Déclenche l'écran de game over
     * @param {string} reason - Raison du game over à afficher
     */
    gameOver(reason) {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        const messageEl = document.getElementById('gameOverMessage');
        if (messageEl) {
            messageEl.textContent = reason;
        }

        this.createEndScreenSprite('gameOverSprite', 'angry');
        this.screens.show('gameOverScreen');
    }

    /**
     * Crée un sprite Cléopâtre grand format pour les écrans de fin
     * @param {string} containerId - ID du conteneur DOM
     * @param {string} mood - 'happy' ou 'angry'
     */
    createEndScreenSprite(containerId, mood) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        import('../systems/cleopatra-sprite.js').then(module => {
            const CleopatraSprite = module.default;
            const sprite = new CleopatraSprite(container, {
                width: 200,
                height: 250,
                scale: 2.5,
                persistentEffects: true
            });

            if (mood === 'happy') {
                sprite.currentMood = 'happy';
                sprite.playAnimation('happy', 999999);
            } else if (mood === 'angry') {
                sprite.currentMood = 'angry';
                sprite.playAnimation('angry', 999999);
            }
        });
    }

    /**
     * Vérifie si un bâtiment peut être construit
     * @param {string} buildingId - ID du bâtiment
     * @returns {boolean} true si construction possible
     */
    canBuild(buildingId) {
        const building = BUILDINGS[buildingId];
        if (!building) return false;

        const scaledCost = this.getScaledBuildingCost(buildingId);

        if (this.state.money < scaledCost.money) return false;
        if (scaledCost.wood && this.state.resources.wood < scaledCost.wood) return false;
        if (scaledCost.stone && this.state.resources.stone < scaledCost.stone) return false;
        if (scaledCost.sand && this.state.resources.sand < scaledCost.sand) return false;
        if (scaledCost.dirt && this.state.resources.dirt < scaledCost.dirt) return false;
        if (scaledCost.clay && this.state.resources.clay < scaledCost.clay) return false;
        if (scaledCost.water && this.state.water < scaledCost.water) return false;
        if (this.state.availablePeasants < 1) return false;

        const builtCount = this.state.buildings[buildingId] || 0;
        const pendingCount = this.state.constructions.filter(c => c.buildingId === buildingId).length;
        if (builtCount + pendingCount >= building.maxCount) return false;

        return true;
    }

    /**
     * Démarre la construction d'un bâtiment
     * @param {string} buildingId - ID du bâtiment à construire
     */
    startBuilding(buildingId) {
        if (!this.canBuild(buildingId)) {
            this.notifications.error("Construction impossible !");
            return;
        }

        const building = BUILDINGS[buildingId];
        const scaledCost = this.getScaledBuildingCost(buildingId);

        // Déduire les coûts
        this.state.money -= scaledCost.money;
        if (scaledCost.wood) this.state.resources.wood -= scaledCost.wood;
        if (scaledCost.stone) this.state.resources.stone -= scaledCost.stone;
        if (scaledCost.sand) this.state.resources.sand -= scaledCost.sand;
        if (scaledCost.dirt) this.state.resources.dirt -= scaledCost.dirt;
        if (scaledCost.clay) this.state.resources.clay -= scaledCost.clay;
        if (scaledCost.water) this.state.water -= scaledCost.water;

        this.state.availablePeasants--;

        // Placer sur la grille
        let position = null;
        if (this.villageRenderer) {
            position = this.villageRenderer.placeBuilding(buildingId);
        }

        this.state.constructions.push({
            buildingId: buildingId,
            totalTime: Math.ceil(building.buildTime * this.config.constructionTimeMultiplier),
            elapsed: 0,
            peasantsUsed: 1,
            position: position
        });

        this.notifications.success(`Construction de ${building.name} commencée !`);
    }

    /**
     * Envoie un paysan chercher des ressources
     * @param {string} resourceId - ID de la ressource à collecter
     */
    gatherResource(resourceId) {
        const resource = RESOURCES[resourceId];

        if (this.state.money < resource.gatherCost) {
            this.notifications.error("Pas assez d'argent !");
            return;
        }

        if (this.state.availablePeasants < 1) {
            this.notifications.error("Aucun paysan disponible !");
            return;
        }

        this.state.money -= resource.gatherCost;
        this.state.availablePeasants--;

        this.state.gatheringTasks.push({
            resourceId: resourceId,
            totalTime: resource.gatherTime,
            elapsed: 0
        });

        this.notifications.success(`Un paysan part chercher du ${resource.name}`);
    }

    /**
     * Envoie un message à César (nécessite volière + mission active + oiseau + or)
     * @returns {boolean} true si message envoyé avec succès
     */
    sendMessageToCaesar() {
        if (!this.hasBuilding('aviary')) {
            this.notifications.error("Construisez d'abord une volière !");
            return false;
        }

        if (!this.hasActiveMessageTask()) {
            this.notifications.error("Aucune mission de message en cours !");
            return false;
        }

        if (this.state.birds < 1) {
            this.notifications.error("Aucun oiseau disponible ! La volière en produit.");
            return false;
        }

        const cost = this.getMessageCost();
        if (this.state.money < cost) {
            this.notifications.error(`Il faut ${cost} pièces pour envoyer un message !`);
            return false;
        }

        this.state.birds--;
        this.state.money -= cost;
        this.state.messagesSentToCaesar = (this.state.messagesSentToCaesar || 0) + 1;

        // Marquer la première tâche de message active comme complétée
        const messageTask = this.cleopatra?.activeTasks.find(t => t.type === 'message' && !t.messageCompleted);
        if (messageTask) {
            messageTask.messageCompleted = true;
        }

        this.notifications.success(`Un oiseau s'envole vers Rome... 🕊️ (-${cost} 💰)`);
        return true;
    }

    /**
     * Envoie automatiquement des messages à César si les conditions sont réunies
     * Conditions: mode auto activé, volière construite, mission active, oiseau disponible, assez d'or
     * Délai minimum de 1 seconde entre chaque envoi
     */
    autoSendMessages() {
        // Vérifier si le mode auto est activé
        if (!this.state.autoSendResources) return;

        // Vérifier le délai depuis le dernier envoi (1 seconde minimum)
        const now = this.state.gameTime;
        if (this.lastAutoMessageTime && (now - this.lastAutoMessageTime) < 1) return;

        // Vérifier si on a une volière
        if (!this.hasBuilding('aviary')) return;

        // Vérifier si on a une mission de message active (non complétée)
        const uncompletedTask = this.cleopatra?.activeTasks.find(t => t.type === 'message' && !t.messageCompleted);
        if (!uncompletedTask) return;

        // Vérifier si on a des oiseaux
        if (this.state.birds < 1) return;

        // Vérifier si on a assez d'argent
        const cost = this.getMessageCost();
        if (this.state.money < cost) return;

        // Envoyer le message
        this.state.birds--;
        this.state.money -= cost;
        this.state.messagesSentToCaesar = (this.state.messagesSentToCaesar || 0) + 1;
        this.lastAutoMessageTime = now;

        // Marquer cette tâche spécifique comme complétée
        uncompletedTask.messageCompleted = true;

        this.notifications.success(`Un oiseau s'envole vers Rome... 🕊️ (-${cost} 💰)`);
    }

    /**
     * Obtient le nombre de bâtiments d'un type
     * @param {string} buildingId - ID du bâtiment
     * @returns {number} Nombre de bâtiments construits
     */
    getBuildingCount(buildingId) {
        return this.state.buildings[buildingId] || 0;
    }

    /**
     * Vérifie si au moins un bâtiment d'un type existe
     * @param {string} buildingId - ID du bâtiment
     * @returns {boolean} true si au moins un existe
     */
    hasBuilding(buildingId) {
        return this.getBuildingCount(buildingId) > 0;
    }

    /**
     * Calcule le coût scalé d'un bâtiment selon le nombre déjà construit
     * Utilise une formule logarithmique: coût_base * facteur^nombre_existants
     * @param {string} buildingId - ID du bâtiment
     * @returns {object} Coûts ajustés (money fixe, ressources scalées)
     */
    getScaledBuildingCost(buildingId) {
        const building = BUILDINGS[buildingId];
        if (!building) return null;

        const count = this.getBuildingCount(buildingId);
        const pendingCount = this.state.constructions.filter(c => c.buildingId === buildingId).length;
        const totalCount = count + pendingCount;

        const multiplier = Math.pow(SCALING_CONFIG.buildingCostFactor, totalCount);

        // L'or reste fixe, les ressources augmentent
        const scaledCost = { ...building.cost };
        if (scaledCost.wood) scaledCost.wood = Math.ceil(building.cost.wood * multiplier);
        if (scaledCost.stone) scaledCost.stone = Math.ceil(building.cost.stone * multiplier);
        if (scaledCost.sand) scaledCost.sand = Math.ceil(building.cost.sand * multiplier);
        if (scaledCost.dirt) scaledCost.dirt = Math.ceil(building.cost.dirt * multiplier);
        if (scaledCost.clay) scaledCost.clay = Math.ceil(building.cost.clay * multiplier);
        if (scaledCost.water) scaledCost.water = Math.ceil(building.cost.water * multiplier);

        return scaledCost;
    }

    /**
     * Calcule le coût en or pour envoyer un message à César
     * Augmente exponentiellement avec le nombre de messages envoyés
     * @returns {number} Coût en or
     */
    getMessageCost() {
        const messagesSent = this.state.messagesSentToCaesar || 0;
        return Math.ceil(SCALING_CONFIG.baseMessageCost * Math.pow(SCALING_CONFIG.messageCostFactor, messagesSent));
    }

    /**
     * Vérifie si une tâche de message à César est active et non complétée
     * @returns {boolean} true si une mission message est en cours et pas encore complétée
     */
    hasActiveMessageTask() {
        if (!this.cleopatra) return false;
        return this.cleopatra.activeTasks.some(task => task.type === 'message' && !task.messageCompleted);
    }

    /**
     * Obtient le nombre de paysans actuellement au travail
     * @returns {number} Nombre de paysans occupés
     */
    getWorkingPeasants() {
        let working = 0;
        working += this.state.constructions.length;
        working += this.state.gatheringTasks.length;
        return working;
    }

    /**
     * Ajoute de l'argent à l'état
     * @param {number} amount - Montant à ajouter
     */
    addMoney(amount) {
        this.state.money += amount;
    }

    /**
     * Affiche les informations d'un bâtiment dans le panneau latéral
     * @param {number|string|object} buildingRef - UID, buildingId ou objet avec .id
     */
    showBuildingInfo(buildingRef) {
        const panel = document.getElementById('sidePanel');
        const content = document.getElementById('sidePanelContent');
        if (!panel || !content) return;

        let placedBuilding = null;
        let building = null;

        if (typeof buildingRef === 'number') {
            placedBuilding = this.villageRenderer?.getBuildingByUid(buildingRef);
            if (placedBuilding) {
                building = BUILDINGS[placedBuilding.buildingId];
            }
        } else if (typeof buildingRef === 'string') {
            building = BUILDINGS[buildingRef];
        } else if (buildingRef && buildingRef.id) {
            building = BUILDINGS[buildingRef.id];
        }

        if (!building) return;

        const instanceInfo = placedBuilding ? `
            <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px;">
                <p style="margin: 0; font-size: 0.9rem; color: #888;">
                    📍 Position: (${placedBuilding.x}, ${placedBuilding.y})<br>
                    🔧 Niveau: ${placedBuilding.level}<br>
                    ⚡ Efficacité: ${Math.round(placedBuilding.efficiency * 100)}%
                    ${placedBuilding.constructing ? '<br>🏗️ <span style="color: #ffa500;">En construction</span>' : ''}
                </p>
            </div>
        ` : '';

        const effectsHtml = [];
        const e = building.effects;

        if (e.population) effectsHtml.push(`<li>👥 +${e.population} habitants</li>`);
        if (e.peasants) effectsHtml.push(`<li>🧑‍🌾 +${e.peasants} paysans</li>`);
        if (e.foodPerMinute) effectsHtml.push(`<li>🍞 +${e.foodPerMinute} nourriture/min</li>`);
        if (e.waterPerMinute) effectsHtml.push(`<li>💧 +${e.waterPerMinute} eau/min</li>`);
        if (e.moneyPerMinute) effectsHtml.push(`<li>💰 +${e.moneyPerMinute} or/min</li>`);
        if (e.woodPerMinute) effectsHtml.push(`<li>🪵 +${e.woodPerMinute} bois/min</li>`);
        if (e.stonePerMinute) effectsHtml.push(`<li>🪨 +${e.stonePerMinute} pierre/min</li>`);
        if (e.foodStorage) effectsHtml.push(`<li>📦 +${e.foodStorage} stockage nourriture</li>`);
        if (e.enableMessages) effectsHtml.push(`<li>🕊️ Permet d'envoyer des messages</li>`);
        if (e.growthBonus) effectsHtml.push(`<li>📈 Bonus de croissance</li>`);
        if (e.protection) effectsHtml.push(`<li>🛡️ Protection du village</li>`);
        if (e.cleopatraBonus) effectsHtml.push(`<li>👸 Plaît à Cléopâtre</li>`);

        content.innerHTML = `
            <h3>${building.icon} ${placedBuilding?.customName || building.name}</h3>
            <p>${building.description}</p>
            ${instanceInfo}
            <hr style="border-color: #555; margin: 15px 0;">
            <p><strong>Effets:</strong></p>
            <ul style="list-style: none; padding: 0;">
                ${effectsHtml.join('')}
            </ul>
        `;
        panel.classList.remove('hidden');
    }

    /**
     * Ferme le panneau latéral
     */
    closeSidePanel() {
        const panel = document.getElementById('sidePanel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    /**
     * Initialise les tooltips de survol sur les ressources de la barre supérieure
     */
    initResourceTooltips() {
        const resourceElements = {
            money: document.getElementById('moneyDisplay'),
            food: document.getElementById('foodDisplay'),
            water: document.getElementById('waterDisplay'),
            population: document.getElementById('populationDisplay')
        };

        const tooltip = document.getElementById('tooltip');

        for (const [key, element] of Object.entries(resourceElements)) {
            if (!element) continue;

            element.addEventListener('mouseenter', (e) => {
                this.showResourceTooltip(key, e);
            });

            element.addEventListener('mousemove', (e) => {
                if (tooltip && !tooltip.classList.contains('hidden')) {
                    tooltip.style.left = (e.clientX + 15) + 'px';
                    tooltip.style.top = (e.clientY + 10) + 'px';
                }
            });

            element.addEventListener('mouseleave', () => {
                if (tooltip) {
                    tooltip.classList.add('hidden');
                }
            });
        }
    }

    /**
     * Affiche le tooltip d'une ressource avec statistiques de production/consommation
     * @param {string} resourceKey - Clé de la ressource
     * @param {Event} event - Événement souris
     */
    showResourceTooltip(resourceKey, event) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip || !this.statistics) return;

        const info = this.statistics.getTooltipInfo(resourceKey);
        const names = {
            money: 'Or',
            food: 'Nourriture',
            water: 'Eau',
            population: 'Population'
        };

        let html = `<strong>${names[resourceKey] || resourceKey}</strong><br>`;
        html += `<span style="color: ${info.rate > 0 ? '#4ade80' : info.rate < 0 ? '#ff6b6b' : '#aaa'}">${info.rateText}</span>`;

        if (info.depletionText) {
            html += `<br><span style="color: #ffaa00">${info.depletionText}</span>`;
        }

        if (info.alertLevel !== 'normal') {
            const alertColor = info.alertLevel === 'critical' ? '#ff6b6b' : '#ffaa00';
            const alertText = info.alertLevel === 'critical' ? 'Niveau critique !' : 'Niveau bas';
            html += `<br><span style="color: ${alertColor}; font-weight: bold;">${alertText}</span>`;
        }

        tooltip.innerHTML = html;
        tooltip.classList.remove('hidden');
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY + 10) + 'px';
    }

    /**
     * Initialise le système de sauvegarde automatique
     */
    initAutoSave() {
        const toggle = document.getElementById('autoSaveToggle');
        if (!toggle) return;

        const savedState = localStorage.getItem('cleopatra_autosave_enabled');
        if (savedState === 'true') {
            toggle.checked = true;
            this.enableAutoSave();
        }

        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                this.enableAutoSave();
                this.notifications.info("Sauvegarde automatique activée (toutes les 2 min)");
            } else {
                this.disableAutoSave();
                this.notifications.info("Sauvegarde automatique désactivée");
            }
            localStorage.setItem('cleopatra_autosave_enabled', toggle.checked.toString());
        });
    }

    /**
     * Active la sauvegarde automatique
     */
    enableAutoSave() {
        this.autoSaveEnabled = true;

        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            if (this.isRunning) {
                this.saveGame();
                this.notifications.info("Sauvegarde automatique effectuée");
            }
        }, this.autoSaveDelay * 1000);
    }

    /**
     * Désactive la sauvegarde automatique
     */
    disableAutoSave() {
        this.autoSaveEnabled = false;

        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Convertit des secondes en durée ISO 8601
     * @param {number} seconds - Durée en secondes
     * @returns {string} Durée au format ISO 8601 (ex: "PT1M30S")
     */
    toISODuration(seconds) {
        if (seconds <= 0) return 'PT0S';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        let iso = 'PT';
        if (hours > 0) iso += `${hours}H`;
        if (minutes > 0) iso += `${minutes}M`;
        if (secs > 0 || iso === 'PT') iso += `${secs}S`;

        return iso;
    }

    /**
     * Convertit une durée ISO 8601 en secondes
     * @param {string} iso - Durée au format ISO 8601 (ex: "PT1M30S")
     * @returns {number} Durée en secondes
     */
    parseISODuration(iso) {
        if (!iso || typeof iso !== 'string') return 0;

        const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
        if (!match) return 0;

        const hours = parseInt(match[1] || 0, 10);
        const minutes = parseInt(match[2] || 0, 10);
        const seconds = parseFloat(match[3] || 0);

        return hours * 3600 + minutes * 60 + seconds;
    }
}

export default Game;
