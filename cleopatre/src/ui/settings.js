// ==========================================
// SYSTÈME DE PARAMÈTRES
// ==========================================
// Ce module gère les paramètres du jeu:
// - Activation/désactivation de la musique
// - Activation/désactivation des effets sonores
// - Volume général (master)
// - Volume individuel musique et SFX
// - Persistance des paramètres dans localStorage
// ==========================================

/**
 * Clé utilisée pour sauvegarder les paramètres dans localStorage
 * @type {string}
 */
const SETTINGS_STORAGE_KEY = 'cleopatra_settings';

/**
 * Gestionnaire des paramètres du jeu
 * Contrôle les options audio et leur persistance
 */
class SettingsManager {
    /**
     * Crée une nouvelle instance du gestionnaire de paramètres
     * @param {Game} game - Instance du jeu principal
     */
    constructor(game) {
        /** @type {Game} Référence au jeu principal */
        this.game = game;

        /**
         * État des paramètres
         * @type {object}
         */
        this.settings = {
            /** @type {boolean} Musique activée */
            musicEnabled: true,
            /** @type {boolean} Effets sonores activés */
            sfxEnabled: true,
            /** @type {number} Volume général (0-1) */
            masterVolume: 1.0,
            /** @type {number} Volume de la musique (0-1) */
            musicVolume: 1.0,
            /** @type {number} Volume des effets sonores (0-1) */
            sfxVolume: 1.0
        };

        /** @type {boolean} Indique si le panneau des paramètres est ouvert */
        this.isOpen = false;

        // Charger les paramètres sauvegardés
        this.loadSettings();

        // Créer le panneau HTML
        this.createSettingsPanel();

        // Appliquer les paramètres au démarrage
        this.applySettings();
    }

