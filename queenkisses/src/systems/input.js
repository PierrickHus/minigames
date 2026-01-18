/**
 * Gestionnaire centralisé des inputs (clavier et souris)
 * Responsabilité unique: capturer et fournir l'état des inputs
 */
export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // État des touches
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // État de la souris
        this.mouse = {
            x: 0,
            y: 0,
            isPressed: false,
            isHovering: false
        };

        this.setupEventListeners();
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Clavier
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Souris
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', () => this.handleMouseDown());
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseenter', () => this.handleMouseEnter());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    /**
     * Gère l'appui d'une touche
     * @param {KeyboardEvent} e - Événement clavier
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'z':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 's':
                this.keys.down = true;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'q':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = true;
                break;
        }
    }

    /**
     * Gère le relâchement d'une touche
     * @param {KeyboardEvent} e - Événement clavier
     */
    handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'z':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
                this.keys.down = false;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'q':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = false;
                break;
        }
    }

    /**
     * Gère le mouvement de la souris
     * @param {MouseEvent} e - Événement souris
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    /**
     * Gère l'appui du bouton de la souris
     */
    handleMouseDown() {
        this.mouse.isPressed = true;
    }

    /**
     * Gère le relâchement du bouton de la souris
     */
    handleMouseUp() {
        this.mouse.isPressed = false;
    }

    /**
     * Gère l'entrée de la souris dans le canvas
     */
    handleMouseEnter() {
        this.mouse.isHovering = true;
    }

    /**
     * Gère la sortie de la souris du canvas
     */
    handleMouseLeave() {
        this.mouse.isHovering = false;
        this.mouse.isPressed = false;
    }

    /**
     * Vérifie si une touche directionnelle est pressée
     * @returns {boolean} True si au moins une direction est active
     */
    hasDirectionalInput() {
        return this.keys.up || this.keys.down || this.keys.left || this.keys.right;
    }

    /**
     * Nettoie les écouteurs d'événements
     */
    dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseenter', this.handleMouseEnter);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    }
}
