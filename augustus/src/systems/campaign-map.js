// ==========================================
// SYSTÈME DE CARTE DE CAMPAGNE (TUILES)
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';
import TileRenderer from './tile-renderer.js';
import MinimapRenderer from './minimap-renderer.js';

/**
 * Gère la carte de campagne à base de tuiles
 * Remplace l'ancien système vectoriel par un système de grille
 */
class CampaignMap {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.minimapCanvas = null;
        this.minimapCtx = null;

        // Renderers
        this.tileRenderer = null;
        this.minimapRenderer = null;

        // État du drag
        this.isDragging = false;
        this.hasDragged = false;
        this.dragButton = 0;
        this.lastMousePos = { x: 0, y: 0 };
        this.dragStartPos = { x: 0, y: 0 };

        // État du mouvement d'armée
        this.isMovingArmy = false;
        this.movePath = [];

        // État des touches clavier pour le déplacement de la caméra
        this.keysPressed = new Set();
        this.keyboardPanSpeed = 15; // Vitesse de déplacement en pixels par frame
        this.keyboardPanSpeedMultiplier = 3; // Multiplicateur avec Shift

        // Dernière position de souris en tuiles
        this.lastMouseTile = { x: 0, y: 0 };
    }

    /**
     * Initialise la carte
     */
    init() {
        this.canvas = document.getElementById('campaignMap');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        // Créer les renderers
        this.tileRenderer = new TileRenderer(this.canvas, this.game);
        this.minimapRenderer = new MinimapRenderer(this.minimapCanvas, this.game);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupControls();

        // Passer la référence à game pour le debug
        this.game.lastMouseTile = this.lastMouseTile;
    }

    /**
     * Redimensionne les canvas
     */
    resize() {
        const topBar = document.getElementById('topBar');
        const width = window.innerWidth;
        const height = window.innerHeight - (topBar ? topBar.offsetHeight : 0);

        this.canvas.width = width;
        this.canvas.height = height;

        if (this.tileRenderer) {
            this.tileRenderer.resize(width, height);
        }

        // Minimap
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 150;

        if (this.minimapRenderer) {
            this.minimapRenderer.resize(200, 150);
        }
    }

    /**
     * Configure les contrôles de la souris
     */
    setupControls() {
        // Événements sur le canvas principal
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.onRightClick(e);
        });

        // Événements sur la minimap
        this.minimapCanvas.addEventListener('click', (e) => this.onMinimapClick(e));

        // Événements clavier pour le déplacement de la caméra
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    /**
     * Centre la caméra sur une position en tuiles
     */
    centerOn(tileX, tileY) {
        if (this.tileRenderer) {
            this.tileRenderer.centerOn(tileX, tileY);
        }
    }

    /**
     * Centre la caméra sur une position en pixels (compatibilité)
     * @deprecated Utiliser centerOn avec des coordonnées tuiles
     */
    centerOnPixels(pixelX, pixelY) {
        const tileX = Math.floor(pixelX * MAP_CONFIG.GRID_WIDTH / 800);
        const tileY = Math.floor(pixelY * MAP_CONFIG.GRID_HEIGHT / 600);
        this.centerOn(tileX, tileY);
    }

    /**
     * Convertit les coordonnées écran en coordonnées tuile
     */
    screenToTile(screenX, screenY) {
        if (!this.tileRenderer) return { x: 0, y: 0 };
        return this.tileRenderer.screenToTile(screenX, screenY);
    }

    // ========== ÉVÉNEMENTS SOURIS ==========

    onMouseDown(e) {
        // Clic gauche ou molette = début du drag
        if (e.button === 0 || e.button === 1) {
            this.isDragging = true;
            this.hasDragged = false; // Pour différencier clic et drag
            this.dragButton = e.button;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.dragStartPos = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Mettre à jour la position de la souris en tuiles
        this.lastMouseTile = this.screenToTile(mouseX, mouseY);
        this.game.lastMouseTile = this.lastMouseTile;

        // Gestion du drag (clic gauche ou molette)
        if (this.isDragging) {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;

            // Détecter si on a vraiment bougé (seuil de 5 pixels)
            const totalDx = e.clientX - this.dragStartPos.x;
            const totalDy = e.clientY - this.dragStartPos.y;
            if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
                this.hasDragged = true;
            }

            if (this.tileRenderer && (dx !== 0 || dy !== 0)) {
                this.tileRenderer.pan(dx, dy);
            }

            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }

        // Mode mouvement d'armée (quand une armée du joueur est sélectionnée)
        if (this.game.selectedArmy && this.game.selectedArmy.faction === this.game.playerFaction) {
            this.updateMovementPreview(this.lastMouseTile);
        }
    }

    onMouseUp(e) {
        if (e.button === 0 || e.button === 1) {
            const wasDragging = this.hasDragged;
            this.isDragging = false;
            this.canvas.style.cursor = 'default';

            // Gérer le clic ici au lieu de onClick pour éviter les problèmes de timing
            if (e.button === 0 && !wasDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const tilePos = this.screenToTile(mouseX, mouseY);
                this.game.handleMapClick(tilePos);
            }

            // Reset après traitement
            this.hasDragged = false;
        }
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.tileRenderer) {
            this.tileRenderer.zoom(e.deltaY, mouseX, mouseY);
        }
    }

    onClick(e) {
        // Le clic gauche est maintenant géré dans onMouseUp pour éviter
        // les problèmes de timing avec le drag
        // Cette méthode est conservée pour d'éventuels usages futurs
    }

    onRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const tilePos = this.screenToTile(mouseX, mouseY);

        this.game.handleMapRightClick(tilePos);
    }

    onDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const tilePos = this.screenToTile(mouseX, mouseY);

        this.game.handleMapDoubleClick(tilePos);
    }

    onMinimapClick(e) {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.minimapRenderer) {
            const tile = this.minimapRenderer.handleClick(x, y);
            this.centerOn(tile.x, tile.y);
        }
    }

    // ========== ÉVÉNEMENTS CLAVIER ==========

    onKeyDown(e) {
        // Ne pas traiter si on est dans un champ de saisie
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ne traiter que si on est sur l'écran de campagne
        if (this.game.state !== 'campaign') {
            return;
        }

        const key = e.key.toLowerCase();

        // Touches de déplacement : ZQSD et flèches
        if (['z', 'q', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
            this.keysPressed.add(key);
            // Empêcher le scroll avec les flèches
            if (key.startsWith('arrow')) {
                e.preventDefault();
            }
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keysPressed.delete(key);
    }

    /**
     * Met à jour la caméra selon les touches pressées
     */
    updateKeyboardPan() {
        if (this.keysPressed.size === 0 || !this.tileRenderer) {
            return;
        }

        // Vitesse de base, multipliée si Shift est enfoncé
        const speed = this.keysPressed.has('shift')
            ? this.keyboardPanSpeed * this.keyboardPanSpeedMultiplier
            : this.keyboardPanSpeed;

        let dx = 0;
        let dy = 0;

        // ZQSD (clavier français)
        if (this.keysPressed.has('z') || this.keysPressed.has('arrowup')) {
            dy += speed;
        }
        if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
            dy -= speed;
        }
        if (this.keysPressed.has('q') || this.keysPressed.has('arrowleft')) {
            dx += speed;
        }
        if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
            dx -= speed;
        }

        if (dx !== 0 || dy !== 0) {
            this.tileRenderer.pan(dx, dy);
        }
    }

    // ========== MOUVEMENT ==========

    /**
     * Met à jour la prévisualisation du mouvement
     */
    updateMovementPreview(targetTile) {
        if (!this.game.selectedArmy || !this.game.pathfinder) {
            this.game.movementPreview = null;
            return;
        }

        const army = this.game.selectedArmy;
        const startTile = {
            x: army.tileX !== undefined ? army.tileX : Math.floor(army.x / 2),
            y: army.tileY !== undefined ? army.tileY : Math.floor(army.y / 2)
        };

        const preview = this.game.pathfinder.getMovementPreview(
            startTile,
            targetTile,
            army.movementPoints,
            {
                unitType: 'infantry', // TODO: déterminer depuis l'armée
                season: this.game.season,
                maxMovement: army.maxMovement
            }
        );

        this.game.movementPreview = preview;
    }

    /**
     * Démarre le mode mouvement
     */
    startMoveMode() {
        this.isMovingArmy = true;
        this.canvas.style.cursor = 'crosshair';

        // Calculer les tuiles accessibles
        if (this.game.selectedArmy && this.game.pathfinder) {
            const army = this.game.selectedArmy;
            const startTile = {
                x: army.tileX !== undefined ? army.tileX : Math.floor(army.x / 2),
                y: army.tileY !== undefined ? army.tileY : Math.floor(army.y / 2)
            };

            this.game.reachableTiles = this.game.pathfinder.getReachableTiles(
                startTile,
                army.movementPoints,
                {
                    unitType: 'infantry',
                    season: this.game.season
                }
            );
        }
    }

    /**
     * Arrête le mode mouvement
     */
    stopMoveMode() {
        this.isMovingArmy = false;
        this.movePath = [];
        this.game.movementPreview = null;
        this.game.reachableTiles = null;
        this.canvas.style.cursor = 'default';
    }

    // ========== RENDU ==========

    /**
     * Rendu principal
     */
    render() {
        if (!this.tileRenderer) return;

        // Mise à jour du déplacement clavier
        this.updateKeyboardPan();

        // Rendu de la carte
        this.tileRenderer.render();
    }

    /**
     * Rendu de la minimap
     */
    renderMinimap() {
        if (!this.minimapRenderer || !this.tileRenderer) return;

        this.minimapRenderer.render(
            this.tileRenderer.camera.x,
            this.tileRenderer.camera.y,
            this.canvas.width,
            this.canvas.height,
            this.tileRenderer.camera.zoom
        );
    }

    // ========== ACCESSEURS ==========

    /**
     * Obtient la position de la caméra
     */
    getCamera() {
        if (!this.tileRenderer) return { x: 0, y: 0, zoom: 1 };
        return this.tileRenderer.camera;
    }

    /**
     * Définit la position de la caméra
     */
    setCamera(x, y, zoom) {
        if (!this.tileRenderer) return;
        this.tileRenderer.camera.x = x;
        this.tileRenderer.camera.y = y;
        if (zoom !== undefined) {
            this.tileRenderer.camera.zoom = zoom;
        }
        this.tileRenderer.clampCamera();
    }

    /**
     * Invalide le cache du terrain de la minimap
     */
    invalidateMinimapTerrain() {
        if (this.minimapRenderer) {
            this.minimapRenderer.invalidateTerrain();
        }
    }
}

export default CampaignMap;