    /**
     * Charge les paramètres depuis localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('Impossible de charger les paramètres:', e);
        }
    }

    /**
     * Sauvegarde les paramètres dans localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Impossible de sauvegarder les paramètres:', e);
        }
    }

    /**
     * Crée le panneau HTML des paramètres et l'ajoute au DOM
     */
    createSettingsPanel() {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.id = 'settingsOverlay';
        overlay.className = 'settings-overlay hidden';
        overlay.innerHTML = `
            <div class="settings-panel">
                <div class="settings-header">
                    <h2>Parametres</h2>
                    <button type="button" class="close-btn" id="closeSettingsBtn">X</button>
                </div>

                <div class="settings-content">
                    <!-- Section Audio -->
                    <div class="settings-section">
                        <h3>Audio</h3>

                        <!-- Volume général -->
                        <div class="settings-row">
                            <label class="settings-label">Volume general</label>
                            <div class="settings-control">
                                <input type="range" id="masterVolumeSlider"
                                    min="0" max="100" value="${this.settings.masterVolume * 100}"
                                    class="volume-slider">
                                <span class="volume-value" id="masterVolumeValue">${Math.round(this.settings.masterVolume * 100)}%</span>
                            </div>
                        </div>

                        <!-- Musique -->
                        <div class="settings-row">
                            <label class="settings-label">Musique</label>
                            <div class="settings-control">
                                <label class="settings-toggle">
                                    <input type="checkbox" id="musicEnabledToggle"
                                        ${this.settings.musicEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="settings-row sub-row">
                            <label class="settings-label">Volume musique</label>
                            <div class="settings-control">
                                <input type="range" id="musicVolumeSlider"
                                    min="0" max="100" value="${this.settings.musicVolume * 100}"
                                    class="volume-slider"
                                    ${!this.settings.musicEnabled ? 'disabled' : ''}>
                                <span class="volume-value" id="musicVolumeValue">${Math.round(this.settings.musicVolume * 100)}%</span>
                            </div>
                        </div>

                        <!-- Effets sonores -->
                        <div class="settings-row">
                            <label class="settings-label">Effets sonores</label>
                            <div class="settings-control">
                                <label class="settings-toggle">
                                    <input type="checkbox" id="sfxEnabledToggle"
                                        ${this.settings.sfxEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="settings-row sub-row">
                            <label class="settings-label">Volume SFX</label>
                            <div class="settings-control">
                                <input type="range" id="sfxVolumeSlider"
                                    min="0" max="100" value="${this.settings.sfxVolume * 100}"
                                    class="volume-slider"
                                    ${!this.settings.sfxEnabled ? 'disabled' : ''}>
                                <span class="volume-value" id="sfxVolumeValue">${Math.round(this.settings.sfxVolume * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Bouton de test audio -->
                    <div class="settings-section">
                        <button type="button" class="settings-test-btn" id="testAudioBtn">
                            Tester le son
                        </button>
                    </div>
                </div>

                <div class="settings-footer">
                    <button type="button" class="settings-btn settings-btn-secondary" id="resetSettingsBtn">
                        Reinitialiser
                    </button>
                    <button type="button" class="settings-btn settings-btn-primary" id="applySettingsBtn">
                        Appliquer
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Initialiser les événements
        this.initEventListeners();
    }

    /**
     * Initialise tous les écouteurs d'événements du panneau
     */
    initEventListeners() {
        // Fermer le panneau
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.close());
        document.getElementById('settingsOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'settingsOverlay') this.close();
        });

        // Volume général
        const masterSlider = document.getElementById('masterVolumeSlider');
        masterSlider?.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.settings.masterVolume = value;
            document.getElementById('masterVolumeValue').textContent = `${Math.round(value * 100)}%`;
            this.applySettings(true);
        });

        // Toggle musique
        const musicToggle = document.getElementById('musicEnabledToggle');
        musicToggle?.addEventListener('change', (e) => {
            this.settings.musicEnabled = e.target.checked;
            const musicSlider = document.getElementById('musicVolumeSlider');
            if (musicSlider) musicSlider.disabled = !e.target.checked;
            this.applySettings(true);
        });

        // Volume musique
        const musicSlider = document.getElementById('musicVolumeSlider');
        musicSlider?.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.settings.musicVolume = value;
            document.getElementById('musicVolumeValue').textContent = `${Math.round(value * 100)}%`;
            this.applySettings(true);
        });

        // Toggle SFX
        const sfxToggle = document.getElementById('sfxEnabledToggle');
        sfxToggle?.addEventListener('change', (e) => {
            this.settings.sfxEnabled = e.target.checked;
            const sfxSlider = document.getElementById('sfxVolumeSlider');
            if (sfxSlider) sfxSlider.disabled = !e.target.checked;
            this.applySettings(true);
        });

        // Volume SFX
        const sfxSlider = document.getElementById('sfxVolumeSlider');
        sfxSlider?.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.settings.sfxVolume = value;
            document.getElementById('sfxVolumeValue').textContent = `${Math.round(value * 100)}%`;
            this.applySettings(true);
        });

        // Bouton test audio
        document.getElementById('testAudioBtn')?.addEventListener('click', () => this.testAudio());

        // Bouton réinitialiser
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => this.resetSettings());

        // Bouton appliquer (ferme le panneau)
        document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
            this.close();
        });
    }

    /**
     * Applique les paramètres au système audio du jeu
     * Met à jour les volumes de tous les éléments audio
     * @param {boolean} save - Si true, sauvegarde les paramètres (défaut: false)
     */
    applySettings(save = false) {
        const game = this.game;
        if (!game) return;

        // Fonction pour limiter le volume à [0, 1]
        const clampVolume = (v) => Math.min(1, Math.max(0, v));

        // Calculer les volumes effectifs
        const effectiveMusicVolume = this.settings.musicEnabled
            ? clampVolume(this.settings.masterVolume * this.settings.musicVolume)
            : 0;
        const effectiveSfxVolume = this.settings.sfxEnabled
            ? clampVolume(this.settings.masterVolume * this.settings.sfxVolume)
            : 0;

        // Appliquer aux pistes de musique de jeu
        if (game.musicTracks && game.musicTracks.length > 0) {
            game.musicTracks.forEach(track => {
                track.volume = effectiveMusicVolume;
            });
        }

        // Appliquer aux pistes de musique de menu
        if (game.menuTracks && game.menuTracks.length > 0) {
            game.menuTracks.forEach(track => {
                track.volume = effectiveMusicVolume;
            });
        }

        // Appliquer aux effets sonores
        if (game.sfx) {
            // Clic simple
            if (game.sfx.click) {
                game.sfx.click.volume = effectiveSfxVolume;
            }

            // Sons de personnage
            if (game.sfx.clickMale) {
                game.sfx.clickMale.forEach(s => s.volume = effectiveSfxVolume);
            }
            if (game.sfx.clickFemale) {
                game.sfx.clickFemale.forEach(s => s.volume = effectiveSfxVolume);
            }

            // Sons de hover
            if (game.sfx.hoverMale) {
                game.sfx.hoverMale.forEach(s => s.volume = effectiveSfxVolume);
            }
            if (game.sfx.hoverFemale) {
                game.sfx.hoverFemale.forEach(s => s.volume = effectiveSfxVolume);
            }

            // Sons de Cléopâtre
            if (game.sfx.cleopatraNewTask) {
                game.sfx.cleopatraNewTask.forEach(s => s.volume = effectiveSfxVolume);
            }
            if (game.sfx.cleopatraTaskSuccess) {
                game.sfx.cleopatraTaskSuccess.forEach(s => s.volume = effectiveSfxVolume);
            }
            if (game.sfx.cleopatraTaskFailed) {
                game.sfx.cleopatraTaskFailed.forEach(s => s.volume = effectiveSfxVolume);
            }
        }

        // Sauvegarder si demandé
        if (save) {
            this.saveSettings();
        }
    }

    /**
     * Joue un son de test pour vérifier les réglages
     */
    testAudio() {
        if (this.game?.sfx?.click && this.settings.sfxEnabled) {
            this.game.sfx.click.currentTime = 0;
            this.game.sfx.click.play().catch(() => {});
        }
    }

    /**
     * Réinitialise les paramètres aux valeurs par défaut
     */
    resetSettings() {
        this.settings = {
            musicEnabled: true,
            sfxEnabled: true,
            masterVolume: 1.0,
            musicVolume: 1.0,
            sfxVolume: 1.0
        };

        // Mettre à jour l'interface
        this.updateUI();
        this.applySettings(true);
    }

    /**
     * Met à jour l'interface du panneau avec les valeurs actuelles
     */
    updateUI() {
        const masterSlider = document.getElementById('masterVolumeSlider');
        const masterValue = document.getElementById('masterVolumeValue');
        const musicToggle = document.getElementById('musicEnabledToggle');
        const musicSlider = document.getElementById('musicVolumeSlider');
        const musicValue = document.getElementById('musicVolumeValue');
        const sfxToggle = document.getElementById('sfxEnabledToggle');
        const sfxSlider = document.getElementById('sfxVolumeSlider');
        const sfxValue = document.getElementById('sfxVolumeValue');

        if (masterSlider) masterSlider.value = this.settings.masterVolume * 100;
        if (masterValue) masterValue.textContent = `${Math.round(this.settings.masterVolume * 100)}%`;

        if (musicToggle) musicToggle.checked = this.settings.musicEnabled;
        if (musicSlider) {
            musicSlider.value = this.settings.musicVolume * 100;
            musicSlider.disabled = !this.settings.musicEnabled;
        }
        if (musicValue) musicValue.textContent = `${Math.round(this.settings.musicVolume * 100)}%`;

        if (sfxToggle) sfxToggle.checked = this.settings.sfxEnabled;
        if (sfxSlider) {
            sfxSlider.value = this.settings.sfxVolume * 100;
            sfxSlider.disabled = !this.settings.sfxEnabled;
        }
        if (sfxValue) sfxValue.textContent = `${Math.round(this.settings.sfxVolume * 100)}%`;
    }

    /**
     * Ouvre le panneau des paramètres
     */
    open() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.isOpen = true;
        }
    }

    /**
     * Ferme le panneau des paramètres
     */
    close() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            this.isOpen = false;
        }
    }

    /**
     * Bascule l'affichage du panneau des paramètres
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

export default SettingsManager;
