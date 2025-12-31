// ==========================================
// CLASSE PRINCIPALE DU JEU
// ==========================================

import ScreenManager from '../ui/screens.js';
import NotificationManager from '../ui/notifications.js';
import PanelManager from '../ui/panels.js';
import VillageRenderer from '../systems/village-renderer.js';
import CleopatraSystem from '../systems/cleopatra.js';
import StatisticsSystem from '../systems/statistics.js';
import StatsMenu from '../ui/stats-menu.js';
import { BUILDINGS, RESOURCES, CONSUMABLES, RATION_CONFIG, POPULATION_GROWTH_CONFIG } from '../data/index.js';

class Game {
    constructor() {
        // Managers UI
        this.screens = new ScreenManager();
        this.notifications = new NotificationManager();

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

        // Musique
        this.musicTracks = [];
        this.menuTracks = [];
        this.currentTrackIndex = 0;
        this.musicPlaying = false;
        this.menuMusicPlaying = false;

        // Vérifier les sauvegardes
        this.checkSaveGame();

        // Démarrer la musique de menu
        this.startMenuMusic();
    }

    /**
     * Retourne l'état initial du jeu
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

            // Bâtiments construits { buildingId: count }
            buildings: {},

            // Constructions en cours
            constructions: [],

            // Tâches de collecte en cours
            gatheringTasks: [],

            // Messages envoyés à César
            messagesSentToCaesar: 0,

            // Timer des rations
            rationTimer: RATION_CONFIG.interval,
            rationWarningShown: false,

            // Timer de croissance naturelle
            growthTimer: POPULATION_GROWTH_CONFIG.growthInterval,

            // Humeur de Cléopâtre (0-100)
            cleopatraMood: 50,

            // Options
            autoSendResources: false, // Envoi automatique des ressources à Cléopâtre

            // Stats
            startTime: null,
            gameTime: 0, // Temps de jeu en secondes
            buildingsBuilt: 0
        };
    }

    /**
     * Vérifie s'il y a une sauvegarde
     */
    checkSaveGame() {
        const saveData = localStorage.getItem('cleopatra_save');
        const loadBtn = document.getElementById('loadBtn');

        if (saveData && loadBtn) {
            loadBtn.disabled = false;
        }
    }

    /**
     * Nouvelle partie
     */
    newGame() {
        this.screens.show('characterSelect');
    }

    /**
     * Sélectionne le genre du personnage et démarre la partie
     */
    selectCharacter(gender) {
        this.state = this.getInitialState();
        this.state.playerGender = gender;
        this.state.startTime = Date.now();

        this.startGame();
    }

