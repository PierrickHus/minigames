/**
 * Gestionnaire centralisé des entrées clavier et souris
 * Traque l'état des touches et de la souris, gère le pointer lock
 */
export class InputManager {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas pour le pointer lock
     */
    constructor(canvas) {
        this._canvas = canvas;

        /** @type {Set<string>} Touches actuellement enfoncées */
        this._keysDown = new Set();

        /** @type {Set<number>} Boutons souris enfoncés */
        this._mouseDown = new Set();

        this._mouseDeltaX = 0;
        this._mouseDeltaY = 0;
        this._pointerLocked = false;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        document.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mouseup', this._onMouseUp);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
    }

    /**
     * Vérifie si une touche est enfoncée
     * @param {string} key - Code de la touche (ex: 'KeyW', 'ShiftLeft')
     * @returns {boolean}
     */
    isKeyDown(key) {
        return this._keysDown.has(key);
    }

    /**
     * Vérifie si un bouton souris est enfoncé
     * @param {number} button - Numéro du bouton (0 = gauche, 2 = droit)
     * @returns {boolean}
     */
    isMouseDown(button) {
        return this._mouseDown.has(button);
    }

    /**
     * Récupère le mouvement souris depuis le dernier reset
     * @returns {{ x: number, y: number }}
     */
    getMouseDelta() {
        return { x: this._mouseDeltaX, y: this._mouseDeltaY };
    }

    /** Remet à zéro le delta souris (à appeler en fin de frame) */
    resetMouseDelta() {
        this._mouseDeltaX = 0;
        this._mouseDeltaY = 0;
    }

    /** @returns {boolean} */
    get isPointerLocked() {
        return this._pointerLocked;
    }

    /** Demande le verrouillage du pointeur */
    requestPointerLock() {
        this._canvas.requestPointerLock();
    }

    /** Libère le verrouillage du pointeur */
    exitPointerLock() {
        document.exitPointerLock();
    }

    /** @param {KeyboardEvent} e */
    _onKeyDown(e) {
        this._keysDown.add(e.code);
    }

    /** @param {KeyboardEvent} e */
    _onKeyUp(e) {
        this._keysDown.delete(e.code);
    }

    /** @param {MouseEvent} e */
    _onMouseDown(e) {
        this._mouseDown.add(e.button);
    }

    /** @param {MouseEvent} e */
    _onMouseUp(e) {
        this._mouseDown.delete(e.button);
    }

    /** @param {MouseEvent} e */
    _onMouseMove(e) {
        if (this._pointerLocked) {
            this._mouseDeltaX += e.movementX;
            this._mouseDeltaY += e.movementY;
        }
    }

    _onPointerLockChange() {
        this._pointerLocked = document.pointerLockElement === this._canvas;
    }

    /** Libère les event listeners */
    dispose() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        document.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    }
}