    /**
     * Démarre le jeu
     */
    startGame() {
        this.screens.show('gameScreen');

        // Initialiser les systèmes
        this.villageRenderer = new VillageRenderer(this);
        this.cleopatra = new CleopatraSystem(this);
        this.panels = new PanelManager(this);
        this.statistics = new StatisticsSystem(this);
        this.statsMenu = new StatsMenu(this);

        // Initialiser les tooltips des ressources
        this.initResourceTooltips();

        // Initialiser le switch de sauvegarde automatique
        this.initAutoSave();

        // Initialiser l'affichage de l'humeur
        this.cleopatra.updateMoodDisplay();

        // Démarrer la boucle de jeu
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));

        // Message de bienvenue
        this.notifications.success("Bienvenue dans votre village !");

        // Arrêter la musique de menu et démarrer la musique de jeu
        this.stopMenuMusic();
        this.startGameMusic();
    }

    /**
     * Initialise et démarre la musique de menu
     */
    startMenuMusic() {
        if (this.menuMusicPlaying) return;

        // Créer les éléments audio pour les deux thèmes de menu
        this.menuTracks = [
            new Audio('./assets/menu1.mp3'),
            new Audio('./assets/menu2.mp3')
        ];

        // Configurer chaque piste
        this.menuTracks.forEach(track => {
            track.volume = 0.3;
            track.addEventListener('ended', () => this.playNextMenuTrack());
        });

        // Démarrer la première piste
        this.currentMenuTrackIndex = 0;
        this.menuMusicPlaying = true;
        this.menuTracks[0].play().catch(e => {
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
     * Joue la piste de menu suivante
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
     * Initialise et démarre la musique de jeu
     */
    startGameMusic() {
        if (this.musicPlaying) return;

        // Créer les éléments audio pour les deux thèmes
        this.musicTracks = [
            new Audio('./assets/theme1.mp3'),
            new Audio('./assets/theme2.mp3')
        ];

        // Configurer chaque piste
        this.musicTracks.forEach(track => {
            track.volume = 0.3;
            track.addEventListener('ended', () => this.playNextTrack());
        });

        // Démarrer la première piste
        this.currentTrackIndex = 0;
        this.musicPlaying = true;
        this.musicTracks[0].play().catch(e => {
            console.log('Lecture audio bloquée, en attente d\'interaction utilisateur');
            const startOnInteraction = () => {
                this.musicTracks[0].play();
                document.removeEventListener('click', startOnInteraction);
            };
            document.addEventListener('click', startOnInteraction);
        });
    }

    /**
     * Joue la piste suivante
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
     * Charge une partie sauvegardée
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

            // Restaurer les bâtiments sur la grille
            this.startGame();

            // Restaurer l'état du village (nouveau système avec formes)
            if (data.villageState) {
                this.villageRenderer.importState(data.villageState);
            } else if (data.grid) {
                // Compatibilité avec l'ancien format
                this.villageRenderer.grid = data.grid;
            }

            // Restaurer les tâches de Cléopâtre
            if (this.cleopatra && data.cleopatraTasks && data.cleopatraTasks.length > 0) {
                const now = Date.now();

                // Restaurer les tâches avec leur temps restant exact (format ISO 8601)
                const restoredTasks = data.cleopatraTasks.map(task => {
                    // Convertir la durée ISO 8601 en secondes si présente
                    if (task.timeRemainingISO) {
                        task.timeRemaining = this.parseISODuration(task.timeRemainingISO);
                    }
                    // Recalculer startTime pour que le système fonctionne correctement
                    task.startTime = now - ((task.timeLimit - task.timeRemaining) * 1000);
                    return task;
                });

                this.cleopatra.activeTasks = restoredTasks;
                this.cleopatra.lastTaskTime = now; // Réinitialiser pour éviter une nouvelle tâche immédiate

                // Mettre à jour l'affichage des tâches
                this.cleopatra.updateTasksDisplay();

                if (restoredTasks.length > 0) {
                    this.notifications.info(`${restoredTasks.length} tâche(s) de Cléopâtre restaurée(s)`);
                }
            }

            // Restaurer l'historique des statistiques pour les graphiques
            if (this.statsMenu && data.statsHistory) {
                this.statsMenu.graphHistory = data.statsHistory;
            }

            // Restaurer les multiplicateurs des panneaux
            if (this.panels && data.multipliers) {
                if (data.multipliers.build !== undefined) {
                    this.panels.setBuildMultiplier(data.multipliers.build);
                }
                if (data.multipliers.gather !== undefined) {
                    this.panels.setMultiplier(data.multipliers.gather);
                }
            }

            this.notifications.success("Partie chargée !");
        } catch (e) {
            this.notifications.error("Erreur lors du chargement");
            console.error(e);
        }
    }

    /**
     * Sauvegarde la partie
     */
    saveGame() {
        // Préparer les tâches avec durée ISO 8601
        const tasksToSave = this.cleopatra ? this.cleopatra.activeTasks.map(task => ({
            ...task,
            // Convertir timeRemaining en format ISO 8601 (PT = Period Time)
            timeRemainingISO: this.toISODuration(task.timeRemaining)
        })) : [];

        const saveData = {
            state: this.state,
            // Nouveau système avec formes et positions
            villageState: this.villageRenderer ? this.villageRenderer.exportState() : null,
            // Sauvegarder les tâches de Cléopâtre avec durée ISO
            cleopatraTasks: tasksToSave,
            // Sauvegarder l'historique des statistiques pour les graphiques
            statsHistory: this.statsMenu ? this.statsMenu.graphHistory : null,
            // Sauvegarder les multiplicateurs des panneaux
            multipliers: this.panels ? {
                build: this.panels.buildMultiplier,
                gather: this.panels.gatherMultiplier
            } : null,
            savedAt: Date.now()
        };

        localStorage.setItem('cleopatra_save', JSON.stringify(saveData));
        this.notifications.success("Partie sauvegardée !");

        // Activer le bouton charger
        const loadBtn = document.getElementById('loadBtn');
        if (loadBtn) loadBtn.disabled = false;
    }

    /**
     * Affiche le menu principal
     */
    showMenu() {
        if (this.isRunning) {
            // Mettre en pause
            this.isRunning = false;
            if (this.gameLoop) {
                cancelAnimationFrame(this.gameLoop);
            }
        }
        this.screens.show('mainMenu');
    }

    /**
     * Affiche le guide
     */
    showGuide() {
        this.screens.show('guideScreen');
        this.renderGuide();
    }

    /**
     * Ferme le guide
     */
    closeGuide() {
        if (this.state.startTime) {
            this.screens.show('gameScreen');
            // Reprendre le jeu si en cours
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
     * Rend le contenu du guide (charge le fichier GUIDE.md)
     */
    async renderGuide() {
        const container = document.getElementById('guideContent');
        if (!container) return;

        try {
            // Charger le fichier GUIDE.md
            const response = await fetch('./GUIDE.md');
            if (!response.ok) {
                throw new Error('Impossible de charger le guide');
            }
            const markdown = await response.text();

            // Parser le markdown
            let html = this.parseMarkdown(markdown);
            container.innerHTML = html;
        } catch (error) {
            console.error('Erreur lors du chargement du guide:', error);
            container.innerHTML = '<p>Erreur lors du chargement du guide. Veuillez réessayer.</p>';
        }
    }

    /**
     * Parse le markdown en HTML
     */
    parseMarkdown(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inTable = false;
        let inList = false;
        let inParagraph = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Ignorer les lignes de séparation de tableau (|---|---|)
            if (/^\|[\s\-:|]+$/.test(line) && line.includes('--')) {
                continue;
            }

            // Tableaux
            if (line.startsWith('|') && line.endsWith('|')) {
                if (inParagraph) {
                    html += '</p>';
                    inParagraph = false;
                }
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }

                const cells = line.split('|').filter(c => c.trim());

                if (!inTable) {
                    // Début du tableau - c'est l'en-tête
                    html += '<table><thead><tr>';
                    html += cells.map(c => `<th>${this.parseInline(c.trim())}</th>`).join('');
                    html += '</tr></thead><tbody>';
                    inTable = true;
                } else {
                    // Ligne de données
                    html += '<tr>';
                    html += cells.map(c => `<td>${this.parseInline(c.trim())}</td>`).join('');
                    html += '</tr>';
                }
                continue;
            } else if (inTable) {
                html += '</tbody></table>';
                inTable = false;
            }

            // Titres
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

            // Listes
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
     * Parse les éléments inline (gras, italique, etc.)
     */
    parseInline(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    }

    /**
     * Boucle de mise à jour principale
     */
    update(time) {
        if (!this.isRunning) return;

        const deltaTime = (time - this.lastTime) / 1000; // En secondes
        this.lastTime = time;

        // Limiter le delta time pour éviter les sauts
        const dt = Math.min(deltaTime, 0.1);

        // Incrémenter le temps de jeu
        this.state.gameTime += dt;

        // Mettre à jour les systèmes
        this.updateProduction(dt);
        this.updateConsumption(dt);
        this.updatePopulationGrowth(dt);
        this.updateConstructions(dt);
        this.updateGathering(dt);

        // Mettre à jour Cléopâtre
        if (this.cleopatra) {
            this.cleopatra.update(dt);
        }

        // Mettre à jour les statistiques
        if (this.statistics) {
            this.statistics.update(dt);
        }

        // Mettre à jour le menu stats si ouvert
        if (this.statsMenu) {
            this.statsMenu.update();
        }

        // Mettre à jour le rendu
        if (this.villageRenderer) {
            this.villageRenderer.update(dt);
            this.villageRenderer.render();
        }

        // Mettre à jour l'UI
        this.updateUI();

        // Vérifier la victoire
        this.checkVictory();

        // Continuer la boucle
        this.gameLoop = requestAnimationFrame((t) => this.update(t));
    }

    /**
     * Met à jour la production des bâtiments
     */
    updateProduction(dt) {
        // === NOURRITURE ===
        // Production des champs
        const fields = this.state.buildings['field'] || 0;
        this.state.food += fields * (5 / 60) * dt;

        // Production des boulangeries
        const bakeries = this.state.buildings['bakery'] || 0;
        this.state.food += bakeries * (15 / 60) * dt;

        // Production des fermes
        const farms = this.state.buildings['farm'] || 0;
        this.state.food += farms * (10 / 60) * dt;

        // Production des jardins
        const gardens = this.state.buildings['gardens'] || 0;
        this.state.food += gardens * (5 / 60) * dt;

        // === EAU ===
        // Production des puits
        const wells = this.state.buildings['well'] || 0;
        this.state.water += wells * (10 / 60) * dt;

        // Production des citernes
        const cisterns = this.state.buildings['cistern'] || 0;
        this.state.water += cisterns * (20 / 60) * dt;

        // === ARGENT ===
        // Production des marchés
        const markets = this.state.buildings['market'] || 0;
        this.state.money += markets * (20 / 60) * dt;

        // Production des ports
        const harbors = this.state.buildings['harbor'] || 0;
        this.state.money += harbors * (30 / 60) * dt;

        // Production des colisées
        const coliseums = this.state.buildings['coliseum'] || 0;
        this.state.money += coliseums * (25 / 60) * dt;

        // === RESSOURCES ===
        // Production des carrières
        const quarries = this.state.buildings['quarry'] || 0;
        this.state.resources.stone += quarries * (3 / 60) * dt;

        // Production des scieries
        const lumbermills = this.state.buildings['lumbermill'] || 0;
        this.state.resources.wood += lumbermills * (3 / 60) * dt;

        // Production des ateliers
        const workshops = this.state.buildings['workshop'] || 0;
        this.state.resources.wood += workshops * (2 / 60) * dt;
        this.state.resources.stone += workshops * (2 / 60) * dt;
    }

    /**
     * Met à jour la consommation (système de rations périodiques)
     */
    updateConsumption(dt) {
        // Décrémenter le timer
        this.state.rationTimer -= dt;

        // Avertissement quand il reste peu de temps
        if (this.state.rationTimer <= RATION_CONFIG.warningThreshold && !this.state.rationWarningShown) {
            this.state.rationWarningShown = true;
            this.notifications.warning("Les paysans auront bientôt besoin de rations !");
        }

        // C'est l'heure de la ration !
        if (this.state.rationTimer <= 0) {
            this.distributeRations();
            this.state.rationTimer = RATION_CONFIG.interval;
            this.state.rationWarningShown = false;
        }

        // Vérifier la famine
        if (this.state.food <= 0 && this.state.water <= 0) {
            // Les paysans ne peuvent plus travailler
            if (this.state.availablePeasants > 0) {
                this.notifications.warning("Vos paysans ont faim et soif ! Ils ne peuvent plus travailler.");
                this.state.availablePeasants = 0;
            }
        } else {
            // Restaurer les paysans disponibles
            this.state.availablePeasants = this.state.totalPeasants - this.getWorkingPeasants();
        }
    }

    /**
     * Distribue les rations aux paysans
     */
    distributeRations() {
        const peasants = this.state.totalPeasants;

        // Calculer la consommation totale
        const foodNeeded = peasants * CONSUMABLES.food.consumptionPerPeasant;
        const waterNeeded = peasants * CONSUMABLES.water.consumptionPerPeasant;

        // Prélever les ressources
        const foodTaken = Math.min(this.state.food, foodNeeded);
        const waterTaken = Math.min(this.state.water, waterNeeded);

        this.state.food = Math.max(0, this.state.food - foodTaken);
        this.state.water = Math.max(0, this.state.water - waterTaken);

        // Notification
        if (foodTaken > 0 || waterTaken > 0) {
            this.notifications.info(`Rations distribuées: -${Math.floor(foodTaken)} 🍞 -${Math.floor(waterTaken)} 💧`);
        }

        // Avertir si pas assez de ressources
        if (foodTaken < foodNeeded) {
            this.notifications.error(`Pas assez de nourriture ! (${Math.floor(foodNeeded - foodTaken)} 🍞 manquant)`);
        }
        if (waterTaken < waterNeeded) {
            this.notifications.error(`Pas assez d'eau ! (${Math.floor(waterNeeded - waterTaken)} 💧 manquant)`);
        }
    }

    /**
     * Met à jour la croissance naturelle de la population
     */
    updatePopulationGrowth(dt) {
        // Décrémenter le timer
        this.state.growthTimer -= dt;

        if (this.state.growthTimer <= 0) {
            this.state.growthTimer = POPULATION_GROWTH_CONFIG.growthInterval;

            // Vérifier les réserves minimales
            if (this.state.food < POPULATION_GROWTH_CONFIG.minFoodReserve ||
                this.state.water < POPULATION_GROWTH_CONFIG.minWaterReserve) {
                return; // Pas assez de réserves pour croître
            }

            // Calculer le taux de croissance
            const houses = this.state.buildings['house'] || 0;
            const villas = this.state.buildings['villa'] || 0;
            const inns = this.state.buildings['inn'] || 0;
            const baths = this.state.buildings['baths'] || 0;
            const gardens = this.state.buildings['gardens'] || 0;

            // Bonus de logement (plus de maisons = plus de croissance)
            const housingBonus = 1 + (houses * 0.1) + (villas * 0.2) + (inns * 0.05) + (baths * 0.15) + (gardens * 0.25);

            // Taux de croissance par tick (basé sur l'intervalle de 30 secondes)
            const baseGrowth = POPULATION_GROWTH_CONFIG.baseGrowthRate * (POPULATION_GROWTH_CONFIG.growthInterval / 60);
            let growth = Math.floor(baseGrowth * housingBonus * this.state.population / 100);

            // Minimum 1 habitant si conditions remplies, maximum selon config
            growth = Math.max(1, Math.min(growth, POPULATION_GROWTH_CONFIG.maxGrowthPerTick));

            // Vérifier si on a assez de ressources pour les nouveaux habitants
            const foodNeeded = growth * POPULATION_GROWTH_CONFIG.foodPerNewHabitant;
            const waterNeeded = growth * POPULATION_GROWTH_CONFIG.waterPerNewHabitant;

            // Ajuster la croissance selon les ressources disponibles
            const maxByFood = Math.floor((this.state.food - POPULATION_GROWTH_CONFIG.minFoodReserve) / POPULATION_GROWTH_CONFIG.foodPerNewHabitant);
            const maxByWater = Math.floor((this.state.water - POPULATION_GROWTH_CONFIG.minWaterReserve) / POPULATION_GROWTH_CONFIG.waterPerNewHabitant);
            growth = Math.min(growth, maxByFood, maxByWater);

            if (growth > 0) {
                // Consommer les ressources
                this.state.food -= growth * POPULATION_GROWTH_CONFIG.foodPerNewHabitant;
                this.state.water -= growth * POPULATION_GROWTH_CONFIG.waterPerNewHabitant;

                // Augmenter la population
                this.state.population += growth;

                // Notification
                this.notifications.info(`Croissance naturelle: +${growth} 👥 habitants`);
            }
        }
    }

    /**
     * Met à jour les constructions en cours
     */
    updateConstructions(dt) {
        const completedIndices = [];

        this.state.constructions.forEach((construction, index) => {
            construction.elapsed += dt;

            if (construction.elapsed >= construction.totalTime) {
                completedIndices.push(index);
            }
        });

        // Compléter les constructions
        completedIndices.reverse().forEach(index => {
            const construction = this.state.constructions[index];
            this.completeConstruction(construction);
            this.state.constructions.splice(index, 1);
        });
    }

    /**
     * Complète une construction
     */
    completeConstruction(construction) {
        const building = BUILDINGS[construction.buildingId];

        // Ajouter le bâtiment
        if (!this.state.buildings[construction.buildingId]) {
            this.state.buildings[construction.buildingId] = 0;
        }
        this.state.buildings[construction.buildingId]++;
        this.state.buildingsBuilt++;

        // Finaliser le bâtiment sur la grille
        if (this.villageRenderer && construction.position) {
            this.villageRenderer.finishBuilding(construction.position.x, construction.position.y);
        }

        // Libérer les paysans
        this.state.availablePeasants += construction.peasantsUsed;

        // Appliquer les effets
        if (building.effects.population) {
            this.state.population += building.effects.population;
        }
        if (building.effects.peasants) {
            this.state.totalPeasants += building.effects.peasants;
            this.state.availablePeasants += building.effects.peasants;
        }

        // Récompense de Cléopâtre
        this.state.money += building.reward;

        // Notifications
        this.notifications.success(`${building.name} construit ! +${building.reward} 💰`);
    }

    /**
     * Met à jour les tâches de collecte
     */
    updateGathering(dt) {
        const completedIndices = [];

        this.state.gatheringTasks.forEach((task, index) => {
            task.elapsed += dt;

            if (task.elapsed >= task.totalTime) {
                completedIndices.push(index);
            }
        });

        // Compléter les collectes
        completedIndices.reverse().forEach(index => {
            const task = this.state.gatheringTasks[index];
            this.completeGathering(task);
            this.state.gatheringTasks.splice(index, 1);
        });
    }

    /**
     * Complète une tâche de collecte
     */
    completeGathering(task) {
        const resource = RESOURCES[task.resourceId];

        // Ajouter les ressources
        this.state.resources[task.resourceId] += resource.gatherAmount;

        // Libérer le paysan
        this.state.availablePeasants++;

        this.notifications.success(`+${resource.gatherAmount} ${resource.icon} ${resource.name}`);
    }

    /**
     * Met à jour l'interface utilisateur
     */
    updateUI() {
        // Barre supérieure
        document.getElementById('moneyDisplay').textContent = `💰 ${Math.floor(this.state.money)}`;
        document.getElementById('foodDisplay').textContent = `🍞 ${Math.floor(this.state.food)}`;
        document.getElementById('waterDisplay').textContent = `💧 ${Math.floor(this.state.water)}`;
        document.getElementById('populationDisplay').textContent = `👥 ${Math.floor(this.state.population)}`;
        document.getElementById('peasantsDisplay').textContent = `🧑‍🌾 ${this.state.availablePeasants}/${this.state.totalPeasants}`;

        // Timer des rations
        const rationTimerEl = document.getElementById('rationTimerDisplay');
        if (rationTimerEl) {
            const timer = Math.max(0, this.state.rationTimer);
            const minutes = Math.floor(timer / 60);
            const seconds = Math.floor(timer % 60);
            rationTimerEl.textContent = `🍽️ ${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Couleur selon l'urgence
            if (timer <= RATION_CONFIG.warningThreshold) {
                rationTimerEl.classList.add('warning');
            } else {
                rationTimerEl.classList.remove('warning');
            }
        }

        // Rafraîchir les panneaux
        if (this.panels) {
            this.panels.refresh();
        }
    }

    /**
     * Vérifie les conditions de victoire
     */
    checkVictory() {
        if (this.state.population >= 10000) {
            this.victory();
        }
    }

    /**
     * Victoire !
     */
    victory() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        // Afficher les stats
        const duration = Math.floor((Date.now() - this.state.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        document.getElementById('victoryStats').innerHTML = `
            <p>Temps de jeu: ${minutes}m ${seconds}s</p>
            <p>Bâtiments construits: ${this.state.buildingsBuilt}</p>
            <p>Population finale: ${Math.floor(this.state.population)}</p>
            <p>Or accumulé: ${Math.floor(this.state.money)}</p>
        `;

        // Créer le sprite de victoire (Cléopâtre heureuse)
        this.createEndScreenSprite('victorySprite', 'happy');

        this.screens.show('victoryScreen');
    }

    /**
     * Game Over
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

        // Créer le sprite de game over (Cléopâtre en colère)
        this.createEndScreenSprite('gameOverSprite', 'angry');

        this.screens.show('gameOverScreen');
    }

    /**
     * Crée un sprite Cléopâtre grand format pour les écrans de fin
     */
    createEndScreenSprite(containerId, mood) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Nettoyer le conteneur
        container.innerHTML = '';

        // Importer et créer le sprite
        import('../systems/cleopatra-sprite.js').then(module => {
            const CleopatraSprite = module.default;
            const sprite = new CleopatraSprite(container, {
                width: 200,
                height: 250,
                scale: 2.5,
                persistentEffects: true // Étoiles/éclairs visibles en permanence
            });

            // Définir l'humeur
            if (mood === 'happy') {
                sprite.currentMood = 'happy';
                sprite.playAnimation('happy', 999999); // Animation continue
            } else if (mood === 'angry') {
                sprite.currentMood = 'angry';
                sprite.playAnimation('angry', 999999);
            }
        });
    }

    /**
     * Vérifie si on peut construire un bâtiment
     */
    canBuild(buildingId) {
        const building = BUILDINGS[buildingId];
        if (!building) return false;

        // Vérifier l'argent
        if (this.state.money < building.cost.money) return false;

        // Vérifier les ressources
        if (building.cost.wood && this.state.resources.wood < building.cost.wood) return false;
        if (building.cost.stone && this.state.resources.stone < building.cost.stone) return false;
        if (building.cost.sand && this.state.resources.sand < building.cost.sand) return false;
        if (building.cost.dirt && this.state.resources.dirt < building.cost.dirt) return false;
        if (building.cost.clay && this.state.resources.clay < building.cost.clay) return false;
        if (building.cost.water && this.state.water < building.cost.water) return false;

        // Vérifier les paysans disponibles
        if (this.state.availablePeasants < 1) return false;

        // Vérifier le max (bâtiments terminés + en construction)
        const builtCount = this.state.buildings[buildingId] || 0;
        const pendingCount = this.state.constructions.filter(c => c.buildingId === buildingId).length;
        if (builtCount + pendingCount >= building.maxCount) return false;

        return true;
    }

    /**
     * Démarre la construction d'un bâtiment
     */
    startBuilding(buildingId) {
        if (!this.canBuild(buildingId)) {
            this.notifications.error("Construction impossible !");
            return;
        }

        const building = BUILDINGS[buildingId];

        // Déduire les coûts
        this.state.money -= building.cost.money;
        if (building.cost.wood) this.state.resources.wood -= building.cost.wood;
        if (building.cost.stone) this.state.resources.stone -= building.cost.stone;
        if (building.cost.sand) this.state.resources.sand -= building.cost.sand;
        if (building.cost.dirt) this.state.resources.dirt -= building.cost.dirt;
        if (building.cost.clay) this.state.resources.clay -= building.cost.clay;
        if (building.cost.water) this.state.water -= building.cost.water;

        // Assigner un paysan
        this.state.availablePeasants--;

        // Trouver une position sur la grille
        let position = null;
        if (this.villageRenderer) {
            position = this.villageRenderer.placeBuilding(buildingId);
        }

        // Créer la construction
        this.state.constructions.push({
            buildingId: buildingId,
            totalTime: building.buildTime,
            elapsed: 0,
            peasantsUsed: 1,
            position: position
        });

        this.notifications.success(`Construction de ${building.name} commencée !`);
    }

    /**
     * Envoie un paysan chercher des ressources
     */
    gatherResource(resourceId) {
        const resource = RESOURCES[resourceId];

        // Vérifications
        if (this.state.money < resource.gatherCost) {
            this.notifications.error("Pas assez d'argent !");
            return;
        }

        if (this.state.availablePeasants < 1) {
            this.notifications.error("Aucun paysan disponible !");
            return;
        }

        // Déduire les coûts
        this.state.money -= resource.gatherCost;
        this.state.availablePeasants--;

        // Créer la tâche
        this.state.gatheringTasks.push({
            resourceId: resourceId,
            totalTime: resource.gatherTime,
            elapsed: 0
        });

        this.notifications.success(`Un paysan part chercher du ${resource.name}`);
    }

    /**
     * Envoie un message à César
     */
    sendMessageToCaesar() {
        if (!this.hasBuilding('aviary')) {
            this.notifications.error("Construisez d'abord une volière !");
            return;
        }

        if (this.state.money < 50) {
            this.notifications.error("Il faut 50 pièces pour envoyer un message !");
            return;
        }

        this.state.money -= 50;
        this.state.messagesSentToCaesar = (this.state.messagesSentToCaesar || 0) + 1;

        this.notifications.success("Un oiseau s'envole vers Rome... 🕊️");
    }

    /**
     * Obtient le nombre de bâtiments d'un type
     */
    getBuildingCount(buildingId) {
        return this.state.buildings[buildingId] || 0;
    }

    /**
     * Vérifie si un bâtiment existe
     */
    hasBuilding(buildingId) {
        return this.getBuildingCount(buildingId) > 0;
    }

    /**
     * Obtient le nombre de paysans au travail
     */
    getWorkingPeasants() {
        let working = 0;
        working += this.state.constructions.length;
        working += this.state.gatheringTasks.length;
        return working;
    }

    /**
     * Ajoute de l'argent
     */
    addMoney(amount) {
        this.state.money += amount;
    }

    /**
     * Affiche les infos d'un bâtiment
     * @param {number|string|object} buildingRef - uid (number), buildingId (string), ou objet avec .id
     */
    showBuildingInfo(buildingRef) {
        const panel = document.getElementById('sidePanel');
        const content = document.getElementById('sidePanelContent');
        if (!panel || !content) return;

        let placedBuilding = null;
        let building = null;

        // Déterminer le type de référence
        if (typeof buildingRef === 'number') {
            // C'est un uid - récupérer l'instance depuis villageRenderer
            placedBuilding = this.villageRenderer?.getBuildingByUid(buildingRef);
            if (placedBuilding) {
                building = BUILDINGS[placedBuilding.buildingId];
            }
        } else if (typeof buildingRef === 'string') {
            // C'est un buildingId direct
            building = BUILDINGS[buildingRef];
        } else if (buildingRef && buildingRef.id) {
            // C'est un objet avec .id
            building = BUILDINGS[buildingRef.id];
        }

        if (!building) return;

        // Construire le contenu du panneau
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

        // Population et paysans
        if (e.population) effectsHtml.push(`<li>👥 +${e.population} habitants</li>`);
        if (e.peasants) effectsHtml.push(`<li>🧑‍🌾 +${e.peasants} paysans</li>`);

        // Production par minute
        if (e.foodPerMinute) effectsHtml.push(`<li>🍞 +${e.foodPerMinute} nourriture/min</li>`);
        if (e.waterPerMinute) effectsHtml.push(`<li>💧 +${e.waterPerMinute} eau/min</li>`);
        if (e.moneyPerMinute) effectsHtml.push(`<li>💰 +${e.moneyPerMinute} or/min</li>`);
        if (e.woodPerMinute) effectsHtml.push(`<li>🪵 +${e.woodPerMinute} bois/min</li>`);
        if (e.stonePerMinute) effectsHtml.push(`<li>🪨 +${e.stonePerMinute} pierre/min</li>`);

        // Stockage
        if (e.foodStorage) effectsHtml.push(`<li>📦 +${e.foodStorage} stockage nourriture</li>`);

        // Bonus spéciaux
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
     * Initialise les tooltips sur les ressources de la barre supérieure
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
     * Affiche le tooltip d'une ressource avec les statistiques
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

        // Restaurer l'état depuis localStorage
        const savedState = localStorage.getItem('cleopatra_autosave_enabled');
        if (savedState === 'true') {
            toggle.checked = true;
            this.enableAutoSave();
        }

        // Écouter les changements
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                this.enableAutoSave();
                this.notifications.info("Sauvegarde automatique activée (toutes les 2 min)");
            } else {
                this.disableAutoSave();
                this.notifications.info("Sauvegarde automatique désactivée");
            }
            // Sauvegarder la préférence
            localStorage.setItem('cleopatra_autosave_enabled', toggle.checked.toString());
        });
    }

    /**
     * Active la sauvegarde automatique
     */
    enableAutoSave() {
        this.autoSaveEnabled = true;

        // Nettoyer l'ancien intervalle si existant
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // Créer un nouvel intervalle (2 minutes)
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
     * @returns {string} - Durée au format ISO 8601 (ex: "PT1M30S")
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
     * @returns {number} - Durée en secondes
     */
    parseISODuration(iso) {
        if (!iso || typeof iso !== 'string') return 0;

        // Format: PT[nH][nM][nS]
        const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
        if (!match) return 0;

        const hours = parseInt(match[1] || 0, 10);
        const minutes = parseInt(match[2] || 0, 10);
        const seconds = parseFloat(match[3] || 0);

        return hours * 3600 + minutes * 60 + seconds;
    }
}

export default Game;
